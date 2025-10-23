import { create } from 'zustand'
import axios from 'axios'

export const useBoardStore = create((set, get) => ({
  elements: [],
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  
  setElements: (elements) => {
    if (!elements || !Array.isArray(elements)) {
      console.warn('setElements called with invalid elements:', elements)
      elements = []
    }
    
    set({ 
      elements,
      history: [elements],
      historyIndex: 0,
      canUndo: false,
      canRedo: false
    })
  },
  
  addElement: (element) => {
    if (!element || !element.id) {
      console.error('Invalid element:', element)
      return
    }

    const { elements, history, historyIndex } = get()
    const newElements = [...elements, element]
    
    // Add to history, truncate forward history if we were in the middle
    const newHistory = [...history.slice(0, historyIndex + 1), newElements]
    
    set({ 
      elements: newElements, 
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false
    })
  },
  
  updateElement: (element) => {
    if (!element || !element.id) {
      console.error('Invalid element:', element)
      return
    }

    const { elements, history, historyIndex } = get()
    const elementIndex = elements.findIndex(e => e.id === element.id)
    
    if (elementIndex === -1) return
    
    const newElements = [...elements]
    newElements[elementIndex] = element
    
    // Add to history
    const newHistory = [...history.slice(0, historyIndex + 1), newElements]
    
    set({
      elements: newElements,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false
    })
  },
  
  removeElement: (elementId) => {
    if (!elementId) {
      console.error('Invalid elementId:', elementId);
      return;
    }

    const { elements, history, historyIndex } = get();
    
    // Check if the element exists before trying to remove it
    const elementExists = elements.some(e => e.id === elementId);
    if (!elementExists) {
      // Element doesn't exist in store, nothing to remove
      return;
    }
    
    const newElements = elements.filter(e => e.id !== elementId);
    
    // Only add to history if something actually changed
    if (newElements.length !== elements.length) {
      // Add to history
      const newHistory = [...history.slice(0, historyIndex + 1), newElements];
      
      set({
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        canUndo: true,
        canRedo: false
      });
    }
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    
    const newIndex = historyIndex - 1
    set({
      elements: history[newIndex],
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true
    })
    
    // Update canvas with previous state if available
    const canvas = window.fabricCanvas
    if (canvas) {
      canvas.clear()
      canvas.backgroundColor = 'white'
      
      // Load objects from history
      const elements = history[newIndex]
      if (elements && elements.length > 0) {
        elements.forEach(element => {
          if (element && element.data) {
            fabric.util.enlivenObjects([element.data], (objects) => {
              const obj = objects[0]
              obj.id = element.id
              obj._ignoreSave = true
              obj._loadedFromStore = true
              obj._addedToStore = true
              canvas.add(obj)
            })
          }
        })
      }
      
      canvas.renderAll()
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    
    const newIndex = historyIndex + 1
    set({
      elements: history[newIndex],
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < history.length - 1
    })
    
    // Update canvas with next state if available
    const canvas = window.fabricCanvas
    if (canvas) {
      canvas.clear()
      canvas.backgroundColor = 'white'
      
      // Load objects from history
      const elements = history[newIndex]
      if (elements && elements.length > 0) {
        elements.forEach(element => {
          if (element && element.data) {
            fabric.util.enlivenObjects([element.data], (objects) => {
              const obj = objects[0]
              obj.id = element.id
              obj._ignoreSave = true
              obj._loadedFromStore = true
              obj._addedToStore = true
              canvas.add(obj)
            })
          }
        })
      }
      
      canvas.renderAll()
    }
  },
  
  saveBoard: async (boardId) => {
    if (!boardId) {
      console.error('No boardId provided for saving')
      return false
    }

    try {
      const { elements } = get()
      
      // Make sure we're sending valid data
      const cleanElements = elements.filter(el => el && el.id && el.type && el.data)
      
      const response = await axios.patch(`/api/boards/${boardId}`, { 
        elements: cleanElements 
      })
      
      if (response.status === 200) {
        return true
      } else {
        console.error('Error saving board - unexpected status:', response.status)
        return false
      }
    } catch (error) {
      console.error('Error saving board:', error)
      return false
    }
  }
}))
