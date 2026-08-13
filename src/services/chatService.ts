import { randomUUID } from 'crypto';
import { CHAT_PROMPTS } from 'src/prompts';
import { chatMessageRepository, userSettingsRepository } from 'src/repository/client';
import { AIFactory } from './aiFactory';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageRequest {
  message: string;
  userId: string;
  chatId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  chatId: string;
}

// Readable names for the prompt; unknown codes fall through as-is.
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'английский',
  pl: 'польский',
  de: 'немецкий',
  fr: 'французский',
  es: 'испанский',
  it: 'итальянский'
};

export function languageNameFor(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

/** The chat the user is continuing, creating one for the language if needed. */
async function resolveChatId(
  userId: string,
  learningLanguage: string,
  provided: string | undefined
): Promise<string> {
  if (provided) return provided;

  const existing = await userSettingsRepository.getChatIdForLanguage(userId, learningLanguage);
  if (existing) return existing;

  const chatId = randomUUID();
  await userSettingsRepository.setChatIdForLanguage(userId, learningLanguage, chatId);
  return chatId;
}

export class ChatService {
  /**
   * Send a message to the AI chat assistant
   * @param request - Contains user message, userId, and optional chatId
   * @returns Response with assistant's reply and chatId
   */
  static async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const { message, userId } = request;

    const userSettings = await userSettingsRepository.findByUserId(userId);
    const learningLanguage = userSettings?.learningLanguage || 'en';
    const chatId = await resolveChatId(userId, learningLanguage, request.chatId);

    await chatMessageRepository.addMessage({ userId, chatId, role: 'user', content: message });

    const aiService = await AIFactory.getAIService(userId);
    if (typeof aiService.generateText !== 'function') {
      throw new Error('Selected AI service does not support chat functionality');
    }

    const prompt = CHAT_PROMPTS.systemPrompt(message, languageNameFor(learningLanguage));
    const aiResponse = await aiService.generateText(prompt, userId);

    await chatMessageRepository.addMessage({
      userId,
      chatId,
      role: 'assistant',
      content: aiResponse.text
    });

    return { message: { role: 'assistant', content: aiResponse.text }, chatId };
  }

  /**
   * Get chat history for a user and specific chat
   * @param userId - User ID
   * @param chatId - Chat ID (if not provided, gets from user settings based on current language)
   * @param limit - Maximum number of messages to retrieve
   * @returns Array of chat messages and chatId
   */
  static async getChatHistory(
    userId: string,
    chatId?: string,
    limit = 50
  ): Promise<{ messages: ChatMessage[]; chatId: string | null }> {
    // If no chatId provided, get from user settings for current language
    let activeChatId = chatId;
    if (!activeChatId) {
      const settings = await userSettingsRepository.findByUserId(userId);
      const learningLanguage = settings?.learningLanguage || 'en';

      // Get chatId for current language
      const languageChatId = await userSettingsRepository.getChatIdForLanguage(
        userId,
        learningLanguage
      );
      activeChatId = languageChatId || undefined;
    }

    if (!activeChatId) {
      return { messages: [], chatId: null };
    }

    const messages = await chatMessageRepository.getMessages({
      userId,
      chatId: activeChatId,
      limit
    });
    return {
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      chatId: activeChatId
    };
  }

  /**
   * Clear chat history for a specific chat
   * @param userId - User ID
   * @param chatId - Chat ID
   */
  static async clearChatHistory(userId: string, chatId: string): Promise<void> {
    await chatMessageRepository.deleteAllMessages(userId, chatId);
  }

  /**
   * Create a new chat session for current language
   * @param userId - User ID
   * @returns New chatId
   */
  static async createNewChat(userId: string): Promise<string> {
    const settings = await userSettingsRepository.findByUserId(userId);
    const learningLanguage = settings?.learningLanguage || 'en';

    const chatId = randomUUID();
    await userSettingsRepository.setChatIdForLanguage(userId, learningLanguage, chatId);
    return chatId;
  }

  /**
   * Get list of all chats for a user
   * @param userId - User ID
   * @returns Array of chat IDs
   */
  static async getAllChats(userId: string): Promise<string[]> {
    return chatMessageRepository.getAllChats(userId);
  }
}
