/**
 * Covers the OpenAIService class itself. The pure helpers it delegates to live
 * in openAI.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
const findByUserId = vi.fn();
const getToken = vi.fn();
const openAIConstructor = vi.fn();

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: (...a: unknown[]) => create(...a) } };
    constructor(options: { apiKey?: string }) {
      openAIConstructor(options);
    }
  }
}));

vi.mock('src/repository/client', () => ({
  userSettingsRepository: { findByUserId: (...a: unknown[]) => findByUserId(...a) }
}));

vi.mock('src/utils/tokenService', () => ({
  TokenService: { getToken: (...a: unknown[]) => getToken(...a) }
}));

const { OpenAIService } = await import('./openAI');

const completion = (content: string | null) => ({ choices: [{ message: { content } }] });

let service: InstanceType<typeof OpenAIService>;

beforeEach(() => {
  vi.clearAllMocks();
  service = new OpenAIService();
  getToken.mockResolvedValue({ token: 'sk-test' });
  findByUserId.mockResolvedValue({ aiModel: 'gpt-4o' });
  create.mockResolvedValue(completion('[{"word":"book","translate":"книга"}]'));
});

describe('token handling', () => {
  it('names itself openai so the right token is fetched', async () => {
    await service.generateText('hi', 'u1');
    expect(getToken).toHaveBeenCalledWith('u1', 'openai');
  });

  it('passes the token to the SDK', async () => {
    await service.generateText('hi', 'u1');
    expect(openAIConstructor).toHaveBeenCalledWith({ apiKey: 'sk-test' });
  });

  it('fails when the user has no token', async () => {
    getToken.mockResolvedValue({ token: null, error: 'No token found for service: openai' });
    await expect(service.generateText('hi', 'u1')).rejects.toThrow(/No token found/);
  });

  it('falls back to a generic message when the token lookup gives no reason', async () => {
    getToken.mockResolvedValue({ token: null });
    await expect(service.generateText('hi', 'u1')).rejects.toThrow(/No token found for openai/);
  });
});

describe('model selection', () => {
  it('uses the model from user settings', async () => {
    await service.generateText('hi', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }));
  });

  it('ignores a model that belongs to another provider', async () => {
    findByUserId.mockResolvedValue({ aiModel: 'gemini-2.5-flash' });
    await service.generateText('hi', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }));
  });

  it('defaults when settings carry no model', async () => {
    findByUserId.mockResolvedValue({});
    await service.generateText('hi', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }));
  });

  it('defaults when there are no settings at all', async () => {
    findByUserId.mockResolvedValue(null);
    await service.generateText('hi', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }));
  });

  it('defaults when the settings lookup fails', async () => {
    findByUserId.mockRejectedValue(new Error('db down'));
    await service.generateText('hi', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }));
  });
});

describe('generateText', () => {
  it('returns the completion text', async () => {
    create.mockResolvedValue(completion('Ona czyta.'));
    await expect(service.generateText('hi', 'u1')).resolves.toEqual({ text: 'Ona czyta.' });
  });

  it('returns an empty string when the model says nothing', async () => {
    create.mockResolvedValue(completion(null));
    await expect(service.generateText('hi', 'u1')).resolves.toEqual({ text: '' });
  });

  it('returns an empty string when there are no choices', async () => {
    create.mockResolvedValue({ choices: [] });
    await expect(service.generateText('hi', 'u1')).resolves.toEqual({ text: '' });
  });

  it('sends the prompt as a user message', async () => {
    await service.generateText('translate this', 'u1');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [{ role: 'user', content: 'translate this' }] })
    );
  });

  it('translates a rate limit into an actionable message', async () => {
    create.mockRejectedValue({ status: 429 });
    await expect(service.generateText('hi', 'u1')).rejects.toThrow(/rate limit exceeded/);
  });

  it('rethrows any other provider error', async () => {
    create.mockRejectedValue(new Error('bad request'));
    await expect(service.generateText('hi', 'u1')).rejects.toThrow('bad request');
  });
});

describe('parseWordsFromText', () => {
  it('returns the parsed word pairs', async () => {
    await expect(service.parseWordsFromText('book - книга', 'u1')).resolves.toEqual([
      { word: 'book', translate: 'книга' }
    ]);
  });

  it('embeds the text in the prompt', async () => {
    await service.parseWordsFromText('book - книга', 'u1');
    const messages = create.mock.calls[0]?.[0]?.messages as Array<{ content: string }>;
    expect(messages[1]?.content).toContain('book - книга');
  });

  it('instructs the model to answer with JSON only', async () => {
    await service.parseWordsFromText('x', 'u1');
    const messages = create.mock.calls[0]?.[0]?.messages as Array<{
      role: string;
      content: string;
    }>;
    expect(messages[0]).toMatchObject({ role: 'system' });
    expect(messages[0]?.content).toContain('valid JSON only');
  });

  it('uses a low temperature for parsing', async () => {
    await service.parseWordsFromText('x', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.3 }));
  });

  it('fails when the model does not answer with JSON', async () => {
    create.mockResolvedValue(completion('sorry, I cannot help'));
    await expect(service.parseWordsFromText('x', 'u1')).rejects.toThrow(/Failed to parse/);
  });

  it('translates a rate limit into an actionable message', async () => {
    create.mockRejectedValue({ message: 'Error 429: too many requests' });
    await expect(service.parseWordsFromText('x', 'u1')).rejects.toThrow(/rate limit exceeded/);
  });
});

describe('generateTextStream', () => {
  const chunks = (...contents: Array<string | null>) => ({
    async *[Symbol.asyncIterator]() {
      for (const content of contents) yield { choices: [{ delta: { content } }] };
    }
  });

  const collect = async (iterable: AsyncIterable<string>) => {
    const out: string[] = [];
    for await (const piece of iterable) out.push(piece);
    return out;
  };

  it('yields the streamed content', async () => {
    create.mockResolvedValue(chunks('Ona ', 'czyta'));
    await expect(collect(await service.generateTextStream('hi', 'u1'))).resolves.toEqual([
      'Ona ',
      'czyta'
    ]);
  });

  it('skips empty and null deltas', async () => {
    create.mockResolvedValue(chunks('', null, 'x'));
    await expect(collect(await service.generateTextStream('hi', 'u1'))).resolves.toEqual(['x']);
  });

  it('asks the SDK to stream', async () => {
    create.mockResolvedValue(chunks('x'));
    await service.generateTextStream('hi', 'u1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ stream: true }));
  });

  it('translates a rate limit into an actionable message', async () => {
    create.mockRejectedValue({ status: 429 });
    await expect(service.generateTextStream('hi', 'u1')).rejects.toThrow(/rate limit exceeded/);
  });
});
