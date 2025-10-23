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
      
      // Don't add global text deselect handler - let individual text objects handle it
      
      // Track when an object is being selected/moved to prevent duplication
      let isObjectBeingManipulated = false;
      
      // Real-time text editing sync
      canvas.on('text:changed', (e) => {
        if (!e.target || !e.target.id || !socket) return;
        
        // Throttle text updates to avoid overwhelming the server
        clearTimeout(e.target._textUpdateTimeout);
        e.target._textUpdateTimeout = setTimeout(() => {
          const serializedObj = e.target.toJSON();
          socket.emit('update-element', boardId, {
            id: e.target.id,
            type: e.target.type,
            data: serializedObj
          });
        }, 300); // Wait 300ms after last keystroke
      });
      
      canvas.on('selection:created', () => {
        isObjectBeingManipulated = true;
        
        // Broadcast selection to other users
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.id && socket) {
          socket.emit('object-selected', boardId, {
            userId: socket.id,
            objectId: activeObj.id
          });
        }
      });
      
      canvas.on('selection:updated', () => {
        isObjectBeingManipulated = true;
        
        // Broadcast selection change
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.id && socket) {
          socket.emit('object-selected', boardId, {
            userId: socket.id,
            objectId: activeObj.id
          });
        }
      });
      
      canvas.on('selection:cleared', () => {
        setTimeout(() => {
          isObjectBeingManipulated = false;
        }, 100);
        
        // Broadcast deselection
        if (socket) {
          socket.emit('object-deselected', boardId, {
            userId: socket.id
          });
        }
      });
      
      // Setup event listeners for object modifications
      canvas.on('object:added', (e) => {
        if (!e.target || e.target._ignoreSave || e.target.eraserIndicator) return;
        
        // Prevent duplicate handling of the same element
        if (e.target._addedToStore || e.target._loadedFromStore) return;
        
        // Skip if object is being manipulated (moved, scaled, etc)
        if (e.target._isBeingMoved || e.target._isBeingScaled || e.target._isBeingRotated || e.target._isBeingManipulated) {
          // Make sure to mark it so it won't be re-added later
          if (e.target.id) {
            e.target._addedToStore = true;
            e.target._loadedFromStore = true;
          }
          return;
        }
        
        // Skip if this object already has an ID (it's existing, not new)
        if (e.target.id) {
          const existsInStore = elements.some(el => el.id === e.target.id);
          if (existsInStore) {
            e.target._addedToStore = true;
            e.target._loadedFromStore = true;
            return;
          }
        }
        
        const serializedObj = e.target.toJSON();
        const elementId = e.target.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        e.target.id = elementId;
        
        // Mark as added to prevent duplicate addition
        e.target._addedToStore = true;
        
        addElement({
          id: elementId,
          type: e.target.type,
          data: serializedObj
        });
        
        if (socket) {
          console.log('🎨 Emitting draw-element:', elementId);
          socket.emit('draw-element', boardId, {
            id: elementId,
            type: e.target.type,
            data: serializedObj
          });
        }
      })

      canvas.on('object:modified', (e) => {
        if (!e.target || !e.target.id) return
        
        // Clean up movement flags
        delete e.target._isBeingMoved;
        delete e.target._isBeingScaled;
        delete e.target._isBeingRotated;
        delete e.target._isBeingManipulated;
        
        // Ensure the object keeps its flags after modification
        if (!e.target._addedToStore) {
          e.target._addedToStore = true;
        }
        if (!e.target._loadedFromStore && e.target._ignoreSave) {
          e.target._loadedFromStore = true;
        }
        
        const serializedObj = e.target.toJSON()
        
        updateElement({
          id: e.target.id,
          type: e.target.type,
          data: serializedObj
        })
        
        if (socket) {
          console.log('✏️ Emitting update-element:', e.target.id);
          socket.emit('update-element', boardId, {
            id: e.target.id,
            type: e.target.type,
            data: serializedObj
          })
        }
      })
      
      // Clean up manipulation flags when mouse is released
      canvas.on('mouse:up', (e) => {
        if (e.target) {
          // Delay cleanup slightly to ensure object:modified fires first
          setTimeout(() => {
            delete e.target._isBeingManipulated;
            delete e.target._isBeingMoved;
          }, 50);
        }
      });

      // Track when objects are being moved to prevent duplication
      // These events fire BEFORE object:added during drag operations
      canvas.on('mouse:down', (e) => {
        if (e.target && e.target !== canvas) {
          e.target._isBeingManipulated = true;
          e.target._isBeingMoved = true;
        }
      });

      canvas.on('object:moving', (e) => {
        if (e.target) {
          e.target._isBeingMoved = true;
          e.target._isBeingManipulated = true;
        }
      });

      canvas.on('object:scaling', (e) => {
        if (e.target) {
          e.target._isBeingScaled = true;
          e.target._isBeingManipulated = true;
        }
      });

      canvas.on('object:rotating', (e) => {
        if (e.target) {
          e.target._isBeingRotated = true;
          e.target._isBeingManipulated = true;
        }
      });

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

      // Setup keyboard shortcuts for copy/paste/duplicate
      const handleKeyDown = function(e) {
        // Delete key
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
        
        // Ctrl+D or Ctrl+Shift+D for duplicate
        if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            activeObject.clone((cloned) => {
              cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
              });
              
              // Clear old flags and ID
              delete cloned.id;
              delete cloned._addedToStore;
              delete cloned._loadedFromStore;
              delete cloned._ignoreSave;
              
              canvas.add(cloned);
              canvas.setActiveObject(cloned);
              canvas.requestRenderAll();
            });
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
        console.log('📥 Received element-drawn:', element.id);
        if (!fabricRef.current) return
        
        try {
          fabric.util.enlivenObjects([element.data], (objects) => {
            const obj = objects[0]
            obj.id = element.id
            obj._ignoreSave = true
            obj._loadedFromStore = true
            obj._addedToStore = true
            fabricRef.current.add(obj)
            fabricRef.current.renderAll()
          })
          
          addElement(element)
        } catch (error) {
          console.error('Error handling element-drawn event:', error)
        }
      }

      const handleElementUpdated = (element) => {
        console.log('📥 Received element-updated:', element.id);
        if (!fabricRef.current) return
        
        try {
          const objects = fabricRef.current.getObjects()
          const existingObject = objects.find(obj => obj.id === element.id)
          
          if (existingObject) {
            // Update the existing object's properties instead of replacing it
            existingObject.set(element.data);
            existingObject.setCoords();
            
            // Ensure flags are maintained
            existingObject._ignoreSave = true;
            existingObject._loadedFromStore = true;
            existingObject._addedToStore = true;
            existingObject.id = element.id;
            
            fabricRef.current.renderAll();
          } else {
            // Object doesn't exist, add it
            fabric.util.enlivenObjects([element.data], (objects) => {
              const obj = objects[0]
              obj.id = element.id
              obj._ignoreSave = true
              obj._loadedFromStore = true
              obj._addedToStore = true
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

      // Handle grid toggle from other users
      const handleGridToggled = ({ showGrid }) => {
        const canvas = fabricRef.current
        if (!canvas) return

        const gridSize = 20
        const width = canvas.width
        const height = canvas.height

        if (showGrid) {
          // Remove existing grid if any
          const objectsToRemove = canvas.getObjects().filter(obj => obj.isGridLine)
          objectsToRemove.forEach(obj => canvas.remove(obj))

          // Create vertical lines
          for (let i = 0; i <= width / gridSize; i++) {
            const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
              stroke: '#e0e0e0',
              strokeWidth: 1,
              selectable: false,
              evented: false,
              isGridLine: true,
              _ignoreSave: true
            })
            canvas.add(line)
            canvas.sendToBack(line)
          }

          // Create horizontal lines
          for (let i = 0; i <= height / gridSize; i++) {
            const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
              stroke: '#e0e0e0',
              strokeWidth: 1,
              selectable: false,
              evented: false,
              isGridLine: true,
              _ignoreSave: true
            })
            canvas.add(line)
            canvas.sendToBack(line)
          }
        } else {
          // Remove grid
          const gridLines = canvas.getObjects().filter(obj => obj.isGridLine)
          gridLines.forEach(obj => canvas.remove(obj))
        }

        canvas.renderAll()
      }

      // Handle zoom changes from other users
      const handleZoomChanged = ({ zoomLevel }) => {
        const canvas = fabricRef.current
        if (!canvas) return

        canvas.setZoom(zoomLevel / 100)
        canvas.renderAll()
      }

      socket.on('grid-toggled', handleGridToggled)
      socket.on('zoom-changed', handleZoomChanged)

      // Handle object selection from other users (visual indicator)
      const handleObjectSelected = ({ userId, objectId }) => {
        if (!fabricRef.current || userId === socket.id) return;
        
        const canvas = fabricRef.current;
        const obj = canvas.getObjects().find(o => o.id === objectId);
        
        if (obj) {
          // Add a subtle indicator that someone else is editing this
          obj.set({
            borderColor: 'rgba(59, 130, 246, 0.5)',
            cornerColor: 'rgba(59, 130, 246, 0.8)',
          });
          canvas.renderAll();
        }
      };
      
      const handleObjectDeselected = ({ userId }) => {
        if (!fabricRef.current || userId === socket.id) return;
        
        // Reset border colors for all objects
        const canvas = fabricRef.current;
        canvas.getObjects().forEach(obj => {
          if (obj.borderColor === 'rgba(59, 130, 246, 0.5)') {
            obj.set({
              borderColor: 'rgba(178,204,255,1)',
              cornerColor: 'white',
            });
          }
        });
        canvas.renderAll();
      };

      socket.on('object-selected', handleObjectSelected);
      socket.on('object-deselected', handleObjectDeselected);

      return () => {
        socket.off('element-drawn', handleElementDrawn)
        socket.off('element-updated', handleElementUpdated)
        socket.off('element-deleted', handleElementDeleted)
        socket.off('grid-toggled', handleGridToggled)
        socket.off('zoom-changed', handleZoomChanged)
        socket.off('object-selected', handleObjectSelected)
        socket.off('object-deselected', handleObjectDeselected)
        window.socket = undefined;
      }
    }
  }, [socket, boardId, user, token, isAuthenticated, addElement, updateElement, removeElement, initSocket])

  // Load saved elements
  useEffect(() => {
    if (fabricRef.current && elements && elements.length > 0) {
      // Clear canvas before loading to prevent duplicates
      const canvas = fabricRef.current;
      const existingObjects = canvas.getObjects();
      
      // Remove only objects that were loaded from store (not user-drawn)
      existingObjects.forEach(obj => {
        if (obj._loadedFromStore || obj._ignoreSave) {
          canvas.remove(obj);
        }
      });
      
      try {
        elements.forEach(element => {
          if (element && element.data) {
            fabric.util.enlivenObjects([element.data], (objects) => {
              if (objects && objects.length > 0) {
                const obj = objects[0]
                obj.id = element.id
                obj._ignoreSave = true
                obj._loadedFromStore = true  // Mark as loaded to prevent duplication
                obj._addedToStore = true     // Mark to prevent re-adding to store
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
