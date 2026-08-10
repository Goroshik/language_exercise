import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRandomSentences = vi.fn();
const countSentences = vi.fn();
const checkAnswersExist = vi.fn();

vi.mock('src/repository/client', () => ({
  sentenceHistoryRepository: {
    getRandomSentencesByTopicAndLevel: (...a: unknown[]) => getRandomSentences(...a),
    countSentencesByTopicAndLevel: (...a: unknown[]) => countSentences(...a)
  },
  userAnswerRepository: { checkAnswersExist: (...a: unknown[]) => checkAnswersExist(...a) }
}));

const { checkHistoryAvailabilityService, formatSentenceWithHints, getTrainingExercisesService } =
  await import('./trainingExercisesService');

const body = { topic: 'Present', languageId: 'lang-1', level: 'A1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  getRandomSentences.mockResolvedValue([{ id: 's1', sentence: 'Ona **czyta**.', hints: [] }]);
  checkAnswersExist.mockResolvedValue({ s1: false });
  countSentences.mockResolvedValue(3);
});

describe('formatSentenceWithHints', () => {
  it('appends a single hint in parentheses', () => {
    expect(formatSentenceWithHints('Ona **czyta**.', ['czytać'])).toBe('Ona **czyta**. (czytać)');
  });

  it('joins several hints with a comma', () => {
    expect(formatSentenceWithHints('Zdanie.', ['a', 'b'])).toBe('Zdanie. (a, b)');
  });

  it('leaves a sentence without hints untouched', () => {
    expect(formatSentenceWithHints('Zdanie.', [])).toBe('Zdanie.');
  });

  it('treats null hints as none', () => {
    expect(formatSentenceWithHints('Zdanie.', null)).toBe('Zdanie.');
  });

  it('round-trips into the shape the exercise parser expects', () => {
    expect(formatSentenceWithHints('Ona **czyta**.', ['czytać'])).toMatch(/\([^)]+\)$/);
  });
});

describe('getTrainingExercisesService', () => {
  it('rejects a body that fails validation', async () => {
    const response = await getTrainingExercisesService({ topic: 'Present' }, 'u1');
    expect(response.status).toBe(400);
  });

  it('rejects a limit above the maximum', async () => {
    const response = await getTrainingExercisesService({ ...body, limit: 21 }, 'u1');
    expect(response.status).toBe(400);
  });

  it('rejects a non-integer limit', async () => {
    const response = await getTrainingExercisesService({ ...body, limit: 2.5 }, 'u1');
    expect(response.status).toBe(400);
  });

  it('rejects a limit below the minimum', async () => {
    const response = await getTrainingExercisesService({ ...body, limit: 0 }, 'u1');
    expect(response.status).toBe(400);
  });

  it('reports every missing field, joined by a semicolon', async () => {
    const response = await getTrainingExercisesService({}, 'u1');
    const message = String((response.body as { error: string }).error);
    expect(message).toContain('topic');
    expect(message).toContain('languageId');
    expect(message).toContain('; ');
  });

  it('strips unknown keys rather than rejecting them', async () => {
    const response = await getTrainingExercisesService({ ...body, nonsense: 1 }, 'u1');
    expect(response.status).toBe(200);
  });

  it('excludes nothing when no current ids are given', async () => {
    await getTrainingExercisesService(body, 'u1');
    expect(getRandomSentences).toHaveBeenCalledWith(
      expect.objectContaining({ excludeSentenceIds: [] })
    );
  });

  it('looks up answers for exactly the sentences it returns', async () => {
    await getTrainingExercisesService(body, 'u1');
    expect(checkAnswersExist).toHaveBeenCalledWith({ userId: 'u1', sentenceIds: ['s1'] });
  });

  it('passes the topic and level through to the query', async () => {
    await getTrainingExercisesService(body, 'u1');
    expect(getRandomSentences).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'Present', level: 'A1', languageId: 'lang-1' })
    );
  });

  it('returns the sentences with their ids', async () => {
    const response = await getTrainingExercisesService(body, 'u1');
    expect(response).toMatchObject({
      status: 200,
      body: { success: true, data: ['Ona **czyta**.'], sentenceIds: ['s1'] }
    });
  });

  it('re-attaches stored hints to the sentence', async () => {
    getRandomSentences.mockResolvedValue([
      { id: 's1', sentence: 'Ona **czyta**.', hints: ['czytać'] }
    ]);
    const response = await getTrainingExercisesService(body, 'u1');
    expect(response.body).toMatchObject({ data: ['Ona **czyta**. (czytać)'] });
  });

  it('reports which sentences already have an answer', async () => {
    const response = await getTrainingExercisesService(body, 'u1');
    expect(response.body).toMatchObject({ hasAnswers: { s1: false } });
  });

  it('defaults the limit to five', async () => {
    await getTrainingExercisesService(body, 'u1');
    expect(getRandomSentences).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });

  it('honours an explicit limit', async () => {
    await getTrainingExercisesService({ ...body, limit: 3 }, 'u1');
    expect(getRandomSentences).toHaveBeenCalledWith(expect.objectContaining({ limit: 3 }));
  });

  it('excludes the sentences already on the page', async () => {
    await getTrainingExercisesService({ ...body, currentSentenceIds: ['s9'] }, 'u1');
    expect(getRandomSentences).toHaveBeenCalledWith(
      expect.objectContaining({ excludeSentenceIds: ['s9'] })
    );
  });

  it('scopes the query to the caller', async () => {
    await getTrainingExercisesService(body, 'u1');
    expect(getRandomSentences).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'u1' }));
  });

  it('returns 404 when history has nothing to offer', async () => {
    getRandomSentences.mockResolvedValue([]);
    const response = await getTrainingExercisesService(body, 'u1');
    expect(response).toEqual({
      status: 404,
      body: { error: 'No exercises found in history for this topic and level' }
    });
  });

  it('skips the answer lookup when there is nothing to look up', async () => {
    getRandomSentences.mockResolvedValue([]);
    await getTrainingExercisesService(body, 'u1');
    expect(checkAnswersExist).not.toHaveBeenCalled();
  });

  it('reports 500 when the repository fails', async () => {
    getRandomSentences.mockRejectedValue(new Error('db down'));
    const response = await getTrainingExercisesService(body, 'u1');
    expect(response).toEqual({ status: 500, body: { error: 'Internal server error' } });
  });
});

