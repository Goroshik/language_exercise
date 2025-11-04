# Quick Fix Guide - Exercise Validation Issues

## 🚨 Critical Bug Fix Required

The answer validation in student mode is **completely broken**. This guide shows exactly what to fix.

## Issue #1: Fix textarea handling in handleCheckAnswers

**File:** `src/store/appStore.ts` (lines 188-198)

**Find this code:**

```typescript
const answersText = block.exercises
  .map((exercise, index) => {
    const inputRegex = /\{\{input\}\}/g;
    let inputCounter = 0;
    const filledSentence = exercise.sentence.replace(inputRegex, () => {
      const inputId = `input_${blockId}_${index}_${inputCounter++}`;
      return userAnswers[inputId] || '___';
    });
    return `${index + 1}. ${filledSentence}`;
  })
  .join('\n');
```

**Replace with:**

```typescript
const answersText = block.exercises
  .map((exercise, index) => {
    const textareaId = `textarea_${blockId}_${index}`;
    const userAnswer = userAnswers[textareaId];

    // Send only filled answers
    if (userAnswer && userAnswer.trim()) {
      return `${index + 1}. ${userAnswer.trim()}`;
    }
    return null;
  })
  .filter(Boolean)
  .join('\n');

// Check that at least one answer is filled
if (!answersText.trim()) {
  showAlert.warning('Пожалуйста, заполните хотя бы одно упражнение');
  set(state => ({
    exerciseBlocks: state.exerciseBlocks.map(block =>
      block.id === blockId ? { ...block, isChecking: false } : block
    )
  }));
  return;
}
```

---

## Issue #2: Fix validation results storage

**File:** `src/store/appStore.ts` (lines 203-220)

**Find this code:**

```typescript
const results: { [key: string]: { isCorrect: boolean; error?: string } } = {};

data.forEach((line: string, index: number) => {
  const isCorrect = line.includes('CORRECT');
  let errorMessage: string | undefined;

  if (!isCorrect && line.includes('ERROR:')) {
    errorMessage = line.replace(/^\d+\.\s*ERROR:\s*/, '').trim();
  }

  let inputCounter = 0;

  block.exercises[index]?.sentence.replace(/\{\{input\}\}/g, () => {
    const inputId = `input_${blockId}_${index}_${inputCounter++}`;
    results[inputId] = { isCorrect, error: errorMessage };
    return '';
  });
});
```

**Replace with:**

```typescript
const results: {
  [key: string]: {
    isCorrect: boolean;
    error?: string;
    incorrectTranslations?: string[];
  };
} = {};

data.forEach((line: string, index: number) => {
  const textareaId = `textarea_${blockId}_${index}`;

  // Skip if this textarea wasn't in userAnswers (not filled)
  if (!userAnswers[textareaId]) {
    return;
  }

  const isCorrect = line.includes('CORRECT');
  let errorMessage: string | undefined;
  let incorrectTranslations: string[] | undefined;

  if (!isCorrect) {
    // Handle grammar errors
    if (line.includes('ERROR:')) {
      const errorPart = line.split('|')[0];
      errorMessage = errorPart.replace(/^\d+\.\s*ERROR:\s*/, '').trim();
    }

    // Handle translation errors
    if (line.includes('TRANSLATION_ERRORS:')) {
      const translationPart = line.includes('|')
        ? line.split('|')[1].split('TRANSLATION_ERRORS:')[1]
        : line.split('TRANSLATION_ERRORS:')[1];

      incorrectTranslations = translationPart
        ?.split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }

  results[textareaId] = {
    isCorrect,
    error: errorMessage,
    incorrectTranslations
  };
});
```

---

## Issue #3: Use correct API endpoint

**File:** `src/store/appStore.ts` (lines 200-201)

**Find this code:**

```typescript
const validatePrompt = GRAMMAR_PROMPTS.validateAnswers(selectedTopic, answersText);
const data = await ApiService.generateText({ prompt: validatePrompt });
```

**Replace with:**

