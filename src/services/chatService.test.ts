import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByUserId = vi.fn();
const getChatIdForLanguage = vi.fn();
const setChatIdForLanguage = vi.fn();
const addMessage = vi.fn();
const getMessages = vi.fn();
const deleteAllMessages = vi.fn();
const getAllChats = vi.fn();
const getAIService = vi.fn();
const generateText = vi.fn();

vi.mock('crypto', () => ({ randomUUID: () => 'generated-uuid' }));

vi.mock('src/repository/client', () => ({
  userSettingsRepository: {
    findByUserId: (...a: unknown[]) => findByUserId(...a),
    getChatIdForLanguage: (...a: unknown[]) => getChatIdForLanguage(...a),
    setChatIdForLanguage: (...a: unknown[]) => setChatIdForLanguage(...a)
  },
  chatMessageRepository: {
    addMessage: (...a: unknown[]) => addMessage(...a),
    getMessages: (...a: unknown[]) => getMessages(...a),
    deleteAllMessages: (...a: unknown[]) => deleteAllMessages(...a),
    getAllChats: (...a: unknown[]) => getAllChats(...a)
  }
}));

vi.mock('./aiFactory', () => ({
  AIFactory: { getAIService: (...a: unknown[]) => getAIService(...a) }
}));

const { ChatService, languageNameFor } = await import('./chatService');

beforeEach(() => {
  vi.clearAllMocks();
  findByUserId.mockResolvedValue({ learningLanguage: 'pl' });
  getChatIdForLanguage.mockResolvedValue('c1');
  setChatIdForLanguage.mockResolvedValue({});
  addMessage.mockResolvedValue({});
  getMessages.mockResolvedValue([]);
  getAIService.mockResolvedValue({ generateText });
  generateText.mockResolvedValue({ text: 'Odpowiedź' });
});

describe('languageNameFor', () => {
  it.each([
    ['en', 'английский'],
    ['pl', 'польский'],
    ['de', 'немецкий'],
    ['fr', 'французский'],
    ['es', 'испанский'],
    ['it', 'итальянский']
  ])('names %s in Russian', (code, expected) => {
    expect(languageNameFor(code)).toBe(expected);
  });

  it('passes an unknown code through unchanged', () => {
    expect(languageNameFor('zz')).toBe('zz');
  });
});

describe('sendMessage', () => {
  const request = { message: 'Cześć', userId: 'u1' };

  it('returns the assistant reply and the chat id', async () => {
    await expect(ChatService.sendMessage(request)).resolves.toEqual({
      message: { role: 'assistant', content: 'Odpowiedź' },
      chatId: 'c1'
    });
  });

  it('reuses the chat id it was handed', async () => {
    const result = await ChatService.sendMessage({ ...request, chatId: 'given' });
    expect(result.chatId).toBe('given');
    expect(getChatIdForLanguage).not.toHaveBeenCalled();
  });

  it('reuses the chat stored for the language', async () => {
    await ChatService.sendMessage(request);
    expect(getChatIdForLanguage).toHaveBeenCalledWith('u1', 'pl');
    expect(setChatIdForLanguage).not.toHaveBeenCalled();
  });

  it('creates and remembers a chat when the language has none', async () => {
    getChatIdForLanguage.mockResolvedValue(null);
    const result = await ChatService.sendMessage(request);

    expect(result.chatId).toBe('generated-uuid');
    expect(setChatIdForLanguage).toHaveBeenCalledWith('u1', 'pl', 'generated-uuid');
  });

  it('falls back to en when settings carry no language', async () => {
    findByUserId.mockResolvedValue({});
    await ChatService.sendMessage(request);
    expect(getChatIdForLanguage).toHaveBeenCalledWith('u1', 'en');
  });

  it('falls back to en when there are no settings', async () => {
    findByUserId.mockResolvedValue(null);
    await ChatService.sendMessage(request);
    expect(getChatIdForLanguage).toHaveBeenCalledWith('u1', 'en');
  });

  it('stores the user message before asking the model', async () => {
    await ChatService.sendMessage(request);
    expect(addMessage).toHaveBeenNthCalledWith(1, {
      userId: 'u1',
      chatId: 'c1',
      role: 'user',
      content: 'Cześć'
    });
  });

  it('stores the assistant reply too', async () => {
    await ChatService.sendMessage(request);
    expect(addMessage).toHaveBeenNthCalledWith(2, {
      userId: 'u1',
      chatId: 'c1',
      role: 'assistant',
      content: 'Odpowiedź'
    });
  });

  it('names the language in Russian inside the prompt', async () => {
    await ChatService.sendMessage(request);
    expect(String(generateText.mock.calls[0]?.[0])).toContain('польский');
  });

  it('rejects a provider that cannot generate text', async () => {
    getAIService.mockResolvedValue({ generateText: undefined });
    await expect(ChatService.sendMessage(request)).rejects.toThrow(
      /does not support chat functionality/
    );
  });

  it('does not store an assistant message when the model fails', async () => {
    generateText.mockRejectedValue(new Error('rate limited'));
    await expect(ChatService.sendMessage(request)).rejects.toThrow('rate limited');
    expect(addMessage).toHaveBeenCalledOnce();
  });
});

