export const GRAMMAR_PROMPTS = {
  // For student mode - create exercises with blanks for students to fill (practice exercises)
  generateStudentExercises: (topic: string, languageName: string, selectedWords?: string[]) => `You are helping a Russian speaker learn ${languageName}. Generate 5 ${languageName} sentences for practicing the topic: "${topic}".

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}

IMPORTANT REQUIREMENTS:
1. Each sentence must be complete and grammatically correct
2. ONE key word should be highlighted with **word** - this word should be in the CORRECT grammatical form (NOT base form)
3. The highlighted word demonstrates the grammar topic being practiced
4. After the sentence, add a hint in parentheses ONLY if appropriate:
   - DO NOT add hints for articles (a/the)
   - DO NOT add "to be" for continuous tenses (the student should know the form)
   - DO add hints for verb infinitives, base noun forms, or other helpful context
   - Format: (hint text)

CRITICAL: Return ONLY the sentences, one per line. DO NOT include any introductory text, explanations, or headers.

Example output for topic "Past Simple":
They **visited** many countries last summer. (visit)
She **bought** a beautiful dress yesterday. (buy)

Example output for topic "Articles":
I need **a** new phone.
**The** sun is shining brightly.`,

  validateAnswers: (topic: string, answersText: string, languageName: string = 'the target language') => `You are helping a Russian speaker learn ${languageName}. Check these ${languageName} sentences for grammatical correctness. Topic: "${topic}".

${answersText}

For each sentence:
1. Check if it's grammatically correct
2. Check if Russian translations (if provided in the sentence) are accurate

Response format:
- If everything is correct: "CORRECT"
- If there are grammar errors: "ERROR: [explanation in Russian]"
- If there are incorrect translations: "TRANSLATION_ERRORS: word1 - правильный перевод, word2 - правильный перевод"

You can combine both errors if needed:
"ERROR: [grammar explanation] | TRANSLATION_ERRORS: word1 - правильный перевод"

Format your response as:
1. CORRECT
2. ERROR: объяснение ошибки
3. TRANSLATION_ERRORS: word - правильный перевод
etc.`,

  // For teacher mode - provide correct example sentences for learning/viewing
  generateTeacherExamples: (topic: string, level: string, languageName: string, selectedWords?: string[]) => `You are helping create ${languageName} learning materials for Russian speakers. Generate 10 complete ${languageName} sentences for students to learn the topic: "${topic}" at ${level} proficiency level.

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}

IMPORTANT REQUIREMENTS:
1. All sentences must be grammatically CORRECT (students will learn from these examples)
2. ONE key word should be highlighted with **word** - this word MUST be in the CORRECT grammatical form
3. The highlighted word demonstrates the grammar topic being practiced
4. DO NOT add any hints or base forms - these are for learning, not exercises

Level guidelines:
- A1: Simple present/past tense, basic vocabulary, simple sentence structures
- A2: Present/past continuous, basic future forms, everyday vocabulary
- B1: Present perfect, modal verbs, intermediate vocabulary
- B2: Complex tenses, passive voice, advanced vocabulary
- C1: Advanced grammar structures, sophisticated vocabulary
- C2: Native-like complexity, idiomatic expressions

CRITICAL: Return ONLY the sentences, one per line. DO NOT include any introductory text, explanations, or headers.

Example output for topic "Past Simple":
They **visited** many countries last summer.
She **bought** a beautiful dress yesterday.
I **studied** English for two hours.`
};