```typescript
// Get language for API call (you'll need to pass languageId to this function)
const language = await languageRepository.findById(languageId);
const languageName = language?.name || 'English';

const data = await ApiService.checkAnswers({
  topic: selectedTopic,
  answersText: answersText,
  languageName: languageName
});
```

---

## Issue #4: Update function signature

**File:** `src/store/appStore.ts`

**Find this:**

```typescript
handleCheckAnswers: async (blockId: string, userAnswers: { [key: string]: string }) => {
```

**Replace with:**

```typescript
handleCheckAnswers: async (
  blockId: string,
  userAnswers: { [key: string]: string },
  languageId: string
) => {
```

---

## Issue #5: Update component to pass languageId

**File:** `src/app/(main)/exercises/[path]/page.tsx` (around line 212)

**Find this:**

```typescript
<ExerciseBlock
  key={block.id}
  block={block}
  blockIndex={blockIndex}
  validationResults={validationResults[block.id] || {}}
  onCheckAnswers={handleCheckAnswers}
  mode={selectedMode}
/>
```

**Replace with:**

```typescript
<ExerciseBlock
  key={block.id}
  block={block}
  blockIndex={blockIndex}
  validationResults={validationResults[block.id] || {}}
  onCheckAnswers={(blockId, userAnswers) =>
    handleCheckAnswers(blockId, userAnswers, selectedLanguageId)
  }
  mode={selectedMode}
/>
```

---

## Issue #6: Add validation in ExerciseBlock

**File:** `src/app/(main)/exercises/[path]/ExerciseBlock.tsx`

**Find this:**

```typescript
const handleCheckAnswers = () => {
  // Collect textarea values instead of individual inputs
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
  const userAnswers: { [key: string]: string } = {};
  textareas.forEach(textarea => {
    userAnswers[textarea.id] = (textarea as HTMLTextAreaElement).value;
  });
  onCheckAnswers(block.id, userAnswers);
};
```

**Replace with:**

```typescript
const handleCheckAnswers = () => {
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);

  // Check if at least one answer is filled
  const hasAnyFilledAnswer = Array.from(textareas).some(
    textarea => (textarea as HTMLTextAreaElement).value.trim().length > 0
  );

  if (!hasAnyFilledAnswer) {
    showAlert.warning('Пожалуйста, заполните хотя бы одно упражнение перед проверкой');
    return;
  }

  // Collect only filled answers
  const userAnswers: { [key: string]: string } = {};
  textareas.forEach(textarea => {
    const value = (textarea as HTMLTextAreaElement).value;
    if (value.trim()) {
      userAnswers[textarea.id] = value;
    }
  });

  onCheckAnswers(block.id, userAnswers);
};
```

---

## Issue #7: Add import for repository

**File:** `src/store/appStore.ts` (at the top)

**Add this import:**

```typescript
import { languageRepository } from 'src/repository/client';
```

---

## Testing After Fix

1. Start the app: `npm run dev`
2. Navigate to any topic (e.g., `/exercises/Past_Simple`)
3. Select "Студент" mode
4. Click "Создать упражнения"
5. Fill at least one exercise in the textarea
6. Click "Проверить блок #1"
7. **Expected:** Green border if correct, red border with error message if incorrect

## Verification Checklist

After applying all fixes, verify:

- [ ] Clicking "Проверить" without filling shows warning
- [ ] Filling one exercise and clicking "Проверить" sends request
- [ ] Console shows no errors about missing IDs
- [ ] Correct answers show green border
- [ ] Incorrect answers show red border + error message
- [ ] Translation errors show as separate list
- [ ] Only filled exercises are sent to API

## Time Estimate

**Total fix time:** 30-45 minutes for an experienced developer

## Need Help?

See full documentation in:

- `EXERCISES_DOCUMENTATION.md` - Complete architecture and flow
- `EXERCISES_TODO.md` - Detailed explanation of all issues
- `EXERCISES_SUMMARY_RU.md` - Russian summary

---

**Last updated:** 2025-10-24
