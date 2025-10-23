import { useState, useEffect } from 'react'
import { useBoardStore } from '../store/boardStore'
import { FaLayerGroup, FaClock, FaMousePointer } from 'react-icons/fa'

function CanvasInfo() {
  const { elements } = useBoardStore()
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [fps, setFps] = useState(60)

  useEffect(() => {
    const canvas = window.fabricCanvas
    if (!canvas) return

    // Track cursor position
    const handleMouseMove = (e) => {
      const pointer = canvas.getPointer(e.e)
      setCursorPos({
        x: Math.round(pointer.x),
        y: Math.round(pointer.y)
      })
    }

    canvas.on('mouse:move', handleMouseMove)

    // Calculate FPS
    let lastTime = performance.now()
    let frames = 0
    const calculateFPS = () => {
      frames++
      const currentTime = performance.now()
      if (currentTime >= lastTime + 1000) {
        setFps(frames)
        frames = 0
        lastTime = currentTime
      }
      requestAnimationFrame(calculateFPS)
    }
    const fpsInterval = requestAnimationFrame(calculateFPS)

    return () => {
      canvas.off('mouse:move', handleMouseMove)
      cancelAnimationFrame(fpsInterval)
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700 p-3 min-w-[200px] z-50">
      <div className="space-y-2 text-xs">
        {/* Object Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FaLayerGroup className="text-blue-500" />
            <span className="font-medium">Objects:</span>
          </div>
          <span className="font-bold text-blue-600 dark:text-blue-400">{elements.length}</span>
        </div>

        {/* Cursor Position */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FaMousePointer className="text-green-500" />
            <span className="font-medium">Position:</span>
          </div>
          <span className="font-mono text-green-600 dark:text-green-400">
            {cursorPos.x}, {cursorPos.y}
          </span>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FaClock className="text-purple-500" />
            <span className="font-medium">FPS:</span>
          </div>
          <span className={`font-bold ${fps >= 50 ? 'text-green-600 dark:text-green-400' : fps >= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {fps}
          </span>
        </div>

        {/* Performance Indicator */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500 dark:text-gray-400">Performance:</span>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${fps >= 50 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full ${fps >= 30 ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full ${fps >= 10 ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CanvasInfo
