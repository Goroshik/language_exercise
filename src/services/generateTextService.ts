import Joi from 'joi';
import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import {
  languageRepository,
  sentenceHistoryRepository,
  userAnswerRepository,
  wordRepository
} from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { DictionaryWord } from 'src/types';
import { extractResponseText, isMissingTokenError } from 'src/utils/aiResponse';

export type Mode = 'student' | 'teacher' | string;

export interface GenerateTextRequest {
  mode: Mode;
  topic: string;
  languageId: string;
  level: string;
  selectedWords?: DictionaryWord[] | undefined;
  customTopic?: string | undefined;
  sentenceCount?: number | undefined;
}

export type ServiceResponse = { status: number; body: unknown };

const BOLD_WORD_PATTERN = /\*\*(.*?)\*\*/g;
const TRAILING_HINTS_PATTERN = /\s*\(([^)]+)\)\s*$/;

interface SentenceContext {
  ownerId: string;
  languageId: string;
  level: string;
  mode: Mode;
  topic: string;
}

/** Lower-cased word -> dictionary word id, skipping entries without a word. */
export function buildWordIdIndex(words: DictionaryWord[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of words) {
    if (entry.word) {
      index.set(entry.word.toLowerCase(), entry.id);
    }
  }
  return index;
}

/** Hints are written as "(hint1, hint2)" at the very end of a sentence. */
export function extractHints(sentence: string): string[] {
  return (
    sentence
      .match(TRAILING_HINTS_PATTERN)?.[1]
      ?.split(/[,;]+/)
      .map(hint => hint.trim())
      .filter(Boolean) ?? []
  );
}

/** Ids of the dictionary words the sentence marked up with **bold**. */
export function collectUsedWordIds(sentence: string, wordIds: Map<string, string>): string[] {
  const used = new Set<string>();
  for (const match of sentence.matchAll(BOLD_WORD_PATTERN)) {
    const wordId = wordIds.get((match[1] ?? '').toLowerCase());
    if (wordId !== undefined) {
      used.add(wordId);
    }
  }
  return Array.from(used);
}

export function buildSentenceRecords(
  sentences: string[],
  wordIds: Map<string, string>,
  context: SentenceContext
) {
  return sentences.map(sentence => ({
    ...context,
    sentence: sentence.replace(TRAILING_HINTS_PATTERN, '').trim(),
    usedWordIds: collectUsedWordIds(sentence, wordIds),
    hints: extractHints(sentence)
  }));
}

const schema = Joi.object({
  mode: Joi.string().required(),
  topic: Joi.string().required(),
  languageId: Joi.string().required(),
  level: Joi.string().required(),
  selectedWords: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().allow(null),
        word: Joi.string().allow('', null)
      })
    )
    .optional(),
  customTopic: Joi.string().allow('', null).optional(),
  sentenceCount: Joi.number().min(1).max(20).optional()
});

export function formatAIResponse(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove numbering from start: "1. ", "2) ", "- ", "* " etc.
      // But preserve ** for markdown bold formatting
      return line.replace(/^(?:[\d]+[).\s]+|[-*]\s+)/, '');
    })
    .map(line => {
      // Simplified approach: Find everything between ** and **
      // First, normalize multiple asterisks (3+) to double asterisks
      line = line.replace(/\*{3,}/g, '**');

      // Check if line already has valid **word** format
      const boldPattern = /\*\*([^*]+)\*\*/g;
      if (boldPattern.test(line)) {
        // Already has valid format, return as is
        return line;
      }

      // Fix simple case: word** -> **word**
      line = line.replace(/([^\s*]+)\*\*/g, '**$1**');

      return line;
    });
}

export const TARGET_WORD_COUNT = 5;

/**
 * Tops the user's selection up to `TARGET_WORD_COUNT` with candidates they have
 * not already picked. Never returns more than the target.
 */
