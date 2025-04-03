import { create } from 'zustand'
import { io } from 'socket.io-client'

export const useSocketStore = create((set, get) => ({
  socket: null,
  
  initSocket: () => {
    const { socket } = get()
    if (socket) return socket

    // Connect to server
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const newSocket = io(serverUrl)
    
    newSocket.on('connect', () => {
      console.log('Connected to socket server')
    })
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
    
    set({ socket: newSocket })
    return newSocket
  },
  
  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null })
    }
  }
}))