describe('checkHistoryAvailabilityService', () => {
  it('rejects a body that fails validation', async () => {
    const response = await checkHistoryAvailabilityService({ topic: 'Present' }, 'u1');
    expect(response.status).toBe(400);
  });

  it('reports every missing field, joined by a semicolon', async () => {
    const response = await checkHistoryAvailabilityService({}, 'u1');
    const message = String((response.body as { error: string }).error);
    expect(message).toContain('topic');
    expect(message).toContain('level');
    expect(message).toContain('; ');
  });

  it('excludes nothing when no current ids are given', async () => {
    await checkHistoryAvailabilityService(body, 'u1');
    expect(countSentences).toHaveBeenCalledWith(
      expect.objectContaining({ excludeSentenceIds: [] })
    );
  });

  it('passes the topic and level through to the count', async () => {
    await checkHistoryAvailabilityService(body, 'u1');
    expect(countSentences).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'Present', level: 'A1', languageId: 'lang-1' })
    );
  });

  it('reports availability with the count', async () => {
    const response = await checkHistoryAvailabilityService(body, 'u1');
    expect(response).toEqual({ status: 200, body: { success: true, available: true, count: 3 } });
  });

  it('reports unavailable when the count is zero', async () => {
    countSentences.mockResolvedValue(0);
    const response = await checkHistoryAvailabilityService(body, 'u1');
    expect(response.body).toMatchObject({ available: false, count: 0 });
  });

  it('excludes the sentences already on the page', async () => {
    await checkHistoryAvailabilityService({ ...body, currentSentenceIds: ['s9'] }, 'u1');
    expect(countSentences).toHaveBeenCalledWith(
      expect.objectContaining({ excludeSentenceIds: ['s9'], ownerId: 'u1' })
    );
  });

  it('ignores a limit, which this endpoint does not accept', async () => {
    const response = await checkHistoryAvailabilityService({ ...body, limit: 99 }, 'u1');
    expect(response.status).toBe(200);
  });

  it('reports 500 when the repository fails', async () => {
    countSentences.mockRejectedValue(new Error('db down'));
    const response = await checkHistoryAvailabilityService(body, 'u1');
    expect(response).toEqual({ status: 500, body: { error: 'Internal server error' } });
  });
});
