export const GRAMMAR_PROMPTS = {
  generateExercises: (topic: string, selectedWords?: string[]) => `You are helping a Russian speaker learn English. Generate 5 English sentences for practicing the topic: "${topic}".

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}

Each sentence should have 1-2 words replaced with {{input}} placeholders where the student needs to fill in the correct English word form.

At the end of each sentence, add the missing words in brackets in their base form (infinitive for verbs, singular for nouns, positive form for adjectives).

Return ONLY the sentences, one per line, with {{input}} placeholders where words should be filled in and the base forms in brackets at the end.

Example format:
I {{input}} to school every day. (go)
She {{input}} a beautiful dress yesterday. (buy)`,

  generateMoreExercises: (topic: string, selectedWords?: string[]) => `You are helping a Russian speaker learn English. Generate 5 NEW English sentences for practicing the topic: "${topic}".

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}

Each sentence should have 1-2 words replaced with {{input}} placeholders where the student needs to fill in the correct English word form.

At the end of each sentence, add the missing words in brackets in their base form (infinitive for verbs, singular for nouns, positive form for adjectives).

Return ONLY the sentences, one per line, with {{input}} placeholders where words should be filled in and the base forms in brackets at the end.

Example format:
I {{input}} to school every day. (go)
She {{input}} a beautiful dress yesterday. (buy)`,

  validateAnswers: (topic: string, answersText: string) => `You are helping a Russian speaker learn English. Check these English sentences for grammatical correctness. Topic: "${topic}".

${answersText}

For each sentence, respond with either "CORRECT" if grammatically correct, or "ERROR: [explanation in Russian]" if there are mistakes.

Format your response as:
1. CORRECT
2. ERROR: объяснение ошибки
etc.`,

  generateTeacherSentences: (topic: string, level: string, selectedWords?: string[]) => `You are helping create English learning materials for Russian speakers. Generate 10 complete English sentences for a teacher to give to students for practicing the topic: "${topic}" at ${level} proficiency level.

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}

Each sentence should be complete and grammatically correct, but one word should be highlighted in bold (**word**) to indicate where the student needs to fill in the correct form.

Level guidelines:
- A1: Simple present/past tense, basic vocabulary, simple sentence structures
- A2: Present/past continuous, basic future forms, everyday vocabulary
- B1: Present perfect, modal verbs, intermediate vocabulary
- B2: Complex tenses, passive voice, advanced vocabulary
- C1: Advanced grammar structures, sophisticated vocabulary
- C2: Native-like complexity, idiomatic expressions

Return ONLY the sentences, one per line, with the target word in bold formatting (**word**).

Example format:
I **go** to school every day.
She **bought** a beautiful dress yesterday.`
};
