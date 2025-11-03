import { showAlert } from 'src/utils/alert';
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
  chatId: string | null;
  isOpen: boolean;
  isLoading: boolean;
  currentLanguage: string | null; // Track current language to detect changes
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setChatId: (chatId: string | null) => void;
  setCurrentLanguage: (language: string) => void;
  sendMessage: (message: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  createNewChat: () => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        chatId: null,
        isOpen: false,
        isLoading: false,
        currentLanguage: null,

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

        setChatId: (chatId: string | null) => {
          set({ chatId });
        },

        setCurrentLanguage: (language: string) => {
          const previousLanguage = get().currentLanguage;
          console.log('[ChatStore] setCurrentLanguage:', { previousLanguage, newLanguage: language });
          
          // Update language
          set({ currentLanguage: language });
          
          // If language changed (and it's not the first initialization), reload chat history
          if (previousLanguage && previousLanguage !== language) {
            console.log('[ChatStore] Language changed, clearing and reloading history');
            set({ messages: [], chatId: null });
            // Use setTimeout to ensure state is updated before loading
            setTimeout(() => {
              get().loadHistory();
            }, 0);
          } else if (!previousLanguage) {
            // First time initialization - load history for current language
            console.log('[ChatStore] First initialization, loading history');
            setTimeout(() => {
              get().loadHistory();
            }, 0);
          }
        },

        createNewChat: () => {
          set({ messages: [], chatId: null });
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
              body: JSON.stringify({ 
                message: userMessage,
                chatId: get().chatId 
              })
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to send message');
            }

            // Update chatId if it's a new chat
            if (data.chatId && data.chatId !== get().chatId) {
              set({ chatId: data.chatId });
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
        },

        loadHistory: async () => {
          console.log('[ChatStore] loadHistory called');
          try {
            const response = await fetch('/api/chat/message');
            const data = await response.json();

            console.log('[ChatStore] loadHistory response:', { chatId: data.chatId, messagesCount: data.messages?.length });

            if (!response.ok) {
              throw new Error(data.error || 'Failed to load chat history');
            }

            // Set chatId from server response
            if (data.chatId) {
              set({ chatId: data.chatId });
            }

            // Convert DB messages to store format
            const historyMessages: ChatMessage[] = (data.messages || []).map((msg: { role: string; content: string }) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: Date.now() // DB doesn't have timestamp in current schema
            }));

            set({ messages: historyMessages });
          } catch (error) {
            console.error('Failed to load chat history:', error);
            // Don't show error alert, just keep local messages
          }
        },

        clearHistory: async () => {
          // Simply start a new chat - old messages stay in DB
          set({ messages: [], chatId: null });
          showAlert.success('Начат новый чат');
        }
      }),
      {
        name: CHAT_STORAGE_KEY
      }
    )
  )
);
