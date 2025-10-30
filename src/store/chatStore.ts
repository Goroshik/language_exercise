import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const CHAT_STORAGE_KEY = 'chat-storage';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      set => ({
        messages: [],
        isOpen: false,
        isLoading: false,

        addMessage: (message: ChatMessage) => {
          set(state => ({
            messages: [...state.messages, message]
          }));
        },

        setMessages: (messages: ChatMessage[]) => {
          set({ messages });
        },

        clearMessages: () => {
          set({ messages: [] });
        },

        setIsOpen: (isOpen: boolean) => {
          set({ isOpen });
        },

        setIsLoading: (isLoading: boolean) => {
          set({ isLoading });
        }
      }),
      {
        name: CHAT_STORAGE_KEY
      }
    )
  )
);
