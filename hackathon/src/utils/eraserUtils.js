/**
 * Handles erasing objects from canvas at a specific position
 * This utility helps avoid circular dependencies between components
 * 
 * @param {Object} canvas - Fabric.js canvas instance
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate 
 * @param {number} size - Eraser size
 * @param {string} boardId - Current board ID for socket communications
 * @param {string} mode - Eraser mode: 'normal', 'full', or 'partial'
 */
export function eraseAtPoint(canvas, x, y, size, boardId, mode = 'normal') {
  if (!canvas) return;
  
  // Get the current instance of the board store
  const boardStore = window.boardStore;
  if (!boardStore || !boardStore.removeElement) {
    console.error('Board store not available for eraser');
    return;
  }
  
  // Find objects that intersect with the eraser
  const objects = canvas.getObjects();
  const objectsToRemove = objects.filter(obj => {
    // Skip objects that shouldn't be erased
    if (!obj || !obj.visible) return false;
    if (obj.eraserIndicator) return false; // Skip eraser indicator
    if (obj._markedForDeletion) return false; // Skip already marked objects
    if (!obj.id) return false; // Skip objects without ID
    
    // Get object's actual bounding box
    const objBounds = obj.getBoundingRect();
    
    // Check distance between eraser center and object bounds
    const objCenterX = objBounds.left + objBounds.width/2;
    const objCenterY = objBounds.top + objBounds.height/2;
    
    // Calculate distance (approximating object as circle for simplicity)
    const dx = x - objCenterX;
    const dy = y - objCenterY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Consider object size in the calculation
    const objectRadius = Math.max(objBounds.width, objBounds.height) / 2;
    
    // Different modes have different detection logic
    switch(mode) {
      case 'full':
        // Full mode: Erase on any touch
        return distance < (size/2 + objectRadius);
      
      case 'partial':
        // Partial mode: Only erase if eraser center is inside object
        return distance < objectRadius;
      
      case 'normal':
      default:
        // Normal mode: Erase when overlapping significantly
        return distance < (size/2 + objectRadius * 0.7);
    }
  });
  
  // Remove the objects found - IMPORTANT: prevent duplicate handling
  if (objectsToRemove.length > 0) {
    objectsToRemove.forEach(obj => {
      const objId = obj.id;
      
      // Mark object to prevent duplicate deletion
      obj._markedForDeletion = true;
      
      // First remove from store
      boardStore.removeElement(objId);
      
      // Then remove from canvas (this is local only, doesn't emit events)
      canvas.remove(obj);
      
      // Notify other users about deletion
      const socket = window.socket;
      if (socket) {
        socket.emit('delete-element', boardId, objId);
      }
    });
    
    // Update canvas
    canvas.requestRenderAll();
  }
}

/**
 * Creates an eraser indicator circle
 * @param {number} size - Size of eraser
 * @param {string} mode - Eraser mode for different visual indicators
 * @returns {Object} Fabric.js circle object
 */
export function createEraserIndicator(size, mode = 'normal') {
  const fabric = window.fabric;
  if (!fabric) {
    console.error('Fabric.js not available');
    return null;
  }
  
  // Different colors for different modes
  const modeColors = {
    normal: { fill: 'rgba(255,0,0,0.2)', stroke: 'red' },
    full: { fill: 'rgba(255,165,0,0.2)', stroke: 'orange' },
    partial: { fill: 'rgba(0,255,0,0.2)', stroke: 'green' }
  };
  
  const colors = modeColors[mode] || modeColors.normal;
  
  return new fabric.Circle({
    radius: size/2,
    fill: colors.fill,
    stroke: colors.stroke,
    strokeWidth: 2,
    strokeDashArray: mode === 'partial' ? [5, 5] : null, // Dashed for partial mode
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
    eraserIndicator: true, // Special flag to identify this object
    _ignoreSave: true // Don't save this object to the board
  });
}
