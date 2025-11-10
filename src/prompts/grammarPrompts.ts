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
    answersText: string,
    languageName: string = 'the target language'
  ) => `You are helping a Russian speaker learn ${languageName}. Check these ${languageName} sentences that a student has written as answers to exercises. Topic: "${topic}".

The student's answers:
${answersText}

For each sentence:
1. Check if it's grammatically correct in the context of the topic "${topic}"
2. Check if Russian translations (if provided in the sentence) are accurate
3. Provide helpful feedback if there are errors
4. Extract and list ALL words from the sentence in their BASE FORMS (infinitive for verbs, nominative singular for nouns, base form for adjectives)

Response format:
- If everything is correct: "CORRECT | WORDS: word1, word2, word3"
- If there are grammar errors: "ERROR: [clear explanation in Russian of what's wrong and how to fix it] | WORDS: word1, word2, word3"
- If there are incorrect translations: "TRANSLATION_ERRORS: word1 - правильный перевод, word2 - правильный перевод | WORDS: word1, word2, word3"

You can combine both types of errors if needed:
"ERROR: [grammar explanation] | TRANSLATION_ERRORS: word1 - правильный перевод | WORDS: word1, word2, word3"

IMPORTANT:
- Number your responses (1., 2., 3., etc.) to match the sentence numbers
- Be specific about the error and how to correct it
- Consider the topic context when evaluating correctness
- If a sentence has multiple errors, mention all of them
- Check translations carefully - students may include Russian words/phrases in their answers
- ALWAYS include "WORDS:" section with all words from the sentence in their base forms (separated by commas)
- For base forms: use infinitive for verbs (e.g., "go" not "went"), nominative for nouns, base form for adjectives
- Include common words like articles (a, the), pronouns (I, you, he), prepositions (in, on, at) in the WORDS list

Format your response as:
1. CORRECT | WORDS: go, to, store
2. ERROR: объяснение ошибки и как её исправить | WORDS: visit, many, country, last, summer
3. TRANSLATION_ERRORS: word - правильный перевод | WORDS: word1, word2
4. ERROR: грамматическая ошибка | TRANSLATION_ERRORS: word - перевод | WORDS: word1, word2
etc.`,

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
