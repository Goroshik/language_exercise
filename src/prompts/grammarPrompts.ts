export const GRAMMAR_PROMPTS = {
  // For student mode - create exercises with blanks for students to fill (practice exercises)
  generateStudentExercises: (
    topic: string,
    languageName: string,
    selectedWords?: string[],
    customTopic?: string,
    sentenceCount?: number
  ) => {
    const count = sentenceCount || 5;
    const topicContext = customTopic ? `\n\nAdditional Context: ${customTopic}\nGenerate sentences related to this context/situation while practicing the grammar topic.` : '';
    
    return `You are helping a Russian speaker learn ${languageName}. Generate ${count} ${languageName} sentences for practicing the topic: "${topic}".

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}${topicContext}

IMPORTANT REQUIREMENTS:
1. Each sentence must be complete and grammatically correct
2. ONE key word should be highlighted with **word** - this word should be in the CORRECT grammatical form (NOT base form)
3. The highlighted word demonstrates the grammar topic being practiced
4. CRITICAL FORMATTING: The word MUST be wrapped EXACTLY like this: **word** 
   - Opening **: BEFORE the entire word
   - Closing **: AFTER the entire word
   - WRONG: **Książ**ka** or Książ**ka** or **wor**d**
   - CORRECT: **Książka** or **word**
5. MANDATORY: Add a hint in parentheses after EVERY sentence where the highlighted word is NOT an article/wh-word/pronoun/preposition:
   - For ALL verbs: add the infinitive + any important context words (adverbs, negations) from the sentence
   - For complex verb forms (have been, has done, will go): highlight the ENTIRE verb form including auxiliaries
   - For nouns with case changes: add the nominative singular form
   - For adjectives with declension: add the base form
   - ONLY skip hints for: articles (a/the), wh-words (who/what/where), pronouns, prepositions
   - Include context words in hints: adverbs (never, always, often), negations (not), and other key words near the verb
   - Format: (word1, word2, infinitive) - parentheses are REQUIRED, separate multiple hints with commas

CRITICAL: 
- Return ONLY the sentences, one per line
- DO NOT include any introductory text, explanations, or headers
- EVERY sentence with a verb/noun/adjective MUST have a hint in parentheses

Example output for topic "Past Simple":
They **visited** many countries last summer. (visit)
She **bought** a beautiful dress yesterday. (buy)
He **went** to the store. (go)

Example output for topic "Present Perfect":
I **have been** to Paris three times. (be)
She **has eaten** sushi before. (never, eat)
They **have finished** their homework. (already, finish)

Example output for topic "Articles":
I need **a** new phone.
**The** sun is shining brightly.

Example output for Polish questions (wh-words):
**Kto** przyszedł wczoraj?
**Co** czytasz?
**Gdzie** mieszkasz?

Example output for Polish cases:
Widzę **kota** na ulicy. (kot)
Idę do **sklepu** po zakupy. (sklep)
**Dziewczyna** czyta książkę. (dziewczyna)`;
  },

  validateAnswers: (
    topic: string,
    exercisesJson: string,
    languageName: string = 'the target language'
  ) => `You are helping a Russian speaker learn ${languageName}. Check these ${languageName} sentences that a student has written as answers to exercises. Topic: "${topic}".

The student's answers (as JSON array):
${exercisesJson}

For each exercise:
1. Check if it's grammatically correct in the context of the topic "${topic}"
2. Check if Russian translations (if provided in the sentence) are accurate
3. Provide helpful feedback if there are errors

CRITICAL: You MUST respond with a valid JSON array. Each element must include the "id" from the input and validation results.

Response format (JSON array):
[
  {
    "id": "exercise_id_from_input",
    "isCorrect": true
  },
  {
    "id": "exercise_id_from_input",
    "isCorrect": false,
    "grammarError": "объяснение ошибки и как её исправить"
  },
  {
    "id": "exercise_id_from_input", 
    "isCorrect": false,
    "translationErrors": ["word1 - правильный перевод", "word2 - правильный перевод"]
  },
  {
    "id": "exercise_id_from_input",
    "isCorrect": false,
    "grammarError": "грамматическая ошибка",
    "translationErrors": ["word - перевод"]
  }
]

IMPORTANT:
- Return ONLY valid JSON, no additional text or explanations
- Every result object MUST include the "id" field matching the input
- The "id" field is critical for matching answers to exercises
- If a sentence is empty, mark it with "isCorrect": true and "skipped": true
- Be specific about errors and how to correct them
- Consider the topic context when evaluating correctness
- Check translations carefully - students may include Russian words/phrases in their answers`,

  // For teacher mode - provide correct example sentences for learning/viewing
  generateTeacherExamples: (
    topic: string,
    level: string,
    languageName: string,
    selectedWords?: string[],
    customTopic?: string,
    sentenceCount?: number
  ) => {
    const count = sentenceCount || 10;
    const topicContext = customTopic ? `\n\nAdditional Context: ${customTopic}\nGenerate sentences related to this context/situation while demonstrating the grammar topic.` : '';
    
    return `You are helping create ${languageName} learning materials for Russian speakers. Generate ${count} complete ${languageName} sentences for students to learn the topic: "${topic}" at ${level} proficiency level.

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}${topicContext}

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
I **studied** English for two hours.`;
  }
};
