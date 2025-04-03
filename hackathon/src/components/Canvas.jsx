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

      // Resize handler
      const handleResize = () => {
        canvas.setWidth(window.innerWidth - 100)
        canvas.setHeight(window.innerHeight - 200)
        canvas.renderAll()
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        canvas.dispose()
      }
    }
  }, [boardId, addElement, updateElement, socket])

  // Setup socket connection
  useEffect(() => {
    if (!socket) {
      initSocket()
    }

    if (socket && boardId) {
      socket.emit('join-board', boardId, { 
        name: username,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      })

      socket.on('element-drawn', (element) => {
        if (!fabricRef.current) return
        
        fabric.util.enlivenObjects([element.data], (objects) => {
          const obj = objects[0]
          obj.id = element.id
          obj._ignoreSave = true
          fabricRef.current.add(obj)
          fabricRef.current.renderAll()
        })
        
        addElement(element)
      })

      socket.on('element-updated', (element) => {
        if (!fabricRef.current) return
        
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
      })

      socket.on('element-deleted', (elementId) => {
        if (!fabricRef.current) return
        
        const objects = fabricRef.current.getObjects()
        const targetObj = objects.find(obj => obj.id === elementId)
        
        if (targetObj) {
          fabricRef.current.remove(targetObj)
          fabricRef.current.renderAll()
        }
        
        removeElement(elementId)
      })

      return () => {
        socket.off('element-drawn')
        socket.off('element-updated')
        socket.off('element-deleted')
      }
    }
  }, [socket, boardId, addElement, updateElement, removeElement, username, initSocket])

  // Load saved elements
  useEffect(() => {
    if (fabricRef.current && elements.length > 0) {
      elements.forEach(element => {
        fabric.util.enlivenObjects([element.data], (objects) => {
          const obj = objects[0]
          obj.id = element.id
          obj._ignoreSave = true
          fabricRef.current.add(obj)
        })
      })
      
      fabricRef.current.renderAll()
    }
  }, [elements])

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default Canvas
