import { describe, expect, it } from 'vitest';
import {
  buildParsePrompt,
  isOpenAIModel,
  parseWordPairs,
  rethrowOpenAIError,
  streamContent
} from './openAI';

describe('isOpenAIModel', () => {
  it.each(['gpt-5', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'])('accepts %s', model => {
    expect(isOpenAIModel(model)).toBe(true);
  });

  it.each(['gemini-2.5-flash', 'claude-sonnet-4', ''])('rejects %s', model => {
    expect(isOpenAIModel(model)).toBe(false);
  });

  it('matches exactly, not by prefix', () => {
    expect(isOpenAIModel('gpt-4o-mini-2024')).toBe(false);
  });
});

describe('rethrowOpenAIError', () => {
  it('translates status 429 into an actionable message', () => {
    expect(() => rethrowOpenAIError({ status: 429 })).toThrow(/rate limit exceeded/);
  });

  it('translates a message mentioning 429 as well', () => {
    expect(() => rethrowOpenAIError(new Error('Request failed with 429'))).toThrow(
      /rate limit exceeded/
    );
  });

  it('rethrows any other error untouched', () => {
    const original = new Error('bad request');
    expect(() => rethrowOpenAIError(original)).toThrow(original);
  });

  it('rethrows a different status untouched', () => {
    expect(() => rethrowOpenAIError({ status: 500, message: 'boom' })).toThrow(
      expect.objectContaining({ status: 500 }) as unknown as Error
    );
  });

  it('rethrows null rather than inventing an error', () => {
    expect(() => rethrowOpenAIError(null)).toThrow();
  });

  it('never returns normally', () => {
    let returned = true;
    try {
      rethrowOpenAIError(new Error('x'));
      returned = true;
    } catch {
      returned = false;
    }
    expect(returned).toBe(false);
  });
});

describe('buildParsePrompt', () => {
  it('embeds the text to parse', () => {
    expect(buildParsePrompt('book - книга')).toContain('book - книга');
  });

  it('asks for a JSON array only', () => {
    const prompt = buildParsePrompt('x');
    expect(prompt).toContain('ONLY a valid JSON array');
    expect(prompt).toContain('"word"');
    expect(prompt).toContain('"translate"');
  });
});

describe('parseWordPairs', () => {
  it('parses a bare JSON array', () => {
    expect(parseWordPairs('[{"word":"book","translate":"книга"}]')).toEqual([
      { word: 'book', translate: 'книга' }
    ]);
  });

  it('strips a json-tagged markdown fence', () => {
    expect(parseWordPairs('```json\n[{"word":"book"}]\n```')).toEqual([{ word: 'book' }]);
  });

  it('strips a bare markdown fence', () => {
    expect(parseWordPairs('```\n[{"word":"book"}]\n```')).toEqual([{ word: 'book' }]);
  });

  it('handles an empty array', () => {
    expect(parseWordPairs('[]')).toEqual([]);
  });

  it('drops entries with no word', () => {
    expect(parseWordPairs('[{"word":"book"},{"translate":"стол"}]')).toEqual([{ word: 'book' }]);
  });

  it('drops entries whose word is not a string', () => {
    expect(parseWordPairs('[{"word":42},{"word":"book"}]')).toEqual([{ word: 'book' }]);
  });

  it('drops entries whose word is empty', () => {
    expect(parseWordPairs('[{"word":""}]')).toEqual([]);
  });

  it('rejects unparseable output', () => {
    expect(() => parseWordPairs('sorry, I cannot help')).toThrow(/Failed to parse/);
  });

  it('rejects valid JSON that is not an array', () => {
    expect(() => parseWordPairs('{"word":"book"}')).toThrow(/Invalid response format/);
  });

  it('distinguishes a parse failure from a shape failure', () => {
    expect(() => parseWordPairs('nope')).toThrow(/Failed to parse/);
    expect(() => parseWordPairs('"nope"')).toThrow(/Invalid response format/);
  });
});

describe('streamContent', () => {
  const stream = async function* (chunks: unknown[]) {
    for (const chunk of chunks) {
      yield chunk as { choices?: Array<{ delta?: { content?: string | null } }> };
    }
  };

  const collect = async (chunks: unknown[]) => {
    const out: string[] = [];
    for await (const piece of streamContent(stream(chunks))) out.push(piece);
    return out;
  };

  it('yields the content deltas in order', async () => {
    await expect(
      collect([
        { choices: [{ delta: { content: 'Ona ' } }] },
        { choices: [{ delta: { content: 'czyta' } }] }
      ])
    ).resolves.toEqual(['Ona ', 'czyta']);
  });

  it('skips empty deltas', async () => {
    await expect(
      collect([
        { choices: [{ delta: { content: '' } }] },
        { choices: [{ delta: { content: 'x' } }] }
      ])
    ).resolves.toEqual(['x']);
  });

  it('skips a null delta', async () => {
    await expect(collect([{ choices: [{ delta: { content: null } }] }])).resolves.toEqual([]);
  });

  it('skips a chunk with no choices', async () => {
    await expect(collect([{}, { choices: [{ delta: { content: 'x' } }] }])).resolves.toEqual(['x']);
  });

  it('yields nothing for an empty stream', async () => {
    await expect(collect([])).resolves.toEqual([]);
  });
});
