import { useState, useEffect } from 'react'
import { 
  FaMousePointer, FaPen, FaSquare, FaCircle, FaFont, 
  FaUndo, FaRedo, FaSave, FaTrash, FaDownload, FaEraser,
  FaLongArrowAltRight, FaStar, FaDrawPolygon, FaGem,
  FaSearchPlus, FaSearchMinus, FaExpand, FaThLarge,
  FaAlignLeft, FaAlignCenter, FaAlignRight, 
  FaArrowUp, FaArrowDown, FaCopy, FaPaste, FaLayerGroup
} from 'react-icons/fa'
import { useBoardStore } from '../store/boardStore'
import { useSocketStore } from '../store/socketStore'
import { fabric } from 'fabric'
import { eraseAtPoint, createEraserIndicator } from '../utils/eraserUtils'
import { findSuitablePosition } from '../utils/helpers'

function Toolbar({ boardId }) {
  const [activeTool, setActiveTool] = useState('select')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('transparent')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [eraserMode, setEraserMode] = useState('normal')
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [clipboard, setClipboard] = useState(null)
  const { canUndo, canRedo, undo, redo, saveBoard } = useBoardStore()
  const { socket } = useSocketStore()
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

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const canvas = window.fabricCanvas
      if (!canvas) return

      // Check if typing in input/textarea
      const activeElement = document.activeElement
      const isTypingInInput = activeElement.tagName === 'INPUT' || 
                              activeElement.tagName === 'TEXTAREA' ||
                              activeElement.isContentEditable

      // Check if editing text on canvas
      const activeObject = canvas.getActiveObject()
      const isEditingCanvasText = activeObject && 
                                   activeObject.type === 'i-text' && 
                                   activeObject.isEditing

      // If typing anywhere, skip ALL shortcuts
      if (isTypingInInput || isEditingCanvasText) {
        return // Let normal text editing work
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        handleToolChange('select')
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handleToolChange('pen')
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleToolChange('rectangle')
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleToolChange('circle')
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        handleToolChange('text')
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        handleToolChange('eraser')
      }

      // Copy/Paste/Duplicate
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault()
          handleCopy()
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault()
          handlePaste()
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          const activeObject = canvas.getActiveObject()
          if (activeObject) {
            activeObject.clone((cloned) => {
              cloned.set({
                left: cloned.left + 10,
                top: cloned.top + 10
              })
              canvas.add(cloned)
              canvas.setActiveObject(cloned)
              canvas.requestRenderAll()
            })
          }
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          handleSave()
        } else if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault()
          redo()
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          handleZoomIn()
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault()
          handleZoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          handleZoomReset()
        }
      }

      // Delete - only delete objects, not when editing text
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject()
        // Don't delete if we're editing text inside the object
        if (activeObj && !(activeObj.type === 'i-text' && activeObj.isEditing)) {
          e.preventDefault()
          canvas.remove(activeObj)
          canvas.requestRenderAll()
        }
      }

      // Alignment shortcuts
      if (e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handleAlignLeft()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleAlignRight()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          handleBringToFront()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          handleSendToBack()
        }
      }

      // Grid toggle
      if (e.key === 'g' || e.key === 'G') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleToggleGrid()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, canUndo, canRedo, clipboard, showGrid, snapToGrid])


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

    // Clean up empty text boxes when switching away from text tool
    if (activeTool === 'text' && canvas) {
      const emptyTexts = canvas.getObjects().filter(obj => 
        obj.type === 'i-text' && (!obj.text || obj.text.trim() === '')
      );
      emptyTexts.forEach(text => canvas.remove(text));
      if (emptyTexts.length > 0) {
        canvas.renderAll();
      }
    }

    setActiveTool(tool)
    
    // Broadcast tool change to other users (optional - for awareness)
    const socket = window.socket;
    if (socket && boardId) {
      socket.emit('tool-changed', boardId, {
        tool,
        userId: socket.id,
        username: socket.username || 'User'
      });
    }
    
    if (!canvas) {
      console.error('Canvas not initialized')
      return
    }

    // IMPORTANT: Clean up ALL event listeners before switching tools
    // This prevents tools from interfering with each other
    canvas.off('mouse:down')
    canvas.off('mouse:move')
    canvas.off('mouse:up')
    canvas.isDrawingMode = false
    canvas.selection = false

    // Configure canvas based on selected tool
    switch (tool) {
      case 'select':
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'move'
        break
        
      case 'pen':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush.color = strokeColor
        canvas.freeDrawingBrush.width = strokeWidth
        canvas.defaultCursor = 'crosshair'
        break
        
      case 'rectangle':
        canvas.defaultCursor = 'crosshair'
        
        let rect, isDown, origX, origY
        
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
        canvas.defaultCursor = 'crosshair'
        
        let circle, isDrawing, startX, startY
        
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
        
      case 'line':
        canvas.defaultCursor = 'crosshair'
        
        let line, isDrawingLine, lineStartX, lineStartY
        
        canvas.on('mouse:down', (o) => {
          isDrawingLine = true
          const pointer = canvas.getPointer(o.e)
          lineStartX = pointer.x
          lineStartY = pointer.y
          line = new fabric.Line([lineStartX, lineStartY, lineStartX, lineStartY], {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            selectable: true
          })
          canvas.add(line)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isDrawingLine) return
          const pointer = canvas.getPointer(o.e)
          line.set({ x2: pointer.x, y2: pointer.y })
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isDrawingLine = false
          line.setCoords()
          canvas.setActiveObject(line)
        })
        break

      case 'arrow':
        canvas.defaultCursor = 'crosshair'
        
        let arrow, isDrawingArrow, arrowStartX, arrowStartY
        
        canvas.on('mouse:down', (o) => {
          isDrawingArrow = true
          const pointer = canvas.getPointer(o.e)
          arrowStartX = pointer.x
          arrowStartY = pointer.y
          
          const arrowLine = new fabric.Line([arrowStartX, arrowStartY, arrowStartX, arrowStartY], {
            stroke: strokeColor,
            strokeWidth: strokeWidth
          })
          
          const arrowHead = new fabric.Triangle({
            left: arrowStartX,
            top: arrowStartY,
            width: strokeWidth * 5,
            height: strokeWidth * 5,
            fill: strokeColor,
            angle: 0
          })
          
          arrow = new fabric.Group([arrowLine, arrowHead], {
            selectable: true
          })
          canvas.add(arrow)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isDrawingArrow) return
          const pointer = canvas.getPointer(o.e)
          const dx = pointer.x - arrowStartX
          const dy = pointer.y - arrowStartY
          const angle = Math.atan2(dy, dx) * 180 / Math.PI
          
          canvas.remove(arrow)
          
          const arrowLine = new fabric.Line([arrowStartX, arrowStartY, pointer.x, pointer.y], {
            stroke: strokeColor,
            strokeWidth: strokeWidth
          })
          
          const arrowHead = new fabric.Triangle({
            left: pointer.x,
            top: pointer.y,
            width: strokeWidth * 5,
            height: strokeWidth * 5,
            fill: strokeColor,
            angle: angle + 90,
            originX: 'center',
            originY: 'center'
          })
          
          arrow = new fabric.Group([arrowLine, arrowHead], {
            selectable: true
          })
          canvas.add(arrow)
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isDrawingArrow = false
          arrow.setCoords()
          canvas.setActiveObject(arrow)
        })
        break

      case 'diamond':
        canvas.defaultCursor = 'crosshair'
        
        let diamond, isDiamond, diamondOrigX, diamondOrigY
        
        canvas.on('mouse:down', (o) => {
          isDiamond = true
          const pointer = canvas.getPointer(o.e)
          diamondOrigX = pointer.x
          diamondOrigY = pointer.y
          
          diamond = new fabric.Polygon([
            {x: 0, y: -50},
            {x: 50, y: 0},
            {x: 0, y: 50},
            {x: -50, y: 0}
          ], {
            left: diamondOrigX,
            top: diamondOrigY,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            scaleX: 0,
            scaleY: 0
          })
          canvas.add(diamond)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isDiamond) return
          const pointer = canvas.getPointer(o.e)
          const scale = Math.abs(pointer.x - diamondOrigX) / 100
          diamond.set({ scaleX: scale, scaleY: scale })
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isDiamond = false
          diamond.setCoords()
          canvas.setActiveObject(diamond)
        })
        break

      case 'star':
        canvas.defaultCursor = 'crosshair'
        
        let star, isStar, starOrigX, starOrigY
        
        const createStarPoints = () => {
          const points = []
          const spikes = 5
          const outerRadius = 50
          const innerRadius = 25
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const angle = (i * Math.PI) / spikes - Math.PI / 2
            points.push({
              x: radius * Math.cos(angle),
              y: radius * Math.sin(angle)
            })
          }
          return points
        }
        
        canvas.on('mouse:down', (o) => {
          isStar = true
          const pointer = canvas.getPointer(o.e)
          starOrigX = pointer.x
          starOrigY = pointer.y
          
          star = new fabric.Polygon(createStarPoints(), {
            left: starOrigX,
            top: starOrigY,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            scaleX: 0,
            scaleY: 0
          })
          canvas.add(star)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isStar) return
          const pointer = canvas.getPointer(o.e)
          const scale = Math.abs(pointer.x - starOrigX) / 100
          star.set({ scaleX: scale, scaleY: scale })
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isStar = false
          star.setCoords()
          canvas.setActiveObject(star)
        })
        break

      case 'triangle':
        canvas.defaultCursor = 'crosshair'
        
        let triangle, isTriangle, triOrigX, triOrigY
        
        canvas.on('mouse:down', (o) => {
          isTriangle = true
          const pointer = canvas.getPointer(o.e)
          triOrigX = pointer.x
          triOrigY = pointer.y
          
          triangle = new fabric.Triangle({
            left: triOrigX,
            top: triOrigY,
            width: 0,
            height: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth
          })
          canvas.add(triangle)
        })
        
        canvas.on('mouse:move', (o) => {
          if (!isTriangle) return
          const pointer = canvas.getPointer(o.e)
          const width = Math.abs(pointer.x - triOrigX)
          const height = Math.abs(pointer.y - triOrigY)
          
          if (pointer.x < triOrigX) {
            triangle.set({ left: pointer.x })
          }
          if (pointer.y < triOrigY) {
            triangle.set({ top: pointer.y })
          }
          
          triangle.set({ width, height })
          canvas.renderAll()
        })
        
        canvas.on('mouse:up', () => {
          isTriangle = false
          triangle.setCoords()
          canvas.setActiveObject(triangle)
        })
        break
        
      case 'text':
        canvas.selection = true
        canvas.defaultCursor = 'text'
        
        canvas.on('mouse:down', (o) => {
          // Only create new text if clicking on empty space
          if (o.target && o.target.type === 'i-text') {
            return // Let user edit existing text
          }
          
          // Get the pointer position from click
          const pointer = canvas.getPointer(o.e)
          
          // Create the text object at click position
          const text = new fabric.IText('', {
            left: pointer.x,
            top: pointer.y,
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            fill: strokeColor,
            fontWeight: 'normal',
            editable: true,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            cornerStyle: 'circle',
            cornerColor: '#2563eb',
            cornerSize: 8,
            borderColor: '#3b82f6',
            borderScaleFactor: 2,
            padding: 5
          })
          
          canvas.add(text)
          canvas.setActiveObject(text)
          
          // Enter editing mode immediately
          setTimeout(() => {
            text.enterEditing()
            text.hiddenTextarea?.focus()
          }, 50)
        })
        break
        
      case 'eraser':
        canvas.defaultCursor = 'crosshair';
        
        let isErasing = false;
        const eraserSize = strokeWidth * 5; // Larger eraser for better usability
        let eraserIndicator = createEraserIndicator(eraserSize, eraserMode);
        
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
          
          // Immediate first erase with selected mode
          eraseAtPoint(canvas, pointer.x, pointer.y, eraserSize, boardId, eraserMode);
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
              eraseAtPoint(canvas, pointer.x, pointer.y, eraserSize, boardId, eraserMode);
              throttle.last = now;
            } else {
              // Clear any existing timeout
              if (throttle.timeout) clearTimeout(throttle.timeout);
              
              // Schedule erase to ensure it happens even with fast mouse movements
              throttle.timeout = setTimeout(() => {
                if (isMouseDown.value) {
                  eraseAtPoint(canvas, pointer.x, pointer.y, eraserSize, boardId, eraserMode);
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

  const handleFillColorChange = (e) => {
    const newColor = e.target.value
    setFillColor(newColor)
    
    const canvas = window.fabricCanvas
    if (canvas) {
      const activeObject = canvas.getActiveObject()
      if (activeObject && activeObject.fill !== undefined) {
        activeObject.set('fill', newColor)
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

  // Zoom Controls
  const handleZoomIn = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const newZoom = Math.min(zoomLevel + 10, 200)
    setZoomLevel(newZoom)
    canvas.setZoom(newZoom / 100)
    canvas.renderAll()
    
    // Emit to other users
    if (socket && boardId) {
      socket.emit('zoom-changed', { boardId, zoomLevel: newZoom })
    }
  }

  const handleZoomOut = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const newZoom = Math.max(zoomLevel - 10, 50)
    setZoomLevel(newZoom)
    canvas.setZoom(newZoom / 100)
    canvas.renderAll()
    
    // Emit to other users
    if (socket && boardId) {
      socket.emit('zoom-changed', { boardId, zoomLevel: newZoom })
    }
  }

  const handleZoomReset = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    setZoomLevel(100)
    canvas.setZoom(1)
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.renderAll()
    
    // Emit to other users
    if (socket && boardId) {
      socket.emit('zoom-changed', { boardId, zoomLevel: 100 })
    }
  }

  // Grid Toggle
  const handleToggleGrid = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const newShowGrid = !showGrid
    setShowGrid(newShowGrid)
    
    // Emit to other users
    if (socket && boardId) {
      socket.emit('grid-toggled', { boardId, showGrid: newShowGrid })
    }
    
    if (newShowGrid) {
      // Add grid to canvas
      const gridSize = 20
      const width = canvas.width
      const height = canvas.height
      
      // Remove existing grid if any (filter first, then remove)
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
      // Remove grid - filter first, then remove
      const gridLines = canvas.getObjects().filter(obj => obj.isGridLine)
      gridLines.forEach(obj => canvas.remove(obj))
    }
    
    canvas.renderAll()
  }

  // Snap to Grid Toggle
  const handleToggleSnap = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const newSnapToGrid = !snapToGrid
    setSnapToGrid(newSnapToGrid)
    
    if (newSnapToGrid) {
      canvas.on('object:moving', (e) => {
        const gridSize = 20
        e.target.set({
          left: Math.round(e.target.left / gridSize) * gridSize,
          top: Math.round(e.target.top / gridSize) * gridSize
        })
      })
    } else {
      canvas.off('object:moving')
    }
  }

  // Alignment Tools
  const handleAlignLeft = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return
    
    const leftmost = Math.min(...activeObjects.map(obj => obj.left))
    activeObjects.forEach(obj => {
      obj.set({ left: leftmost })
      obj.setCoords()
    })
    canvas.renderAll()
  }

  const handleAlignCenter = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return
    
    const centerX = canvas.width / 2
    activeObjects.forEach(obj => {
      obj.set({ left: centerX - obj.width * obj.scaleX / 2 })
      obj.setCoords()
    })
    canvas.renderAll()
  }

  const handleAlignRight = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return
    
    const rightmost = Math.max(...activeObjects.map(obj => obj.left + obj.width * obj.scaleX))
    activeObjects.forEach(obj => {
      obj.set({ left: rightmost - obj.width * obj.scaleX })
      obj.setCoords()
    })
    canvas.renderAll()
  }

  // Layer Controls
  const handleBringToFront = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringToFront(activeObject)
      canvas.renderAll()
    }
  }

  const handleSendToBack = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendToBack(activeObject)
      canvas.renderAll()
    }
  }

  // Copy/Paste
  const handleCopy = () => {
    const canvas = window.fabricCanvas
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned) => {
        setClipboard(cloned)
      })
    }
  }

  const handlePaste = () => {
    const canvas = window.fabricCanvas
    if (!canvas || !clipboard) return
    
    clipboard.clone((clonedObj) => {
      canvas.discardActiveObject()
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      })
      
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas
        clonedObj.forEachObject((obj) => {
          canvas.add(obj)
        })
        clonedObj.setCoords()
      } else {
        canvas.add(clonedObj)
      }
      
      clipboard.top += 10
      clipboard.left += 10
      canvas.setActiveObject(clonedObj)
      canvas.requestRenderAll()
    })
  }
  
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 flex flex-wrap gap-3 items-center border-b-2 border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Drawing Tools Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Tools</span>
        <button
          onClick={() => handleToolChange('select')}
          className={`tool-btn-enhanced ${activeTool === 'select' ? 'active-tool-enhanced' : ''}`}
          title="Select Tool (V)"
        >
          <FaMousePointer className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('pen')}
          className={`tool-btn-enhanced ${activeTool === 'pen' ? 'active-tool-enhanced' : ''}`}
          title="Pen Tool (P)"
        >
          <FaPen className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('rectangle')}
          className={`tool-btn-enhanced ${activeTool === 'rectangle' ? 'active-tool-enhanced' : ''}`}
          title="Rectangle Tool (R)"
        >
          <FaSquare className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('circle')}
          className={`tool-btn-enhanced ${activeTool === 'circle' ? 'active-tool-enhanced' : ''}`}
          title="Circle Tool (C)"
        >
          <FaCircle className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('triangle')}
          className={`tool-btn-enhanced ${activeTool === 'triangle' ? 'active-tool-enhanced' : ''}`}
          title="Triangle Tool"
        >
          <span className="text-lg">△</span>
        </button>
        
        <button
          onClick={() => handleToolChange('line')}
          className={`tool-btn-enhanced ${activeTool === 'line' ? 'active-tool-enhanced' : ''}`}
          title="Line Tool"
        >
          <span className="text-lg font-bold">─</span>
        </button>
        
        <button
          onClick={() => handleToolChange('arrow')}
          className={`tool-btn-enhanced ${activeTool === 'arrow' ? 'active-tool-enhanced' : ''}`}
          title="Arrow Tool"
        >
          <FaLongArrowAltRight className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('diamond')}
          className={`tool-btn-enhanced ${activeTool === 'diamond' ? 'active-tool-enhanced' : ''}`}
          title="Diamond Tool"
        >
          <FaGem className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('star')}
          className={`tool-btn-enhanced ${activeTool === 'star' ? 'active-tool-enhanced' : ''}`}
          title="Star Tool"
        >
          <FaStar className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('text')}
          className={`tool-btn-enhanced ${activeTool === 'text' ? 'active-tool-enhanced' : ''}`}
          title="Text Tool (T)"
        >
          <FaFont className="text-lg" />
        </button>
        
        <button
          onClick={() => handleToolChange('eraser')}
          className={`tool-btn-enhanced ${activeTool === 'eraser' ? 'active-tool-enhanced eraser-active' : ''}`}
          title="Eraser Tool (E)"
        >
          <FaEraser className="text-lg" />
        </button>
      </div>
      
      {/* Eraser mode selector - only show when eraser is active */}
      {activeTool === 'eraser' && (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-slideIn">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Eraser Mode:</span>
          <button
            onClick={() => {
              setEraserMode('normal');
              handleToolChange('eraser');
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
              eraserMode === 'normal' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
            title="Normal - Erase on overlap"
          >
            🔴 Normal
          </button>
          <button
            onClick={() => {
              setEraserMode('full');
              handleToolChange('eraser');
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
              eraserMode === 'full' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
            }`}
            title="Full - Erase entire object on touch"
          >
            🟠 Full
          </button>
          <button
            onClick={() => {
              setEraserMode('partial');
              handleToolChange('eraser');
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
              eraserMode === 'partial' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
            }`}
            title="Precise - Only center erases"
          >
            🟢 Precise
          </button>
        </div>
      )}
      
      {/* Style Controls Group */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Style</span>
        <div className="flex items-center gap-2">
          <label htmlFor="strokeColor" className="text-xs text-gray-600 dark:text-gray-300 font-medium">Stroke</label>
          <div className="relative">
            <input
              type="color"
              id="strokeColor"
              value={strokeColor}
              onChange={handleColorChange}
              className="w-10 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
              title="Stroke Color"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="fillColor" className="text-xs text-gray-600 dark:text-gray-300 font-medium">Fill</label>
          <div className="relative flex items-center gap-1">
            <input
              type="color"
              id="fillColor"
              value={fillColor === 'transparent' ? '#ffffff' : fillColor}
              onChange={handleFillColorChange}
              className="w-10 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
              title="Fill Color"
            />
            <button
              onClick={() => {
                setFillColor('transparent')
                const canvas = window.fabricCanvas
                if (canvas) {
                  const activeObject = canvas.getActiveObject()
                  if (activeObject) {
                    activeObject.set('fill', 'transparent')
                    canvas.renderAll()
                  }
                }
              }}
              className={`text-xs px-2 py-1 rounded ${fillColor === 'transparent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              title="No Fill"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="strokeWidth" className="text-xs text-gray-600 dark:text-gray-300 font-medium">Width</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              id="strokeWidth"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={handleWidthChange}
              className="w-24 accent-blue-500"
              title="Stroke Width"
            />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-center">{strokeWidth}</span>
          </div>
        </div>
      </div>
      
      {/* History Controls Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">History</span>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`tool-btn-enhanced ${!canUndo ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}
          title="Undo (Ctrl+Z)"
        >
          <FaUndo className="text-lg" />
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`tool-btn-enhanced ${!canRedo ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}
          title="Redo (Ctrl+Y)"
        >
          <FaRedo className="text-lg" />
        </button>
      </div>
      
      {/* View Controls Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">View</span>
        <button
          onClick={handleZoomOut}
          className="tool-btn-enhanced hover:bg-purple-100 dark:hover:bg-purple-900/30"
          title="Zoom Out (Ctrl+-)"
        >
          <FaSearchMinus className="text-lg" />
        </button>
        
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
          {zoomLevel}%
        </span>
        
        <button
          onClick={handleZoomIn}
          className="tool-btn-enhanced hover:bg-purple-100 dark:hover:bg-purple-900/30"
          title="Zoom In (Ctrl++)"
        >
          <FaSearchPlus className="text-lg" />
        </button>
        
        <button
          onClick={handleZoomReset}
          className="tool-btn-enhanced hover:bg-purple-100 dark:hover:bg-purple-900/30"
          title="Reset Zoom (Ctrl+0)"
        >
          <FaExpand className="text-lg" />
        </button>
        
        <button
          onClick={handleToggleGrid}
          className={`tool-btn-enhanced ${showGrid ? 'active-tool-enhanced' : 'hover:bg-purple-100 dark:hover:bg-purple-900/30'}`}
          title="Toggle Grid (Ctrl+G)"
        >
          <FaThLarge className="text-lg" />
        </button>
        
        <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={handleToggleSnap}
            className="accent-purple-500"
          />
          Snap
        </label>
      </div>

      {/* Alignment Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Align</span>
        <button
          onClick={handleAlignLeft}
          className="tool-btn-enhanced hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
          title="Align Left (Alt+←)"
        >
          <FaAlignLeft className="text-lg" />
        </button>
        
        <button
          onClick={handleAlignCenter}
          className="tool-btn-enhanced hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
          title="Align Center"
        >
          <FaAlignCenter className="text-lg" />
        </button>
        
        <button
          onClick={handleAlignRight}
          className="tool-btn-enhanced hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
          title="Align Right (Alt+→)"
        >
          <FaAlignRight className="text-lg" />
        </button>
      </div>

      {/* Layer Controls Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Layer</span>
        <button
          onClick={handleBringToFront}
          className="tool-btn-enhanced hover:bg-teal-100 dark:hover:bg-teal-900/30"
          title="Bring to Front (Alt+↑)"
        >
          <FaArrowUp className="text-lg" />
        </button>
        
        <button
          onClick={handleSendToBack}
          className="tool-btn-enhanced hover:bg-teal-100 dark:hover:bg-teal-900/30"
          title="Send to Back (Alt+↓)"
        >
          <FaArrowDown className="text-lg" />
        </button>
      </div>

      {/* Edit Controls Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Edit</span>
        <button
          onClick={handleCopy}
          className="tool-btn-enhanced hover:bg-orange-100 dark:hover:bg-orange-900/30"
          title="Copy (Ctrl+C)"
        >
          <FaCopy className="text-lg" />
        </button>
        
        <button
          onClick={handlePaste}
          disabled={!clipboard}
          className={`tool-btn-enhanced ${!clipboard ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-100 dark:hover:bg-orange-900/30'}`}
          title="Paste (Ctrl+V)"
        >
          <FaPaste className="text-lg" />
        </button>
      </div>
      
      {/* Actions Group */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Actions</span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`tool-btn-enhanced text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Save Board (Ctrl+S)"
        >
          <FaSave className="text-lg" />
          {saveStatus && (
            <span className={`ml-2 text-xs font-semibold ${
              saveStatus === 'Saved!' ? 'text-green-600' : 'text-red-600'
            }`}>
              {saveStatus}
            </span>
          )}
        </button>
        
        <button
          onClick={handleExportPNG}
          className="tool-btn-enhanced text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          title="Export as PNG"
        >
          <FaDownload className="text-lg" />
          {exportStatus && (
            <span className={`ml-2 text-xs font-semibold ${
              exportStatus === 'Exported!' ? 'text-blue-600' : 'text-red-600'
            }`}>
              {exportStatus}
            </span>
          )}
        </button>
        
        <button
          onClick={handleClearCanvas}
          className="tool-btn-enhanced text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
          title="Clear Canvas"
        >
          <FaTrash className="text-lg" />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
