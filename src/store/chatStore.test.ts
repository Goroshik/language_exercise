import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const alertError = vi.fn();
const alertSuccess = vi.fn();

vi.mock('src/utils/alert', () => ({
  showAlert: {
    error: (...a: unknown[]) => alertError(...a),
    success: (...a: unknown[]) => alertSuccess(...a)
  }
}));

const { toChatMessages, useChatStore } = await import('./chatStore');

const ok = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) });
const failure = (error: string) => ({ ok: false, json: () => Promise.resolve({ error }) });

const stubFetch = (response: unknown) => {
  const mock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', mock);
  return mock;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  useChatStore.setState({
    messages: [],
    chatId: null,
    isOpen: false,
    isLoading: false,
    currentLanguage: null
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toChatMessages', () => {
  it('stamps every message with the given time', () => {
    expect(toChatMessages([{ role: 'user', content: 'hi' }], 42)).toEqual([
      { role: 'user', content: 'hi', timestamp: 42 }
    ]);
  });

  it('keeps the order', () => {
    const result = toChatMessages(
      [
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' }
      ],
      0
    );
    expect(result.map(m => m.content)).toEqual(['a', 'b']);
  });

  it('returns nothing for no messages', () => {
    expect(toChatMessages([], 0)).toEqual([]);
  });
});

describe('simple setters', () => {
  it('appends a message', () => {
    useChatStore.getState().addMessage({ role: 'user', content: 'hi', timestamp: 1 });
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('replaces all messages', () => {
    useChatStore.getState().setMessages([{ role: 'user', content: 'hi', timestamp: 1 }]);
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('clears the messages', () => {
    useChatStore.getState().setMessages([{ role: 'user', content: 'hi', timestamp: 1 }]);
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it('toggles the panel', () => {
    useChatStore.getState().setIsOpen(true);
    expect(useChatStore.getState().isOpen).toBe(true);
  });

  it('sets the loading flag', () => {
    useChatStore.getState().setIsLoading(true);
    expect(useChatStore.getState().isLoading).toBe(true);
  });

  it('sets the chat id', () => {
    useChatStore.getState().setChatId('c1');
    expect(useChatStore.getState().chatId).toBe('c1');
  });

  it('starts a new chat by dropping the id and the messages', () => {
    useChatStore.setState({
      chatId: 'c1',
      messages: [{ role: 'user', content: 'x', timestamp: 1 }]
    });
    useChatStore.getState().createNewChat();
    expect(useChatStore.getState()).toMatchObject({ chatId: null, messages: [] });
  });
});

describe('sendMessage', () => {
  it('ignores an empty message', async () => {
    const fetchMock = stubFetch(ok({}));
    await useChatStore.getState().sendMessage('   ');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a message while one is in flight', async () => {
    useChatStore.setState({ isLoading: true });
    const fetchMock = stubFetch(ok({}));
    await useChatStore.getState().sendMessage('hi');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the user message immediately', async () => {
    stubFetch(ok({ message: { content: 'hello' }, chatId: 'c1' }));
    await useChatStore.getState().sendMessage('hi');
    expect(useChatStore.getState().messages[0]).toMatchObject({ role: 'user', content: 'hi' });
  });

  it('appends the assistant reply', async () => {
    stubFetch(ok({ message: { content: 'hello' }, chatId: 'c1' }));
    await useChatStore.getState().sendMessage('hi');
    expect(useChatStore.getState().messages[1]).toMatchObject({
      role: 'assistant',
      content: 'hello'
    });
  });

  it('trims the message before sending', async () => {
    const fetchMock = stubFetch(ok({ message: { content: 'x' } }));
    await useChatStore.getState().sendMessage('  hi  ');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ message: 'hi' });
  });

  it('adopts the chat id the server assigned', async () => {
    stubFetch(ok({ message: { content: 'x' }, chatId: 'c9' }));
    await useChatStore.getState().sendMessage('hi');
    expect(useChatStore.getState().chatId).toBe('c9');
  });

  it('sends the existing chat id along', async () => {
    useChatStore.setState({ chatId: 'c1' });
    const fetchMock = stubFetch(ok({ message: { content: 'x' }, chatId: 'c1' }));
    await useChatStore.getState().sendMessage('hi');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ chatId: 'c1' });
  });

  it('surfaces the server error message', async () => {
    stubFetch(failure('quota exceeded'));
    await useChatStore.getState().sendMessage('hi');
    expect(alertError).toHaveBeenCalledWith('quota exceeded');
  });

  it('falls back to a generic message when the server gives none', async () => {
    stubFetch({ ok: false, json: () => Promise.resolve({}) });
    await useChatStore.getState().sendMessage('hi');
    expect(alertError).toHaveBeenCalledWith('Failed to send message');
  });

  it('clears the loading flag even after a failure', async () => {
    stubFetch(failure('nope'));
    await useChatStore.getState().sendMessage('hi');
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('keeps the user message visible after a failure', async () => {
    stubFetch(failure('nope'));
    await useChatStore.getState().sendMessage('hi');
    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});

describe('loadHistory', () => {
  it('replaces the messages with the stored history', async () => {
    stubFetch(ok({ chatId: 'c1', messages: [{ role: 'user', content: 'old' }] }));
    await useChatStore.getState().loadHistory();

    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().chatId).toBe('c1');
  });

  it('copes with a history that has no messages', async () => {
    stubFetch(ok({ chatId: 'c1' }));
    await useChatStore.getState().loadHistory();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it('leaves the chat id alone when the server sends none', async () => {
    useChatStore.setState({ chatId: 'c1' });
    stubFetch(ok({ messages: [] }));
    await useChatStore.getState().loadHistory();
    expect(useChatStore.getState().chatId).toBe('c1');
  });

  it('keeps local messages and alerts nobody when loading fails', async () => {
    useChatStore.setState({ messages: [{ role: 'user', content: 'local', timestamp: 1 }] });
    stubFetch(failure('nope'));
    await useChatStore.getState().loadHistory();

    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(alertError).not.toHaveBeenCalled();
  });
});

describe('setCurrentLanguage', () => {
  it('records the language on first use and loads history', async () => {
    stubFetch(ok({ messages: [] }));
    useChatStore.getState().setCurrentLanguage('pl');

    expect(useChatStore.getState().currentLanguage).toBe('pl');
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalled();
  });

  it('does nothing extra when the language is unchanged', async () => {
    useChatStore.setState({ currentLanguage: 'pl' });
    stubFetch(ok({ messages: [] }));

    useChatStore.getState().setCurrentLanguage('pl');
    await vi.runAllTimersAsync();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('starts a fresh conversation when the language changes', async () => {
    useChatStore.setState({
      currentLanguage: 'pl',
      chatId: 'c1',
      messages: [{ role: 'user', content: 'x', timestamp: 1 }]
    });
    stubFetch(ok({ messages: [] }));

    useChatStore.getState().setCurrentLanguage('en');
    expect(useChatStore.getState()).toMatchObject({ chatId: null, messages: [] });

    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalled();
  });
});

describe('clearHistory', () => {
  it('starts a new chat and says so', async () => {
    useChatStore.setState({
      chatId: 'c1',
      messages: [{ role: 'user', content: 'x', timestamp: 1 }]
    });
    await useChatStore.getState().clearHistory();

    expect(useChatStore.getState()).toMatchObject({ chatId: null, messages: [] });
    expect(alertSuccess).toHaveBeenCalledWith('Начат новый чат');
  });
});
