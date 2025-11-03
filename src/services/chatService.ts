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

export class ChatService {
  /**
   * Send a message to the AI chat assistant
   * @param request - Contains user message, userId, and optional chatId
   * @returns Response with assistant's reply and chatId
   */
  static async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const { message, userId, chatId: providedChatId } = request;

    // Get or create chatId
    let chatId = providedChatId;
    if (!chatId) {
      // Generate new chatId
      chatId = randomUUID();
      
      // Update user settings with new lastChatId
      await userSettingsRepository.upsert(userId, { lastChatId: chatId });
    }

    // Save user message to database with chatId
    await chatMessageRepository.addMessage({
      userId,
      chatId,
      role: 'user',
      content: message
    });

    // Get user settings to get the learning language
    const userSettings = await userSettingsRepository.findByUserId(userId);
    const learningLanguage = userSettings?.learningLanguage || 'en';
    
    // Map language codes to readable names for the prompt
    const languageNames: Record<string, string> = {
      'en': 'английский',
      'pl': 'польский',
      'de': 'немецкий',
      'fr': 'французский',
      'es': 'испанский',
      'it': 'итальянский'
    };
    const languageName = languageNames[learningLanguage] || learningLanguage;

    // Get AI service based on user settings
    const aiService = await AIFactory.getAIService(userId);

    // Validate that the service supports text generation
    if (typeof aiService.generateText !== 'function') {
      throw new Error('Selected AI service does not support chat functionality');
    }

    // Build the prompt using the chat prompt template with learning language
    const prompt = CHAT_PROMPTS.systemPrompt(message, languageName);

    // Generate AI response
    const aiResponse = await aiService.generateText(prompt, userId);

    if (aiResponse.error) {
      throw new Error(aiResponse.error);
    }

    // Save assistant response to database with chatId
    await chatMessageRepository.addMessage({
      userId,
      chatId,
      role: 'assistant',
      content: aiResponse.text
    });

    return {
      message: {
        role: 'assistant',
        content: aiResponse.text
      },
      chatId
    };
  }

  /**
   * Get chat history for a user and specific chat
   * @param userId - User ID
   * @param chatId - Chat ID (if not provided, gets from user settings)
   * @param limit - Maximum number of messages to retrieve
   * @returns Array of chat messages and chatId
   */
  static async getChatHistory(userId: string, chatId?: string, limit = 50): Promise<{ messages: ChatMessage[]; chatId: string | null }> {
    // If no chatId provided, get from user settings
    let activeChatId = chatId;
    if (!activeChatId) {
      const settings = await userSettingsRepository.findByUserId(userId);
      activeChatId = settings?.lastChatId || undefined;
    }

    if (!activeChatId) {
      return { messages: [], chatId: null };
    }

    const messages = await chatMessageRepository.getMessages({ userId, chatId: activeChatId, limit });
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
   * Create a new chat session
   * @param userId - User ID
   * @returns New chatId
   */
  static async createNewChat(userId: string): Promise<string> {
    const chatId = randomUUID();
    await userSettingsRepository.upsert(userId, { lastChatId: chatId });
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
