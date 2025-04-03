import { create } from 'zustand';
import axios from 'axios';

export const useChatStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  isChatOpen: false,
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => {
    const { messages, isChatOpen } = get();
    set({ 
      messages: [...messages, message],
      // Increment unread count if chat is closed
      unreadCount: isChatOpen ? 0 : get().unreadCount + 1 
    });
  },
  
  loadChatHistory: async (boardId) => {
    if (!boardId) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const response = await axios.get(`/api/boards/${boardId}/messages`);
      set({ messages: response.data, isLoading: false });
    } catch (error) {
      console.error('Error loading chat history:', error);
      set({ error: 'Failed to load chat history', isLoading: false });
    }
  },
  
  setChatOpen: (isOpen) => set({ 
    isChatOpen: isOpen,
    // Reset unread count when opening chat
    unreadCount: isOpen ? 0 : get().unreadCount
  }),
  
  clearUnreadCount: () => set({ unreadCount: 0 })
}));
