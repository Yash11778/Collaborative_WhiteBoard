import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { useBoardStore } from '../store/boardStore'
import { useSocketStore } from '../store/socketStore'
import { useAuthStore } from '../store/authStore'
import { generateRandomUsername } from '../utils/helpers'
import UserPresence from './UserPresence'

function Canvas({ boardId }) {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const { elements, addElement, updateElement, removeElement } = useBoardStore()
  const { socket, initSocket } = useSocketStore()
  const { user, token, isAuthenticated } = useAuthStore()
  const [username] = useState(generateRandomUsername)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [lastEmittedPosition, setLastEmittedPosition] = useState({ x: 0, y: 0 })
  const throttleTimeout = useRef(null)

  // Initialize fabric canvas
  useEffect(() => {
    if (canvasRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 100,
        height: window.innerHeight - 200,
        backgroundColor: 'white',
        isDrawingMode: false,
        // Enable higher quality rendering for exports
        preserveObjectStacking: true,
        imageSmoothingEnabled: true
      })

      const canvas = fabricRef.current
      
      // Make canvas accessible to Toolbar component
      window.fabricCanvas = canvas
      
      // Configure text editing behavior to prevent overlaps
      fabric.IText.prototype.onDeselect = function() {
        // When text is deselected, make sure it's not empty
        if (this.text === '' || this.text === 'Text') {
          canvas.remove(this);
        }
      };
      
      // Setup event listeners for object modifications
      canvas.on('object:added', (e) => {
        if (!e.target || e.target._ignoreSave || e.target.eraserIndicator) return;
        
        // Prevent duplicate handling of the same element
        if (e.target._addedToStore) return;
        
        const serializedObj = e.target.toJSON();
        const elementId = e.target.id || Date.now().toString();
        e.target.id = elementId;
        
        // Mark as added to prevent duplicate addition
        e.target._addedToStore = true;
        
        addElement({
          id: elementId,
          type: e.target.type,
          data: serializedObj
        });
        
        if (socket) {
          socket.emit('draw-element', boardId, {
            id: elementId,
            type: e.target.type,
            data: serializedObj
          });
        }
      })

      canvas.on('object:modified', (e) => {
        if (!e.target || !e.target.id) return
        
        const serializedObj = e.target.toJSON()
        
        updateElement({
          id: e.target.id,
          type: e.target.type,
          data: serializedObj
        })
        
        if (socket) {
          socket.emit('update-element', boardId, {
            id: e.target.id,
            type: e.target.type,
            data: serializedObj
          })
        }
      })

      // Track cursor position with throttling
      const handleMouseMove = (e) => {
        const pointer = canvas.getPointer(e.e);
        const canvasRect = canvasContainerRef.current.getBoundingClientRect();
        
        // Calculate absolute position within the page (not just canvas)
        const absoluteX = canvasRect.left + pointer.x;
        const absoluteY = canvasRect.top + pointer.y;
        
        setCursorPosition({ x: absoluteX, y: absoluteY });
        
        // Throttle socket emissions for better performance
        if (socket && !throttleTimeout.current) {
          throttleTimeout.current = setTimeout(() => {
            // Only emit if the cursor has moved significantly
            const dx = absoluteX - lastEmittedPosition.x;
            const dy = absoluteY - lastEmittedPosition.y;
            
            // If cursor has moved at least 5px, emit position
            if (Math.sqrt(dx*dx + dy*dy) > 5) {
              socket.emit('cursor-move', boardId, { 
                x: absoluteX, 
                y: absoluteY 
              });
              setLastEmittedPosition({ x: absoluteX, y: absoluteY });
            }
            
            throttleTimeout.current = null;
          }, 50); // Throttle to emit at most once every 50ms
        }
      };

      // Add cursor tracking and throttled emission
      canvas.on('mouse:move', handleMouseMove);

      // Setup drawing tools
      const handleKeyDown = function(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length) {
            activeObjects.forEach(obj => {
              if (obj.id) {
                removeElement(obj.id);
                socket?.emit('delete-element', boardId, obj.id);
              }
              canvas.remove(obj);
            });
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Resize handler
      const handleResize = () => {
        canvas.setWidth(window.innerWidth - 100)
        canvas.setHeight(window.innerHeight - 200)
        canvas.renderAll()
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('keydown', handleKeyDown)
        window.fabricCanvas = undefined
        canvas.off('mouse:move', handleMouseMove);
        
        if (throttleTimeout.current) {
          clearTimeout(throttleTimeout.current);
        }
        
        canvas.dispose()
      }
    }
  }, [boardId, addElement, updateElement, removeElement, socket])

  // Setup socket connection
  useEffect(() => {
    if (!socket) {
      const newSocket = initSocket();
      
      if (!newSocket) {
        console.error("Failed to initialize socket connection");
        return;
      }
    }

    if (socket && boardId) {
      // Join the board room with authenticated user data if available
      const userData = isAuthenticated && user ? {
        name: user.username,
        color: user.color,
        token: token
      } : { 
        name: generateRandomUsername(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };
      
      socket.emit('join-board', boardId, userData);

      // Make socket available globally for eraser tool
      window.socket = socket;

      // Handle incoming socket events
      const handleElementDrawn = (element) => {
        if (!fabricRef.current) return
        
        try {
          fabric.util.enlivenObjects([element.data], (objects) => {
            const obj = objects[0]
            obj.id = element.id
            obj._ignoreSave = true
            fabricRef.current.add(obj)
            fabricRef.current.renderAll()
          })
          
          addElement(element)
        } catch (error) {
          console.error('Error handling element-drawn event:', error)
        }
      }

      const handleElementUpdated = (element) => {
        if (!fabricRef.current) return
        
        try {
          const objects = fabricRef.current.getObjects()
          const existingObject = objects.find(obj => obj.id === element.id)
          
          if (existingObject) {
            fabric.util.enlivenObjects([element.data], (objects) => {
              const obj = objects[0]
              obj.id = element.id
              fabricRef.current.remove(existingObject)
              fabricRef.current.add(obj)
              fabricRef.current.renderAll()
            })
          }
          
          updateElement(element)
        } catch (error) {
          console.error('Error handling element-updated event:', error)
        }
      }

      const handleElementDeleted = (elementId) => {
        if (!fabricRef.current) return
        
        try {
          const objects = fabricRef.current.getObjects()
          const targetObj = objects.find(obj => obj.id === elementId)
          
          if (targetObj) {
            fabricRef.current.remove(targetObj)
            fabricRef.current.renderAll()
          }
          
          removeElement(elementId)
        } catch (error) {
          console.error('Error handling element-deleted event:', error)
        }
      }

      socket.on('element-drawn', handleElementDrawn)
      socket.on('element-updated', handleElementUpdated)
      socket.on('element-deleted', handleElementDeleted)

      return () => {
        socket.off('element-drawn', handleElementDrawn)
        socket.off('element-updated', handleElementUpdated)
        socket.off('element-deleted', handleElementDeleted)
        window.socket = undefined;
      }
    }
  }, [socket, boardId, user, token, isAuthenticated, addElement, updateElement, removeElement, initSocket])

  // Load saved elements
  useEffect(() => {
    if (fabricRef.current && elements && elements.length > 0) {
      try {
        elements.forEach(element => {
          if (element && element.data) {
            fabric.util.enlivenObjects([element.data], (objects) => {
              if (objects && objects.length > 0) {
                const obj = objects[0]
                obj.id = element.id
                obj._ignoreSave = true
                fabricRef.current.add(obj)
              }
            })
          }
        })
        
        fabricRef.current.renderAll()
      } catch (error) {
        console.error('Error loading saved elements:', error)
      }
    }
  }, [elements])

  return (
    <div className="w-full h-full overflow-auto bg-white relative" ref={canvasContainerRef}>
      <canvas ref={canvasRef} />
      
      {/* Add the user presence component for cursor visualization */}
      <UserPresence boardId={boardId} />
    </div>
  )
}

export default Canvas
