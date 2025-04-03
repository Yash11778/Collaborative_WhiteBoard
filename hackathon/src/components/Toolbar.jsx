import { useState } from 'react'
import { FaMousePointer, FaPen, FaSquare, FaCircle, FaFont, FaUndo, FaRedo, FaSave, FaTrash } from 'react-icons/fa'
import { useBoardStore } from '../store/boardStore'

function Toolbar({ boardId }) {
  const [activeTool, setActiveTool] = useState('select')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const { canUndo, canRedo, undo, redo, saveBoard } = useBoardStore()

  const handleToolChange = (tool) => {
    setActiveTool(tool)
    
    const canvas = window.fabricCanvas // We'll set this on the window in Canvas component
    if (!canvas) return

    // Configure canvas based on selected tool
    switch (tool) {
      case 'select':
        canvas.isDrawingMode = false
        canvas.selection = true
        break
      case 'pen':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush.color = strokeColor
        canvas.freeDrawingBrush.width = strokeWidth
        break
      case 'rectangle':
        canvas.isDrawingMode = false
        canvas.selection = false
        break
      case 'circle':
        canvas.isDrawingMode = false
        canvas.selection = false
        break
      case 'text':
        canvas.isDrawingMode = false
        canvas.selection = false
        break
      default:
        break
    }
  }

  const handleColorChange = (e) => {
    const newColor = e.target.value
    setStrokeColor(newColor)
    
    const canvas = window.fabricCanvas
    if (canvas && canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = newColor
    }
  }

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value)
    setStrokeWidth(newWidth)
    
    const canvas = window.fabricCanvas
    if (canvas && canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = newWidth
    }
  }

  const handleSave = async () => {
    await saveBoard(boardId)
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
        className="tool-btn"
        title="Save"
      >
        <FaSave />
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
