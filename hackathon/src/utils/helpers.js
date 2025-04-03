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