export function mergeAdditionalWords(
  selected: DictionaryWord[],
  candidates: DictionaryWord[]
): DictionaryWord[] {
  const needed = TARGET_WORD_COUNT - selected.length;
  if (needed <= 0) return selected;

  const alreadyPicked = new Set(selected.map(word => word.id));
  const additional = candidates.filter(word => !alreadyPicked.has(word.id)).slice(0, needed);

  return [...selected, ...additional];
}

/** Auto-fills the word list; a repository failure leaves the selection as-is. */
async function selectWords(
  userId: string,
  languageCode: string,
  selected: DictionaryWord[]
): Promise<DictionaryWord[]> {
  if (selected.length >= TARGET_WORD_COUNT) return selected;

  try {
    const candidates = await wordRepository.getLeastUsedWords(
      userId,
      languageCode,
      // Ask for extra: some of them may already be in the selection.
      TARGET_WORD_COUNT + selected.length
    );
    return mergeAdditionalWords(selected, candidates as DictionaryWord[]);
  } catch (err) {
    console.error('Failed to auto-select words:', err);
    return selected;
  }
}

function buildPrompt(body: GenerateTextRequest, languageName: string, words: string[]): string {
  const { mode, topic, level, customTopic, sentenceCount } = body;
  const options = { topic, languageName, selectedWords: words, customTopic, sentenceCount };

  return mode === 'student'
    ? GRAMMAR_PROMPTS.generateStudentExercises(options)
    : GRAMMAR_PROMPTS.generateTeacherExamples({ ...options, level });
}

async function requestGeneration(
  userId: string,
  prompt: string
): Promise<{ text: string } | { failure: ServiceResponse }> {
  const aiService = await AIFactory.getAIService(userId);
  if (!aiService || typeof aiService.generateText !== 'function') {
    return { failure: { status: 502, body: { error: 'AI service not available for user' } } };
  }

  try {
    return { text: extractResponseText(await aiService.generateText(prompt, userId)) };
  } catch (err) {
    if (isMissingTokenError(err)) {
      return {
        failure: { status: 402, body: { error: 'AI service token not configured for user' } }
      };
    }
    console.error('AI service error (generate text):', err);
    const error = err instanceof Error ? err.message : 'Failed to generate text from AI service';
    return { failure: { status: 502, body: { error } } };
  }
}

/** History is a nice-to-have: a save failure must not fail the request. */
async function persistHistory(
  sentences: string[],
  words: DictionaryWord[],
  context: SentenceContext
): Promise<string[]> {
  if (sentences.length === 0) return [];

  try {
    const records = buildSentenceRecords(sentences, buildWordIdIndex(words), context);
    const saved = await sentenceHistoryRepository.addHistoryBatch(records);
    return saved.map(s => s.id);
  } catch (saveErr) {
    console.error('Failed to save generated sentence history:', saveErr);
    return [];
  }
}

export async function processGenerateTextRequest(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const { error, value } = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = (error.details || []).map(detail => String(detail.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const body = value as GenerateTextRequest;
    const language = await languageRepository.findById(body.languageId);
    if (!language) {
      return { status: 400, body: { error: 'Invalid language ID' } };
    }

    const words = await selectWords(userId, language.code, body.selectedWords ?? []);
    const prompt = buildPrompt(
      body,
      language.name,
      words.map(w => w.word || '')
    );

    const generation = await requestGeneration(userId, prompt);
    if ('failure' in generation) return generation.failure;

    const data = formatAIResponse(generation.text);
    const sentenceIds = await persistHistory(data, words, {
      ownerId: userId,
      languageId: body.languageId,
      level: body.level,
      mode: body.mode,
      topic: body.topic
    });

    const hasAnswers =
      sentenceIds.length > 0
        ? await userAnswerRepository.checkAnswersExist({ userId, sentenceIds })
        : {};

    return { status: 200, body: { success: true, data, sentenceIds, hasAnswers } };
  } catch (err) {
    console.error('Unexpected error in generateText service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
