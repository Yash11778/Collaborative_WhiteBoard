// Audio cache for better performance
const audioCache = {};

/**
 * Play a sound effect
 * @param {string} soundName - Name of the sound file (without extension)
 * @param {number} volume - Volume from 0 to 1
 */
export function playSound(soundName, volume = 0.5) {
  try {
    // Check if sound exists in cache
    if (!audioCache[soundName]) {
      audioCache[soundName] = new Audio(`/sounds/${soundName}.mp3`);
    }
    
    const sound = audioCache[soundName];
    
    // Reset sound to beginning if it's already playing
    sound.currentTime = 0;
    sound.volume = volume;
    
    // Play the sound
    sound.play().catch(error => {
      // Browsers often block autoplay, this catches that error
      console.log('Sound could not be played:', error);
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Preload commonly used sounds
 */
export function preloadSounds() {
  const sounds = ['message'];
  
  sounds.forEach(sound => {
    audioCache[sound] = new Audio(`/sounds/${sound}.mp3`);
    // Preload audio file
    audioCache[sound].load();
  });
}
