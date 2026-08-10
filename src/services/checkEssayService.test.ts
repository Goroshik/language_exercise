import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateText = vi.fn();
const getAIService = vi.fn();
const findByIdAndUser = vi.fn();
const updateEssay = vi.fn();
const findByCode = vi.fn();

vi.mock('src/repository/client', () => ({
  essayRepository: {
    findByIdAndUser: (...a: unknown[]) => findByIdAndUser(...a),
    update: (...a: unknown[]) => updateEssay(...a)
  },
  languageRepository: { findByCode: (...a: unknown[]) => findByCode(...a) }
}));

vi.mock('src/services/aiFactory', () => ({
  AIFactory: { getAIService: (...a: unknown[]) => getAIService(...a) }
}));

const { checkEssayService, parseEssayReview } = await import('./checkEssayService');

const REVIEW = {
  level: 'B1',
  errors: [{ text: 'czyta', explanation: 'wrong case', color: '#f00', type: 'grammar' }],
  summary: 'Neat overall'
};

const body = { essayId: 'e1', content: 'a'.repeat(20), languageCode: 'pl' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  findByIdAndUser.mockResolvedValue({ id: 'e1' });
  findByCode.mockResolvedValue({ code: 'pl', name: 'Polish' });
  getAIService.mockResolvedValue({ generateText });
  generateText.mockResolvedValue(JSON.stringify(REVIEW));
  updateEssay.mockResolvedValue({});
});

describe('parseEssayReview', () => {
  it('parses bare JSON', () => {
    expect(parseEssayReview('{"level":"B1","errors":[],"summary":"ok"}')).toMatchObject({
      level: 'B1'
    });
  });

  it('unwraps a json-tagged fence', () => {
    expect(
      parseEssayReview('```json\n{"level":"A2","errors":[],"summary":"ok"}\n```')
    ).toMatchObject({ level: 'A2' });
  });

  it('unwraps a bare fence', () => {
    expect(parseEssayReview('```\n{"level":"C1","errors":[],"summary":"ok"}\n```')).toMatchObject({
      level: 'C1'
    });
  });

  it('tolerates whitespace around the payload', () => {
    expect(parseEssayReview('  {"level":"B2","errors":[],"summary":"ok"}  ')).toMatchObject({
      level: 'B2'
    });
  });

  it('throws on unparseable output', () => {
    expect(() => parseEssayReview('sorry, I cannot help')).toThrow();
  });

  it('unwraps a fence with no newline after the tag', () => {
    expect(parseEssayReview('```json{"level":"B1","errors":[],"summary":"ok"}```')).toMatchObject({
      level: 'B1'
    });
  });

  it('trims whitespace inside the fence', () => {
    expect(
      parseEssayReview('```json\n\n   {"level":"A1","errors":[],"summary":"ok"}   \n\n```')
    ).toMatchObject({ level: 'A1' });
  });

  it('ignores prose around the fence', () => {
    expect(
      parseEssayReview('Here you go:\n```json\n{"level":"C2","errors":[],"summary":"ok"}\n```\nBye')
    ).toMatchObject({ level: 'C2' });
  });
});

describe('checkEssayService', () => {
  it('rejects a body that fails validation', async () => {
    const response = await checkEssayService({ essayId: 'e1' }, 'u1');
    expect(response.status).toBe(400);
  });

  it('rejects content shorter than the minimum', async () => {
    const response = await checkEssayService({ ...body, content: 'short' }, 'u1');
    expect(response.status).toBe(400);
  });

  it('joins several validation messages', async () => {
    const response = await checkEssayService({}, 'u1');
    expect(String(response.body.error)).toContain('; ');
  });

  it('returns 404 when the essay is not the caller’s', async () => {
    findByIdAndUser.mockResolvedValue(null);
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({
      status: 404,
      body: { error: 'Essay not found or access denied' }
    });
  });

  it('scopes the essay lookup to the caller', async () => {
    await checkEssayService(body, 'u1');
    expect(findByIdAndUser).toHaveBeenCalledWith('e1', 'u1');
  });

  it('rejects an unknown language code', async () => {
    findByCode.mockResolvedValue(null);
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({ status: 400, body: { error: 'Invalid language code' } });
  });

  it('returns the review on the happy path', async () => {
    const response = await checkEssayService(body, 'u1');
    expect(response).toMatchObject({ status: 200, body: { success: true, data: REVIEW } });
  });

  it('stores the review and the level on the essay', async () => {
    await checkEssayService(body, 'u1');
    expect(updateEssay).toHaveBeenCalledWith('e1', {
      aiResponse: JSON.stringify(REVIEW),
      level: 'B1'
    });
  });

  it('passes the language name into the prompt', async () => {
    await checkEssayService(body, 'u1');
    expect(String(generateText.mock.calls[0]?.[0])).toContain('Polish');
  });

  it('reports 502 when no AI service is configured', async () => {
    getAIService.mockResolvedValue(null);
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({
      status: 502,
      body: { error: 'AI service not available for user' }
    });
  });

  it('reports 402 when the provider has no token', async () => {
    generateText.mockRejectedValue(new Error('No token found for service: openai'));
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({
      status: 402,
      body: { error: 'AI service token not configured for user' }
    });
  });

  it('surfaces any other provider error message', async () => {
    generateText.mockRejectedValue(new Error('rate limited'));
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({ status: 502, body: { error: 'rate limited' } });
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    generateText.mockRejectedValue('kaboom');
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({
      status: 502,
      body: { error: 'Failed to generate response from AI service' }
    });
  });

  it('accepts an object response carrying text', async () => {
    generateText.mockResolvedValue({ text: JSON.stringify(REVIEW) });
    const response = await checkEssayService(body, 'u1');
    expect(response.status).toBe(200);
  });

  it('reports 500 when the review cannot be parsed', async () => {
    generateText.mockResolvedValue('sorry, I cannot help');
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({
      status: 500,
      body: { error: 'Failed to parse AI response. Please try again.' }
    });
  });

  it('does not touch the essay when parsing failed', async () => {
    generateText.mockResolvedValue('nonsense');
    await checkEssayService(body, 'u1');
    expect(updateEssay).not.toHaveBeenCalled();
  });

  it('reports 500 when something unexpected blows up', async () => {
    findByCode.mockRejectedValue(new Error('db down'));
    const response = await checkEssayService(body, 'u1');
    expect(response).toEqual({ status: 500, body: { error: 'Internal server error' } });
  });
});
