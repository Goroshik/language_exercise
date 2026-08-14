export const ESSAY_PROMPTS = {
  /**
   * Check essay for grammar, punctuation, and complexity
   * Returns structured feedback with color-coded errors
   */
  checkEssay: (
    essayText: string,
    languageName: string
  ) => `You are helping a Russian speaker improve their ${languageName} writing. Analyze the following ${languageName} essay for:
1. Grammar errors
2. Punctuation errors
3. Text complexity
4. CEFR level (A1, A2, B1, B2, C1, C2)

Essay text:
${essayText}

IMPORTANT: Return ONLY valid JSON in the following format:
{
  "level": "B1",
  "errors": [
    {
      "text": "the exact text fragment with error",
      "explanation": "Объяснение ошибки на русском языке",
      "color": "#FFE5E5",
      "type": "grammar"
    }
  ],
  "summary": "Краткая общая оценка текста на русском языке"
}

Requirements:
1. "level" - detected CEFR level (A1, A2, B1, B2, C1, or C2)
2. "errors" - array of all errors found:
   - "text" - EXACT text fragment from the essay that contains the error
   - "explanation" - clear explanation in Russian of what's wrong and how to fix it
   - "color" - soft semi-transparent hex color for highlighting (use soft pastel colors like #FFE5E5 for grammar, #FFF4E5 for punctuation, #E5F4FF for style suggestions)
   - "type" - one of: "grammar", "punctuation", "style", "vocabulary"
3. "summary" - brief overall assessment in Russian (2-3 sentences about text quality, strengths, and areas for improvement)

Rules:
- Use EXACT text fragments from the essay in "text" field
- Each error should have a unique soft color (don't reuse colors for different errors)
- Keep explanations concise but helpful
- If no errors found, return empty errors array
- Return ONLY the JSON object, no additional text or markdown formatting
`
};
