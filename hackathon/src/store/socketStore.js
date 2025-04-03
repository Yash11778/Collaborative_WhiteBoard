import { create } from 'zustand'
import { io } from 'socket.io-client'

export const useSocketStore = create((set, get) => ({
  socket: null,
  connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
  
  initSocket: () => {
    const { socket, connectionStatus } = get()
    
    if (socket) {
      return socket
    }
    
    if (connectionStatus === 'connecting') {
      return null
    }
    
    set({ connectionStatus: 'connecting' })
    
    try {
      // Connect to server directly to avoid CORS issues with proxy
      const serverUrl = 'http://localhost:5000'
      
      console.log("Connecting to socket server at:", serverUrl)
      
      const newSocket = io(serverUrl, {
        transports: ['websocket'], // Use websocket only to avoid polling issues
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        withCredentials: false // Important for CORS
      })
      
      newSocket.on('connect', () => {
        console.log('Connected to socket server')
        set({ connectionStatus: 'connected', socket: newSocket })
      })
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        set({ connectionStatus: 'error' })
      })
      
      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason)
        set({ connectionStatus: 'disconnected' })
      })
      
      set({ socket: newSocket })
      return newSocket
    } catch (err) {
      console.error('Error initializing socket:', err)
      set({ connectionStatus: 'error' })
      return null
    }
  },
  
  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, connectionStatus: 'disconnected' })
    }
  }
}))
