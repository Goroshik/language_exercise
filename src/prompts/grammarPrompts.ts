export interface ExercisePromptOptions {
  topic: string;
  languageName: string;
  level?: string | undefined;
  selectedWords?: string[] | undefined;
  customTopic?: string | undefined;
  sentenceCount?: number | undefined;
}

export const GRAMMAR_PROMPTS = {
  // For student mode - create exercises with blanks for students to fill (practice exercises)
  generateStudentExercises: ({
    topic,
    languageName,
    selectedWords,
    customTopic,
    sentenceCount
  }: ExercisePromptOptions) => {
    const count = sentenceCount || 5;
    const topicContext = customTopic
      ? `\n\nAdditional Context: ${customTopic}\nGenerate sentences related to this context/situation while practicing the grammar topic.`
      : '';

    return `You are helping a Russian speaker learn ${languageName}. Generate ${count} ${languageName} sentences for practicing the topic: "${topic}".

${selectedWords && selectedWords.length > 0 ? `Focus on using these specific words/phrases: ${selectedWords.join(', ')}.` : ''}${topicContext}

IMPORTANT REQUIREMENTS:
1. Each sentence must be complete and grammatically correct
2. ONE key word/phrase should be highlighted with **word** - this should include ALL words the student needs to write
3. The highlighted text demonstrates the grammar topic being practiced
4. CRITICAL FORMATTING: The word/phrase MUST be wrapped EXACTLY like this: **word** or **multiple words**
   - Opening **: BEFORE the entire word/phrase
   - Closing **: AFTER the entire word/phrase
   - WRONG: **Książ**ka** or Książ**ka** or **wor**d**
   - CORRECT: **Książka** or **word** or **has never eaten**
5. MANDATORY: Add a hint in parentheses after EVERY sentence where the highlighted word is NOT an article/wh-word/pronoun/preposition:
   - Hints should contain BASE FORMS of words from the highlighted text
   - For verbs: include the infinitive form (without "to") + any adverbs/negations that are INSIDE the highlighted text
   - Auxiliary verbs (is, has, have, will, would, etc.) can be included in base form or omitted if obvious
   - For multi-word phrases: include all significant words from the phrase in their base forms
   - DO NOT include words that are OUTSIDE the ** markers in the hint
   - ONLY include words that appear INSIDE the ** markers
   - Format: (word1, word2, infinitive) - parentheses are REQUIRED, separate multiple words with commas

CRITICAL: 
- Return ONLY the sentences, one per line
- DO NOT include any introductory text, explanations, or headers
- EVERY sentence with a verb/noun/adjective MUST have a hint in parentheses

Example output for topic "Past Simple":
They **visited** many countries last summer. (visit)
She **bought** a beautiful dress yesterday. (buy)
He **went** to the store. (go)

Example output for topic "Present Perfect":
She **has never eaten** sushi before. (never, eat)
They **have already finished** their homework. (already, finish)

Example output for multi-word phrases:
After the divorce, she needed **a fresh start** to move on. (a fresh start)
The project is **in progress** and will be done soon. (in progress)
They made **a lot of mistakes** during the exam. (a lot of mistakes)

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
  ) => `Pomagasz rosyjskojęzycznemu użytkownikowi uczyć się ${languageName}. Sprawdź te zdania w języku ${languageName}, które uczeń napisał jako odpowiedzi do ćwiczeń. Temat: "${topic}".

Odpowiedzi ucznia (jako tablica JSON):
${exercisesJson}

Dla każdego ćwiczenia:
1. Sprawdź, czy jest poprawne gramatycznie w kontekście tematu "${topic}"
2. Sprawdź, czy rosyjskie tłumaczenia (jeśli są podane w zdaniu) są dokładne
3. Podaj pomocną informację zwrotną, jeśli są błędy

KRYTYCZNE: MUSISZ odpowiedzieć poprawną tablicą JSON. Każdy element musi zawierać "id" z danych wejściowych i wyniki walidacji.

Format odpowiedzi (tablica JSON):
[
  {
    "id": "exercise_id_from_input",
    "isCorrect": true
  },
  {
    "id": "exercise_id_from_input",
    "isCorrect": false,
    "grammarError": "объяснение ошибки и как её исправить (НА РУССКОМ ЯЗЫКЕ)"
  },
  {
    "id": "exercise_id_from_input", 
    "isCorrect": false,
    "translationErrors": ["oryginalneSłowo1 - правильный перевод НА РУССКОМ", "oryginalneSłowo2 - правильный перевод НА РУССКОМ"]
  },
  {
    "id": "exercise_id_from_input",
    "isCorrect": false,
    "grammarError": "грамматическая ошибка (НА РУССКОМ ЯЗЫКЕ)",
    "translationErrors": ["oryginalneSłowo - правильный перевод НА РУССКОМ"]
  }
]

WAŻNE:
- Zwróć TYLKO poprawny JSON, bez dodatkowego tekstu ani wyjaśnień
- Każdy obiekt wyniku MUSI zawierać pole "id" pasujące do danych wejściowych
- Pole "id" jest kluczowe dla dopasowania odpowiedzi do ćwiczeń
- Jeśli zdanie jest puste, oznacz je "isCorrect": true i "skipped": true
- Bądź konkretny w kwestii błędów i sposobu ich poprawy
- Uwzględnij kontekst tematu przy ocenie poprawności
- WSZYSTKIE komunikaty błędów (grammarError) MUSZĄ być napisane PO ROSYJSKU
- WSZYSTKIE tłumaczenia (translationErrors) MUSZĄ być podane PO ROSYJSKU
- Sprawdzając tłumaczenia, użyj DOKŁADNEJ formy słowa ze zdania ucznia w translationErrors
- Format dla translationErrors: ["oryginalneSłowo - правильный перевод НА РУССКОМ"] gdzie oryginalneSłowo to dokładne słowo napisane przez ucznia
- Przykład: Jeśli uczeń napisał "Potrzebuję pięciu jabłek" → translationErrors: ["Potrzebuję - Мне нужно", "pięciu - пять", "jabłek - яблок"]`,

  // For teacher mode - provide correct example sentences for learning/viewing
  generateTeacherExamples: ({
    topic,
    level,
    languageName,
    selectedWords,
    customTopic,
    sentenceCount
  }: ExercisePromptOptions) => {
    const count = sentenceCount || 10;
    const topicContext = customTopic
      ? `\n\nAdditional Context: ${customTopic}\nGenerate sentences related to this context/situation while demonstrating the grammar topic.`
      : '';

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
