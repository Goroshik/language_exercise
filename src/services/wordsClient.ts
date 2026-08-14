/**
 * Browser-side calls behind the word import dialog.
 */
import { type ParsedWord, normaliseParsedWords } from 'src/utils/wordImport';

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/** Asks the AI to split free text into word/translation pairs. */
export async function parseWordsFromText(text: string): Promise<ParsedWord[]> {
  const response = await postJson('/api/ai/parse-words', { text });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.words || data.words.length === 0) {
    throw new Error('AI parsing returned no results');
  }

  return normaliseParsedWords(data.words);
}

/** True when the word is already in the user's dictionary. */
export async function isDuplicateWord(word: string): Promise<boolean> {
  const response = await postJson('/api/dictionary/words/check-duplicates', { words: [word] });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return Boolean(data.success && data.duplicates?.[0]);
}

export async function addWords(
  words: Array<{ word: string; translate: string }>
): Promise<unknown> {
  const response = await postJson('/api/dictionary/words', { words });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to add words');
  }

  return data.word;
}
