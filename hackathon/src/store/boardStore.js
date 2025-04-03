import { create } from 'zustand'
import axios from 'axios'

export const useBoardStore = create((set, get) => ({
  elements: [],
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  
  setElements: (elements) => set({ 
    elements,
    history: [elements],
    historyIndex: 0,
    canUndo: false,
    canRedo: false
  }),
  
  addElement: (element) => {
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
    const { elements, history, historyIndex } = get()
    const newElements = elements.filter(e => e.id !== elementId)
    
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
  },
  
  saveBoard: async (boardId) => {
    try {
      const { elements } = get()
      await axios.patch(`/api/boards/${boardId}`, { elements })
      return true
    } catch (error) {
      console.error('Error saving board:', error)
      return false
    }
  }
}))
