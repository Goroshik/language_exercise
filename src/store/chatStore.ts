import { showAlert } from 'src/utils/alert';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const CHAT_STORAGE_KEY = 'chat-storage';
const CHAT_ENDPOINT = '/api/chat/message';

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

type Set = {
  (partial: Partial<ChatStore>): void;
  (updater: (state: ChatStore) => Partial<ChatStore>): void;
};
type Get = () => ChatStore;

/** The DB schema carries no timestamp, so history is stamped on arrival. */
export function toChatMessages(
  raw: Array<{ role: string; content: string }>,
  now: number
): ChatMessage[] {
  return raw.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: now
  }));
}

const EMPTY_CHAT = { messages: [], chatId: null };

const setCurrentLanguage = (set: Set, get: Get) => (language: string) => {
  const previousLanguage = get().currentLanguage;
  set({ currentLanguage: language });

  if (previousLanguage === language) return;

  // A language switch starts a fresh conversation; the first initialisation just
  // loads whatever the server has. Deferred so the new state is visible.
  if (previousLanguage) {
    set(EMPTY_CHAT);
  }
  setTimeout(() => void get().loadHistory(), 0);
};

const sendMessage = (set: Set, get: Get) => async (message: string) => {
  const userMessage = message.trim();
  if (!userMessage || get().isLoading) return;

  get().addMessage({ role: 'user', content: userMessage, timestamp: Date.now() });
  set({ isLoading: true });

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, chatId: get().chatId })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    if (data.chatId) {
      set({ chatId: data.chatId });
    }
    get().addMessage({ role: 'assistant', content: data.message.content, timestamp: Date.now() });
  } catch (error) {
    showAlert.error(error instanceof Error ? error.message : 'Ошибка при отправке сообщения');
  } finally {
    set({ isLoading: false });
  }
};

const loadHistory = (set: Set) => async () => {
  try {
    const response = await fetch(CHAT_ENDPOINT);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load chat history');
    }

    if (data.chatId) {
      set({ chatId: data.chatId });
    }
    set({ messages: toChatMessages(data.messages || [], Date.now()) });
  } catch (error) {
    // Keep whatever is on screen; a failed history load is not worth an alert.
    console.error('Failed to load chat history:', error);
  }
};

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        chatId: null,
        isOpen: false,
        isLoading: false,
        currentLanguage: null,

        addMessage: (message: ChatMessage) =>
          set(state => ({ messages: [...state.messages, message] })),
        setMessages: (messages: ChatMessage[]) => set({ messages }),
        clearMessages: () => set({ messages: [] }),
        setIsOpen: (isOpen: boolean) => set({ isOpen }),
        setIsLoading: (isLoading: boolean) => set({ isLoading }),
        setChatId: (chatId: string | null) => set({ chatId }),
        createNewChat: () => set(EMPTY_CHAT),

        setCurrentLanguage: setCurrentLanguage(set, get),
        sendMessage: sendMessage(set, get),
        loadHistory: loadHistory(set),

        clearHistory: async () => {
          // Simply start a new chat - old messages stay in the database.
          set(EMPTY_CHAT);
          showAlert.success('Начат новый чат');
        }
      }),
      { name: CHAT_STORAGE_KEY }
    )
  )
);
