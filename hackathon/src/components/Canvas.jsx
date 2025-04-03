import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { useBoardStore } from '../store/boardStore'
import { useSocketStore } from '../store/socketStore'
import { generateRandomUsername } from '../utils/helpers'

function Canvas({ boardId }) {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const { elements, addElement, updateElement, removeElement } = useBoardStore()
  const { socket, initSocket } = useSocketStore()
  const [username] = useState(generateRandomUsername)

  // Initialize fabric canvas
  useEffect(() => {
    if (canvasRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 100,
        height: window.innerHeight - 200,
        backgroundColor: 'white',
        isDrawingMode: false
      })

      const canvas = fabricRef.current
      
      // Make canvas accessible to Toolbar component
      window.fabricCanvas = canvas
      
      // Setup event listeners for object modifications
      canvas.on('object:added', (e) => {
        if (!e.target || e.target._ignoreSave) return
        
        const serializedObj = e.target.toJSON()
        const elementId = e.target.id || Date.now().toString()
        e.target.id = elementId
        
        addElement({
          id: elementId,
          type: e.target.type,
          data: serializedObj
        })
        
        if (socket) {
          socket.emit('draw-element', boardId, {
            id: elementId,
            type: e.target.type,
            data: serializedObj
          })
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

      // Mouse move event for cursor position
      canvas.on('mouse:move', (e) => {
        if (socket) {
          const pointer = canvas.getPointer(e.e)
          socket.emit('cursor-move', boardId, { x: pointer.x, y: pointer.y })
        }
      })

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
      // Join the board room
      socket.emit('join-board', boardId, { 
        name: username,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      })

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
      }
    }
  }, [socket, boardId, username, addElement, updateElement, removeElement, initSocket])

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
    <div className="w-full h-full overflow-auto bg-white">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default Canvas
