// Generate a random username for anonymous users
export function generateRandomUsername() {
  const adjectives = ['Happy', 'Creative', 'Clever', 'Bold', 'Gentle', 'Wise', 'Brave', 'Calm', 'Eager', 'Kind'];
  const nouns = ['Artist', 'Penguin', 'Tiger', 'Falcon', 'Dolphin', 'Panda', 'Koala', 'Eagle', 'Wizard', 'Sailor'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
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

// Export canvas as PNG image
export function exportCanvasAsPNG(canvas, filename) {
  if (!canvas) {
    console.error('Canvas is not available for export');
    return null;
  }
  
  try {
    // Generate high-quality PNG
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 2 // Higher resolution
    });
    
    // If filename not provided, generate one with timestamp
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `collabboard-${timestamp}.png`;
    }
    
    return {
      dataURL,
      filename,
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
    console.error('Error exporting canvas as PNG:', error);
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
