import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { showAlert } from 'src/utils/alert';

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
  sendMessage: (message: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
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
        },

        sendMessage: async (message: string) => {
          const userMessage = message.trim();
          if (!userMessage || get().isLoading) return;

          // Add user message to local store immediately
          get().addMessage({
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
          });

          set({ isLoading: true });

          try {
            const response = await fetch('/api/chat/message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to send message');
            }

            // Add AI assistant's response to local store
            get().addMessage({
              role: 'assistant',
              content: data.message.content,
              timestamp: Date.now()
            });
          } catch (error) {
            showAlert.error(
              error instanceof Error ? error.message : 'Ошибка при отправке сообщения'
            );
          } finally {
            set({ isLoading: false });
          }
        }
      }),
      {
        name: CHAT_STORAGE_KEY
      }
    )
  )
);
