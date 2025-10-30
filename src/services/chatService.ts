import { AIFactory } from './aiFactory';
import { chatMessageRepository } from 'src/repository/client';
import { CHAT_PROMPTS } from 'src/prompts';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageRequest {
  message: string;
  userId: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export class ChatService {
  /**
   * Send a message to the AI chat assistant
   * @param request - Contains user message and userId
   * @returns Response with assistant's reply
   */
  static async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const { message, userId } = request;

    // Get AI service based on user settings
    const aiService = await AIFactory.getAIService(userId);

    if (!aiService.generateText) {
      throw new Error('AI service does not support text generation');
    }

    // Build the prompt using the chat prompt template
    const prompt = CHAT_PROMPTS.systemPrompt(message);

    // Generate AI response
    const aiResponse = await aiService.generateText(prompt, userId);

    if (aiResponse.error) {
      throw new Error(aiResponse.error);
    }

    // Save user message to database
    await chatMessageRepository.addMessage({
      userId,
      role: 'user',
      content: message
    });

    // Save assistant response to database
    await chatMessageRepository.addMessage({
      userId,
      role: 'assistant',
      content: aiResponse.text
    });

    return {
      message: {
        role: 'assistant',
        content: aiResponse.text
      }
    };
  }

  /**
   * Get chat history for a user (from database)
   * @param userId - User ID
   * @param limit - Maximum number of messages to retrieve
   * @returns Array of chat messages
   */
  static async getChatHistory(userId: string, limit = 50): Promise<ChatMessage[]> {
    const messages = await chatMessageRepository.getMessages({ userId, limit });
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  }

  /**
   * Clear chat history for a user
   * @param userId - User ID
   */
  static async clearChatHistory(userId: string): Promise<void> {
    await chatMessageRepository.deleteAllMessages(userId);
  }
}