describe('getChatHistory', () => {
  it('returns the stored messages for an explicit chat', async () => {
    getMessages.mockResolvedValue([{ role: 'user', content: 'hi' }]);
    await expect(ChatService.getChatHistory('u1', 'c1')).resolves.toEqual({
      messages: [{ role: 'user', content: 'hi' }],
      chatId: 'c1'
    });
  });

  it('resolves the chat from the language when none is given', async () => {
    await ChatService.getChatHistory('u1');
    expect(getChatIdForLanguage).toHaveBeenCalledWith('u1', 'pl');
  });

  it('reports no chat when the language has none', async () => {
    getChatIdForLanguage.mockResolvedValue(null);
    await expect(ChatService.getChatHistory('u1')).resolves.toEqual({ messages: [], chatId: null });
    expect(getMessages).not.toHaveBeenCalled();
  });

  it('defaults the limit to fifty', async () => {
    await ChatService.getChatHistory('u1', 'c1');
    expect(getMessages).toHaveBeenCalledWith({ userId: 'u1', chatId: 'c1', limit: 50 });
  });

  it('honours an explicit limit', async () => {
    await ChatService.getChatHistory('u1', 'c1', 10);
    expect(getMessages).toHaveBeenCalledWith({ userId: 'u1', chatId: 'c1', limit: 10 });
  });

  it('falls back to en when settings carry no language', async () => {
    findByUserId.mockResolvedValue({});
    await ChatService.getChatHistory('u1');
    expect(getChatIdForLanguage).toHaveBeenCalledWith('u1', 'en');
  });
});

describe('createNewChat', () => {
  it('generates a chat id and stores it for the language', async () => {
    await expect(ChatService.createNewChat('u1')).resolves.toBe('generated-uuid');
    expect(setChatIdForLanguage).toHaveBeenCalledWith('u1', 'pl', 'generated-uuid');
  });

  it('falls back to en when there are no settings', async () => {
    findByUserId.mockResolvedValue(null);
    await ChatService.createNewChat('u1');
    expect(setChatIdForLanguage).toHaveBeenCalledWith('u1', 'en', 'generated-uuid');
  });
});

describe('clearChatHistory and getAllChats', () => {
  it('deletes every message of the chat', async () => {
    await ChatService.clearChatHistory('u1', 'c1');
    expect(deleteAllMessages).toHaveBeenCalledWith('u1', 'c1');
  });

  it('lists the chats of the user', async () => {
    getAllChats.mockResolvedValue(['c1', 'c2']);
    await expect(ChatService.getAllChats('u1')).resolves.toEqual(['c1', 'c2']);
  });
});
