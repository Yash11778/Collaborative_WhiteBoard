/**
 * Generate a random username for anonymous users
 * @returns {string} Random username
 */
export function generateRandomUsername() {
  const adjectives = ['Creative', 'Brilliant', 'Amazing', 'Bold', 'Swift', 'Quick', 'Clever'];
  const nouns = ['Artist', 'Designer', 'Creator', 'Thinker', 'Maker', 'Collaborator'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

// Format timestamp
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Generate a random color
export function generateRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

// Create shareable URL for a board
export function getShareableUrl(boardId) {
  return `${window.location.origin}/board/${boardId}`;
}

// Check if Web Share API is available
export function canUseWebShare() {
  return navigator.share !== undefined;
}

// Share board URL through Web Share API
export function shareBoardViaWebShare(boardId, boardName) {
  if (!canUseWebShare()) {
    return false;
  }
  
  const url = getShareableUrl(boardId);
  
  return navigator.share({
    title: `CollabBoard - ${boardName || 'Untitled Board'}`,
    text: 'Join my collaborative whiteboard session!',
    url: url,
  });
}

/**
 * Export canvas as PNG image
 * @param {Object} canvas - Fabric.js canvas instance
 * @param {string} filename - Output filename
 * @returns {Object|null} Data URL object or null on failure
 */
export function exportCanvasAsPNG(canvas, filename = 'canvas.png') {
  if (!canvas) return null;
  
  try {
    // Get data URL with multiplier for better quality export
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    
    // Return object with data and methods
    return {
      dataURL,
      download: () => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  } catch (error) {
    console.error('Error exporting canvas:', error);
    return null;
  }
}

// Convert data URL to Blob for file saving
export function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Find objects under a specific point in canvas
 * @param {Object} canvas - Fabric.js canvas instance
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} radius - Detection radius
 * @returns {Array} Array of objects found
 */
export function findObjectsUnderPoint(canvas, x, y, radius = 10) {
  if (!canvas) return [];
  
  // Get all objects on the canvas
  const objects = canvas.getObjects();
  
  // Find all objects that contain the point within the given radius
  return objects.filter(obj => {
    // Get the object's bounding box
    const bounds = obj.getBoundingRect();
    
    // Check if point is within the object bounds + radius tolerance
    return (
      x >= (bounds.left - radius) &&
      x <= (bounds.left + bounds.width + radius) &&
      y >= (bounds.top - radius) &&
      y <= (bounds.top + bounds.height + radius)
    );
  });
}

/**
 * Checks if a point would cause overlap with existing objects on canvas
 * @param {Object} canvas - Fabric.js canvas instance
 * @param {number} x - X coordinate to check
 * @param {number} y - Y coordinate to check
 * @param {number} padding - Minimum distance to maintain from other objects
 * @returns {boolean} True if position would overlap with existing objects
 */
export function wouldOverlap(canvas, x, y, padding = 50) {
  if (!canvas) return false;
  
  const objects = canvas.getObjects();
  
  // Check if point is too close to any existing object
  return objects.some(obj => {
    if (!obj.visible || obj._ignoreSave || obj.eraserIndicator) return false;
    
    // Get object bounds
    const bounds = obj.getBoundingRect();
    
    // Check if point is within the expanded bounds (original bounds + padding)
    return (
      x >= (bounds.left - padding) &&
      x <= (bounds.left + bounds.width + padding) &&
      y >= (bounds.top - padding) &&
      y <= (bounds.top + bounds.height + padding)
    );
  });
}

/**
 * Finds a suitable position for a new element that avoids overlap
 * @param {Object} canvas - Fabric.js canvas instance
 * @param {number} padding - Minimum distance to maintain from other objects
 * @returns {Object} Position with x and y coordinates
 */
export function findSuitablePosition(canvas, padding = 50) {
  if (!canvas) {
    return { x: 100, y: 100 }; // Default position if no canvas
  }
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Try positions in a grid pattern
  const gridSize = padding * 2;
  const cols = Math.floor(width / gridSize);
  const rows = Math.floor(height / gridSize);
  
  // First try center of canvas
  const centerX = width / 2;
  const centerY = height / 2;
  
  if (!wouldOverlap(canvas, centerX, centerY, padding)) {
    return { x: centerX, y: centerY };
  }
  
  // Try grid positions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) * gridSize; // Center of cell
      const y = (row + 0.5) * gridSize; // Center of cell
      
      if (!wouldOverlap(canvas, x, y, padding)) {
        return { x, y };
      }
    }
  }
  
  // If all positions are occupied, use randomized position with offset from center
  const randomOffsetX = (Math.random() - 0.5) * 200;
  const randomOffsetY = (Math.random() - 0.5) * 200;
  
  return { 
    x: centerX + randomOffsetX, 
    y: centerY + randomOffsetY 
  };
}
