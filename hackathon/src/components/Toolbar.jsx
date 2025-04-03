import { useState, useEffect } from 'react'
import { 
  FaMousePointer, FaPen, FaSquare, FaCircle, FaFont, 
  FaUndo, FaRedo, FaSave, FaTrash, FaDownload, FaEraser 
} from 'react-icons/fa'
import { useBoardStore } from '../store/boardStore'
import { fabric } from 'fabric'
import { eraseAtPoint, createEraserIndicator } from '../utils/eraserUtils'
import { findSuitablePosition } from '../utils/helpers'

function Toolbar({ boardId }) {
  const [activeTool, setActiveTool] = useState('select')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const { canUndo, canRedo, undo, redo, saveBoard } = useBoardStore()
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [exportStatus, setExportStatus] = useState(null)

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

  // Store reference to the board store for the eraser utility
  useEffect(() => {
    // Make boardStore available globally for the eraser utility
    window.boardStore = useBoardStore.getState();
    
    return () => {
      delete window.boardStore;
    };
  }, []);

  const handleToolChange = (tool) => {
    // If we're switching from eraser, remove the indicator
    const canvas = window.fabricCanvas;
    if (activeTool === 'eraser' && canvas) {
      const eraserIndicator = canvas.getObjects().find(obj => obj.eraserIndicator);
      if (eraserIndicator) {
        canvas.remove(eraserIndicator);
        canvas.renderAll();
      }
    }

    setActiveTool(tool)
    
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
          // Get the pointer position from click
          const pointer = canvas.getPointer(o.e)
          
          // Find a suitable position that avoids overlap
          // If user clicked in empty space, use that position
          // Otherwise, find a non-overlapping position
          const position = canvas.findTarget(o.e) 
            ? findSuitablePosition(canvas) 
            : { x: pointer.x, y: pointer.y }
          
          // Create the text object at the chosen position
          const text = new fabric.IText('Text', {
            left: position.x,
            top: position.y,
            fontSize: 20,
            fill: strokeColor,
            textAlign: 'center',
            originX: 'center', // Center horizontally
            originY: 'center'  // Center vertically
          })
          
          canvas.add(text)
          canvas.setActiveObject(text)
          text.enterEditing()
          
          // Center the text visually after adding it
          text.setCoords()
        })
        break
        
      case 'eraser':
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        
        // Clear any existing event listeners
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        
        let isErasing = false;
        const eraserSize = strokeWidth * 5; // Larger eraser for better usability
        let eraserIndicator = createEraserIndicator(eraserSize);
        
        // Track if mouse is down to prevent duplicate erasing
        const isMouseDown = { value: false };
        
        // Create throttling mechanism for erasing
        const throttle = {
          timeout: null,
          last: 0,
          delay: 50 // milliseconds between erases
        };
        
        // On mouse down, start erasing
        canvas.on('mouse:down', (o) => {
          isErasing = true;
          isMouseDown.value = true;
          const pointer = canvas.getPointer(o.e);
          
          // Immediate first erase
          eraseAtPoint(canvas, pointer.x, pointer.y, eraserSize, boardId);
        });
        
        // On mouse move, show eraser indicator and erase if button is down
        canvas.on('mouse:move', (o) => {
          const pointer = canvas.getPointer(o.e);
          
          // Update eraser indicator position
          if (eraserIndicator) {
            eraserIndicator.set({
              left: pointer.x,
              top: pointer.y
            });
            
            if (!canvas.contains(eraserIndicator)) {
              canvas.add(eraserIndicator);
            }
            
            eraserIndicator.bringToFront();
          }
          
          // If erasing (mouse button down), erase objects at the pointer with throttling
          if (isErasing && isMouseDown.value) {
            const now = Date.now();
            
            if (now - throttle.last > throttle.delay) {
              eraseAtPoint(canvas, pointer.x, pointer.y, eraserSize, boardId);
              throttle.last = now;
            } else {
              // Clear any existing timeout
              if (throttle.timeout) clearTimeout(throttle.timeout);
              
              // Schedule erase to ensure it happens even with fast mouse movements
              throttle.timeout = setTimeout(() => {
                if (isMouseDown.value) {
                  eraseAtPoint(canvas, pointer.x, pointer.y, eraserSize, boardId);
                }
                throttle.timeout = null;
              }, throttle.delay);
            }
          }
          
          canvas.renderAll();
        });
        
        // Stop erasing on mouse up
        canvas.on('mouse:up', () => {
          isErasing = false;
          isMouseDown.value = false;
          
          // Clear any pending erase operations
          if (throttle.timeout) {
            clearTimeout(throttle.timeout);
            throttle.timeout = null;
          }
        });
        
        break;
        
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

  const handleExportPNG = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    try {
      // Set export status
      setExportStatus('Exporting...')

      // Create a temporary clone of the canvas for export to avoid modifying the original
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 // Higher resolution
      })
      
      // Create a download link and trigger download
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.download = `collabboard-${timestamp}.png`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Show success message
      setExportStatus('Exported!')
      setTimeout(() => setExportStatus(null), 2000)
    } catch (error) {
      console.error('Error exporting canvas:', error)
      setExportStatus('Export failed')
      setTimeout(() => setExportStatus(null), 2000)
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
      
      <button
        onClick={() => handleToolChange('eraser')}
        className={`tool-btn ${activeTool === 'eraser' ? 'active-tool' : ''}`}
        title="Eraser"
      >
        <FaEraser />
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
        onClick={handleExportPNG}
        className="tool-btn text-blue-600 dark:text-blue-400"
        title="Export as PNG"
      >
        <FaDownload />
        {exportStatus && <span className="ml-2 text-xs">{exportStatus}</span>}
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
