/**
 * Handles erasing objects from canvas at a specific position
 * This utility helps avoid circular dependencies between components
 * 
 * @param {Object} canvas - Fabric.js canvas instance
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate 
 * @param {number} size - Eraser size
 * @param {string} boardId - Current board ID for socket communications
 */
export function eraseAtPoint(canvas, x, y, size, boardId) {
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
    if (obj._ignoreSave) return false;
    if (obj.eraserIndicator) return false;
    
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
    
    // Return true if eraser circle overlaps with object
    return distance < (size/2 + objectRadius);
  });
  
  // Remove the objects found - IMPORTANT: first remove from store, then from canvas
  if (objectsToRemove.length > 0) {
    // Temporarily disable object:removed event to prevent duplicate handling
    const originalOnObjectRemoved = canvas.__eventListeners['object:removed'];
    canvas.__eventListeners['object:removed'] = [];
    
    objectsToRemove.forEach(obj => {
      const objId = obj.id;
      
      // First remove from canvas
      canvas.remove(obj);
      
      // Then remove from store if it has an ID
      if (objId) {
        // Remove from store
        boardStore.removeElement(objId);
        
        // Notify other users about deletion
        const socket = window.socket;
        if (socket) {
          socket.emit('delete-element', boardId, objId);
        }
      }
    });
    
    // Restore original event handlers
    canvas.__eventListeners['object:removed'] = originalOnObjectRemoved || [];
    
    // Update canvas
    canvas.requestRenderAll();
  }
}

/**
 * Creates an eraser indicator circle
 * @param {number} size - Size of eraser
 * @returns {Object} Fabric.js circle object
 */
export function createEraserIndicator(size) {
  const fabric = window.fabric;
  if (!fabric) {
    console.error('Fabric.js not available');
    return null;
  }
  
  return new fabric.Circle({
    radius: size/2,
    fill: 'rgba(255,0,0,0.2)',
    stroke: 'red',
    strokeWidth: 1,
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
