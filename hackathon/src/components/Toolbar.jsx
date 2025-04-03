import { useState, useEffect } from 'react'
import { FaMousePointer, FaPen, FaSquare, FaCircle, FaFont, FaUndo, FaRedo, FaSave, FaTrash } from 'react-icons/fa'
import { useBoardStore } from '../store/boardStore'
import { fabric } from 'fabric'

function Toolbar({ boardId }) {
  const [activeTool, setActiveTool] = useState('select')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const { canUndo, canRedo, undo, redo, saveBoard } = useBoardStore()
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  // Check if canvas is ready
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.fabricCanvas) {
        clearInterval(interval)
        // Initialize with the select tool
        handleToolChange('select')
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  const handleToolChange = (tool) => {
    setActiveTool(tool)
    
    const canvas = window.fabricCanvas
    if (!canvas) {
      console.error('Canvas not initialized')
      return
    }

    // Configure canvas based on selected tool
    switch (tool) {
      case 'select':
        canvas.isDrawingMode = false
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'move'
        // Deselect any active drawing event handlers
        canvas.off('mouse:down')
        canvas.off('mouse:move')
        canvas.off('mouse:up')
        break
        
      case 'pen':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush.color = strokeColor
        canvas.freeDrawingBrush.width = strokeWidth
        break
        
      case 'rectangle':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        let rect, isDown, origX, origY
        
        canvas.off('mouse:down')
        canvas.off('mouse:move')
        canvas.off('mouse:up')
        
        canvas.on('mouse:down', (o) => {
          isDown = true
          const pointer = canvas.getPointer(o.e)
          origX = pointer.x
          origY = pointer.y
          rect = new fabric.Rect({
            left: origX,
            top: origY,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth: strokeWidth
          })
          canvas.add(rect)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isDown) return
          const pointer = canvas.getPointer(o.e)
          
          if (pointer.x < origX) {
            rect.set({ left: pointer.x })
          }
          if (pointer.y < origY) {
            rect.set({ top: pointer.y })
          }
          
          rect.set({
            width: Math.abs(pointer.x - origX),
            height: Math.abs(pointer.y - origY)
          })
          
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isDown = false
          rect.setCoords()
          canvas.setActiveObject(rect)
        })
        break
        
      case 'circle':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        
        let circle, isDrawing, startX, startY
        
        canvas.off('mouse:down')
        canvas.off('mouse:move')
        canvas.off('mouse:up')
        
        canvas.on('mouse:down', (o) => {
          isDrawing = true
          const pointer = canvas.getPointer(o.e)
          startX = pointer.x
          startY = pointer.y
          circle = new fabric.Circle({
            left: startX,
            top: startY,
            originX: 'left',
            originY: 'top',
            radius: 0,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth: strokeWidth
          })
          canvas.add(circle)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isDrawing) return
          const pointer = canvas.getPointer(o.e)
          const radius = Math.sqrt(
            Math.pow(startX - pointer.x, 2) + Math.pow(startY - pointer.y, 2)
          ) / 2
          
          circle.set({
            radius: radius,
            left: startX - radius,
            top: startY - radius
          })
          
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isDrawing = false
          circle.setCoords()
          canvas.setActiveObject(circle)
        })
        break
        
      case 'text':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'text'
        
        canvas.off('mouse:down')
        canvas.off('mouse:move')
        canvas.off('mouse:up')
        
        canvas.on('mouse:down', (o) => {
          const pointer = canvas.getPointer(o.e)
          const text = new fabric.IText('Text', {
            left: pointer.x,
            top: pointer.y,
            fontSize: 20,
            fill: strokeColor
          })
          canvas.add(text)
          canvas.setActiveObject(text)
          text.enterEditing()
        })
        break
        
      default:
        break
    }
  }

  const handleColorChange = (e) => {
    const newColor = e.target.value
    setStrokeColor(newColor)
    
    const canvas = window.fabricCanvas
    if (canvas) {
      if (canvas.isDrawingMode) {
        canvas.freeDrawingBrush.color = newColor
      }
      
      // Update currently selected objects
      const activeObject = canvas.getActiveObject()
      if (activeObject) {
        if (activeObject.type === 'i-text') {
          activeObject.set('fill', newColor)
        } else {
          activeObject.set('stroke', newColor)
        }
        canvas.renderAll()
      }
    }
  }

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value)
    setStrokeWidth(newWidth)
    
    const canvas = window.fabricCanvas
    if (canvas) {
      if (canvas.isDrawingMode) {
        canvas.freeDrawingBrush.width = newWidth
      }
      
      // Update currently selected objects
      const activeObject = canvas.getActiveObject()
      if (activeObject && activeObject.stroke) {
        activeObject.set('strokeWidth', newWidth)
        canvas.renderAll()
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('Saving...')
    
    try {
      const result = await saveBoard(boardId)
      if (result) {
        setSaveStatus('Saved!')
        setTimeout(() => setSaveStatus(null), 2000)
      } else {
        setSaveStatus('Error saving')
        setTimeout(() => setSaveStatus(null), 2000)
      }
    } catch (error) {
      console.error('Error saving board:', error)
      setSaveStatus('Error saving')
      setTimeout(() => setSaveStatus(null), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCanvas = () => {
    const canvas = window.fabricCanvas
    if (canvas) {
      if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
        canvas.clear()
        canvas.backgroundColor = 'white'
        canvas.renderAll()
      }
    }
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-2 flex flex-wrap gap-2 items-center border-b border-gray-300 dark:border-gray-600">
      <button
        onClick={() => handleToolChange('select')}
        className={`tool-btn ${activeTool === 'select' ? 'active-tool' : ''}`}
        title="Select"
      >
        <FaMousePointer />
      </button>
      
      <button
        onClick={() => handleToolChange('pen')}
        className={`tool-btn ${activeTool === 'pen' ? 'active-tool' : ''}`}
        title="Pen"
      >
        <FaPen />
      </button>
      
      <button
        onClick={() => handleToolChange('rectangle')}
        className={`tool-btn ${activeTool === 'rectangle' ? 'active-tool' : ''}`}
        title="Rectangle"
      >
        <FaSquare />
      </button>
      
      <button
        onClick={() => handleToolChange('circle')}
        className={`tool-btn ${activeTool === 'circle' ? 'active-tool' : ''}`}
        title="Circle"
      >
        <FaCircle />
      </button>
      
      <button
        onClick={() => handleToolChange('text')}
        className={`tool-btn ${activeTool === 'text' ? 'active-tool' : ''}`}
        title="Text"
      >
        <FaFont />
      </button>
      
      <div className="h-6 mx-2 border-l border-gray-300 dark:border-gray-500"></div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="strokeColor" className="sr-only">Color</label>
        <input
          type="color"
          id="strokeColor"
          value={strokeColor}
          onChange={handleColorChange}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="Stroke Color"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="strokeWidth" className="sr-only">Width</label>
        <input
          type="range"
          id="strokeWidth"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={handleWidthChange}
          className="w-24"
          title="Stroke Width"
        />
      </div>
      
      <div className="h-6 mx-2 border-l border-gray-300 dark:border-gray-500"></div>
      
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`tool-btn ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Undo"
      >
        <FaUndo />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`tool-btn ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Redo"
      >
        <FaRedo />
      </button>
      
      <div className="h-6 mx-2 border-l border-gray-300 dark:border-gray-500"></div>
      
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`tool-btn ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Save"
      >
        <FaSave />
        {saveStatus && <span className="ml-2 text-xs">{saveStatus}</span>}
      </button>
      
      <button
        onClick={handleClearCanvas}
        className="tool-btn text-red-500"
        title="Clear Canvas"
      >
        <FaTrash />
      </button>
    </div>
  )
}

export default Toolbar
