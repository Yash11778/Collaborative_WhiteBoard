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
