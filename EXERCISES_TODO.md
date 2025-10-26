# TODO List - Исправления функционала упражнений

## Критические ошибки / Critical Issues

### 1. ❌ КРИТИЧНО: Исправить обработку textarea в проверке ответов
**Файл:** `src/store/appStore.ts` → функция `handleCheckAnswers()`

**Проблема:**
Текущая реализация пытается обработать несуществующий формат `{{input}}` и ищет неправильные ID полей ввода. В режиме студента используется формат `**word**` и textarea с ID вида `textarea_${blockId}_${index}`, а не индивидуальные инпуты.

**Текущий код (неправильный):**
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

**Правильная реализация:**
```typescript
const answersText = block.exercises
  .map((exercise, index) => {
    const textareaId = `textarea_${blockId}_${index}`;
    const userAnswer = userAnswers[textareaId];
    
    // Отправляем только заполненные ответы
    if (userAnswer && userAnswer.trim()) {
      return `${index + 1}. ${userAnswer.trim()}`;
    }
    return null;
  })
  .filter(Boolean)
  .join('\n');

// Проверка, что есть хотя бы один заполненный ответ
if (!answersText.trim()) {
  showAlert.warning('Пожалуйста, заполните хотя бы одно упражнение');
  return;
}
```

---

### 2. ❌ КРИТИЧНО: Исправить сохранение результатов проверки
**Файл:** `src/store/appStore.ts` → функция `handleCheckAnswers()`

**Проблема:**
Результаты проверки сохраняются для несуществующих `input_*` ID вместо реальных `textarea_*` ID. Также не обрабатываются ошибки перевода (`TRANSLATION_ERRORS`).

**Текущий код (неправильный):**
```typescript
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

**Правильная реализация:**
```typescript
data.forEach((line: string, index: number) => {
  const textareaId = `textarea_${blockId}_${index}`;
  
  // Пропускаем, если этого textarea не было в userAnswers (не заполнено)
  if (!userAnswers[textareaId]) {
    return;
  }
  
  const isCorrect = line.includes('CORRECT');
  let errorMessage: string | undefined;
  let incorrectTranslations: string[] | undefined;

  if (!isCorrect) {
    // Обработка грамматических ошибок
    if (line.includes('ERROR:')) {
      const errorPart = line.split('|')[0];
      errorMessage = errorPart.replace(/^\d+\.\s*ERROR:\s*/, '').trim();
    }
    
    // Обработка ошибок перевода
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

### 3. ❌ КРИТИЧНО: Использовать правильный API endpoint для проверки
**Файл:** `src/store/appStore.ts` → функция `handleCheckAnswers()`

**Проблема:**
Используется `ApiService.generateText()` вместо `ApiService.checkAnswers()`, что обходит специализированный endpoint `/api/ai/check-answers`.

**Текущий код (неправильный):**
```typescript
const validatePrompt = GRAMMAR_PROMPTS.validateAnswers(selectedTopic, answersText);
const data = await ApiService.generateText({ prompt: validatePrompt });
```

**Правильная реализация:**
```typescript
// Получить язык для передачи в API
const language = await languageRepository.findById(languageId);
const languageName = language?.name || 'English';

const data = await ApiService.checkAnswers({
  topic: selectedTopic,
  answersText: answersText,
  languageName: languageName
});
```

**Дополнительно:** Нужно передавать `languageId` в `handleCheckAnswers()` из компонента `page.tsx`.

---

## Улучшения функционала / Feature Improvements

### 4. ⚠️ Добавить валидацию заполненных ответов перед проверкой
**Файл:** `src/app/(main)/exercises/[path]/ExerciseBlock.tsx` → функция `handleCheckAnswers()`

**Проблема:**
Кнопка "Проверить" не проверяет, есть ли хотя бы одно заполненное упражнение. Пользователь может отправить пустую форму.

**Добавить:**
```typescript
const handleCheckAnswers = () => {
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
  
  // Проверка на наличие заполненных ответов
  const hasAnyFilledAnswer = Array.from(textareas).some(
    textarea => (textarea as HTMLTextAreaElement).value.trim().length > 0
  );
  
  if (!hasAnyFilledAnswer) {
    showAlert.warning('Пожалуйста, заполните хотя бы одно упражнение перед проверкой');
    return;
  }
  
  const userAnswers: { [key: string]: string } = {};
  textareas.forEach(textarea => {
    const value = (textarea as HTMLTextAreaElement).value;
    if (value.trim()) {  // Собираем только заполненные
      userAnswers[textarea.id] = value;
    }
  });
  
  onCheckAnswers(block.id, userAnswers);
};
```

---

### 5. ⚠️ Улучшить промпт для проверки ответов с переводами
**Файл:** `src/prompts/grammarPrompts.ts` → функция `validateAnswers()`

**Проблема:**
Промпт не указывает явно, в каком формате пользователь может добавить перевод. Нужно уточнить ожидаемый формат.

**Улучшенный промпт:**
```typescript
validateAnswers: (
  topic: string,
  answersText: string,
  languageName: string = 'the target language'
) => `You are helping a Russian speaker learn ${languageName}. Check these ${languageName} sentences for grammatical correctness. Topic: "${topic}".

${answersText}

IMPORTANT NOTES:
- Each sentence may optionally include a Russian translation in a new line starting with "Перевод:" or "Translation:"
- Check BOTH grammar and translation accuracy (if translation is provided)

For each sentence:
1. Check if it's grammatically correct
2. Check if Russian translations (if provided) are accurate

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
etc.

Example answer format to check:
1. They visited many countries last summer.
   Перевод: Они посетили много стран прошлым летом.

2. She goes to school everyday.

Return one line per sentence in the format shown above.`,
```

---

### 6. ⚠️ Добавить счетчик заполненных упражнений
**Файл:** `src/app/(main)/exercises/[path]/ExerciseBlock.tsx`

**Улучшение:**
Показывать пользователю, сколько упражнений заполнено перед проверкой.

**Добавить:**
```typescript
const [filledCount, setFilledCount] = React.useState(0);

React.useEffect(() => {
  // Обновлять счетчик при изменении textarea
  const updateFilledCount = () => {
    const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
    const count = Array.from(textareas).filter(
      textarea => (textarea as HTMLTextAreaElement).value.trim().length > 0
    ).length;
    setFilledCount(count);
  };

  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
  textareas.forEach(textarea => {
    textarea.addEventListener('input', updateFilledCount);
  });

  return () => {
    textareas.forEach(textarea => {
      textarea.removeEventListener('input', updateFilledCount);
    });
  };
}, [block.id]);

// В кнопке:
<Button>
  {block.isChecking ? (
    <CircularProgress size={24} />
  ) : (
    `Проверить блок #${blockIndex + 1} ${filledCount > 0 ? `(${filledCount} из ${block.exercises.length})` : ''}`
  )}
</Button>
```

---

### 7. ⚠️ Передать languageId в handleCheckAnswers
**Файл:** `src/app/(main)/exercises/[path]/page.tsx`

**Проблема:**
`handleCheckAnswers` в store не имеет доступа к `languageId` для передачи языка в API проверки.

**Изменить сигнатуру в store:**
```typescript
// src/store/appStore.ts
interface AppStore {
  handleCheckAnswers: (
    blockId: string, 
    userAnswers: { [key: string]: string },
    languageId: string  // Добавить параметр
  ) => Promise<void>;
}
```

**Обновить вызов в page.tsx:**
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

## Рефакторинг / Refactoring

### 8. 📝 Выделить логику сбора ответов в отдельную функцию
**Файл:** `src/app/(main)/exercises/[path]/ExerciseBlock.tsx`

**Рефакторинг:**
```typescript
// Вынести в utils или в компонент
const collectUserAnswers = (blockId: string): { 
  answers: { [key: string]: string }, 
  filledCount: number 
} => {
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${blockId}_"]`);
  const answers: { [key: string]: string } = {};
  let filledCount = 0;
  
  textareas.forEach(textarea => {
    const value = (textarea as HTMLTextAreaElement).value;
    if (value.trim()) {
      answers[textarea.id] = value;
      filledCount++;
    }
  });
  
  return { answers, filledCount };
};
```

---

### 9. 📝 Добавить типизацию для ValidationResults
**Файл:** `src/types/index.ts` или новый файл `src/types/exercises.ts`

**Добавить:**
```typescript
export interface ValidationResult {
  isCorrect: boolean;
  error?: string;
  incorrectTranslations?: string[];
}

export interface ValidationResults {
  [textareaId: string]: ValidationResult;
}

export interface BlockValidationResults {
  [blockId: string]: ValidationResults;
}
```

**Использовать в store:**
```typescript
validationResults: BlockValidationResults;
```

---

## Тестирование / Testing

### 10. 🧪 Добавить unit-тесты для parseExerciseContent
**Файл:** `src/components/TextWithInputs.tsx`

**Создать:** `src/components/__tests__/TextWithInputs.test.tsx`

**Тесты:**
```typescript
describe('parseExerciseContent', () => {
  it('should parse bold format correctly', () => {
    const text = 'They **visited** many countries. (visit)';
    const result = parseExerciseContent(text);
    expect(result.displaySentence).toBe('They _____ many countries.');
    expect(result.hints).toEqual(['visit']);
  });

  it('should parse legacy placeholder format', () => {
    const text = 'They {{input}} many countries (visit, visited)';
    const result = parseExerciseContent(text);
    expect(result.displaySentence).toBe('They _____ many countries');
    expect(result.hints).toEqual(['visit', 'visited']);
  });

  it('should handle translation in format', () => {
    const text = 'They **visited** many countries - Они посетили много стран';
    const result = parseExerciseContent(text);
    expect(result.translation).toBe('Они посетили много стран');
  });
});
```

---

### 11. 🧪 Добавить E2E тесты для проверки ответов
**Создать:** `e2e/exercises.spec.ts` (если используется Playwright/Cypress)

**Тесты:**
```typescript
test('should validate filled exercises correctly', async ({ page }) => {
  await page.goto('/exercises/Past_Simple');
  
  // Генерация упражнений
  await page.click('button:has-text("Создать упражнения")');
  await page.waitForSelector('.exercise-block-compact');
  
  // Заполнение упражнения
  const textarea = page.locator('textarea').first();
  await textarea.fill('They visited many countries last summer.');
  
  // Проверка
  await page.click('button:has-text("Проверить блок")');
  await page.waitForSelector('.exercise-input-correct, .exercise-input-incorrect');
  
  // Проверка результата
  const inputClass = await textarea.getAttribute('class');
  expect(inputClass).toContain('exercise-input-correct');
});
```

---

## Улучшение UX / UX Improvements

### 12. 💡 Добавить индикацию сохранения в историю
**Файл:** `src/services/generateTextService.ts`

**Улучшение:**
```typescript
if (result.length > 0) {
  try {
    const sentencesToSave = result.map(/* ... */);
    
    if (sentencesToSave.length > 0) {
      await sentenceHistoryRepository.addHistoryBatch(sentencesToSave);
      showAlert.success(`Сохранено ${sentencesToSave.length} предложений в историю`);
    }
  } catch (saveErr) {
    showAlert.warning('Не удалось сохранить предложения в историю');
    // Не прерываем выполнение, предложения все равно показываются
  }
}
```

---

### 13. 💡 Добавить автосохранение черновиков ответов
**Файл:** `src/components/TextWithInputs.tsx`

**Улучшение:**
```typescript
useEffect(() => {
  // Автосохранение в localStorage каждые 5 секунд
  const saveTimeout = setTimeout(() => {
    if (textareaValue.trim()) {
      localStorage.setItem(`draft_${textareaId}`, textareaValue);
    }
  }, 5000);

  return () => clearTimeout(saveTimeout);
}, [textareaValue, textareaId]);

// Загрузка черновика при монтировании
useEffect(() => {
  const draft = localStorage.getItem(`draft_${textareaId}`);
  if (draft) {
    setTextareaValue(draft);
  }
}, [textareaId]);

// Очистка черновика после успешной проверки
useEffect(() => {
  if (isValidated && isCorrect) {
    localStorage.removeItem(`draft_${textareaId}`);
  }
}, [isValidated, isCorrect, textareaId]);
```

---

### 14. 💡 Добавить кнопку "Очистить все ответы" в блоке
**Файл:** `src/app/(main)/exercises/[path]/ExerciseBlock.tsx`

**Добавить:**
```typescript
const handleClearAnswers = () => {
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
  textareas.forEach(textarea => {
    (textarea as HTMLTextAreaElement).value = '';
  });
  
  // Очистить результаты проверки для этого блока
  set(state => ({
    validationResults: {
      ...state.validationResults,
      [block.id]: {}
    }
  }));
  
  showAlert.info('Ответы очищены');
};

// В UI:
{mode === 'student' && (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Button onClick={handleClearAnswers} variant="outlined">
      Очистить ответы
    </Button>
    <Button onClick={handleCheckAnswers} variant="contained">
      Проверить блок #{blockIndex + 1}
    </Button>
  </Box>
)}
```

---

## Производительность / Performance

### 15. ⚡ Оптимизировать поиск textarea через querySelector
**Файл:** `src/app/(main)/exercises/[path]/ExerciseBlock.tsx`

**Проблема:**
Повторный querySelector при каждом вызове `handleCheckAnswers`.

**Оптимизация:**
```typescript
const textareasRef = useRef<HTMLTextAreaElement[]>([]);

useEffect(() => {
  // Кэшировать ссылки на textarea при монтировании
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
  textareasRef.current = Array.from(textareas) as HTMLTextAreaElement[];
}, [block.id]);

const handleCheckAnswers = () => {
  const userAnswers: { [key: string]: string } = {};
  textareasRef.current.forEach(textarea => {
    const value = textarea.value;
    if (value.trim()) {
      userAnswers[textarea.id] = value;
    }
  });
  onCheckAnswers(block.id, userAnswers);
};
```

---

## Обработка ошибок / Error Handling

### 16. 🛡️ Улучшить обработку ошибок AI
**Файл:** `src/store/appStore.ts` → `handleCheckAnswers()`

**Добавить:**
```typescript
try {
  const data = await ApiService.checkAnswers({
    topic: selectedTopic,
    answersText: answersText,
    languageName: languageName
  });
  
  // Валидация ответа AI
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format from AI');
  }
  
  if (data.length === 0) {
    showAlert.warning('AI не вернул результаты проверки');
    return;
  }
  
  // ... обработка результатов
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes('No token found')) {
      showAlert.error('Токен AI не настроен. Перейдите в настройки.');
    } else if (err.message.includes('402')) {
      showAlert.error('Токен AI не активен. Пополните баланс.');
    } else if (err.message.includes('502')) {
      showAlert.error('AI сервис недоступен. Попробуйте позже.');
    } else {
      showAlert.error(`Ошибка при проверке: ${err.message}`);
    }
  }
  
  set({ error: `Ошибка при проверке ответов: ${errorMessage}` });
}
```

---

## Документация кода / Code Documentation

### 17. 📖 Добавить JSDoc комментарии к функциям
**Файлы:** `src/services/generateTextService.ts`, `src/services/checkAnswersService.ts`, `src/store/appStore.ts`

**Пример:**
```typescript
/**
 * Генерирует упражнения на основе темы, языка, уровня и слов
 * 
 * @param rawBody - Объект с параметрами генерации
 * @param userId - ID пользователя для выбора AI модели
 * @returns Объект с статусом и массивом сгенерированных предложений
 * 
 * @example
 * const result = await processGenerateTextRequest({
 *   mode: 'student',
 *   topic: 'Past Simple',
 *   languageId: 'en-id',
 *   level: 'B1',
 *   selectedWords: [{ id: 'w1', word: 'visit' }]
 * }, 'user-123');
 */
export async function processGenerateTextRequest(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  // ...
}
```

---

## Приоритизация задач / Task Prioritization

### Высокий приоритет (исправить сначала):
1. ❌ Задача #1: Исправить обработку textarea в проверке ответов
2. ❌ Задача #2: Исправить сохранение результатов проверки
3. ❌ Задача #3: Использовать правильный API endpoint для проверки
4. ⚠️ Задача #4: Добавить валидацию заполненных ответов
5. ⚠️ Задача #7: Передать languageId в handleCheckAnswers

### Средний приоритет (можно отложить):
6. ⚠️ Задача #5: Улучшить промпт для проверки ответов
7. ⚠️ Задача #6: Добавить счетчик заполненных упражнений
8. 📝 Задача #8: Выделить логику сбора ответов в отдельную функцию
9. 📝 Задача #9: Добавить типизацию для ValidationResults
10. 🛡️ Задача #16: Улучшить обработку ошибок AI

### Низкий приоритет (nice to have):
11. 🧪 Задача #10: Добавить unit-тесты
12. 🧪 Задача #11: Добавить E2E тесты
13. 💡 Задача #12: Индикация сохранения в историю
14. 💡 Задача #13: Автосохранение черновиков
15. 💡 Задача #14: Кнопка "Очистить все ответы"
16. ⚡ Задача #15: Оптимизировать поиск textarea
17. 📖 Задача #17: Добавить JSDoc комментарии

---

## Чек-лист для проверки / Verification Checklist

После исправления критических ошибок проверить:

- [ ] Генерация упражнений в режиме студента работает
- [ ] Генерация примеров в режиме преподавателя работает
- [ ] Заполнение textarea и кнопка "Предзаполнить" работают
- [ ] Проверка только заполненных упражнений работает
- [ ] Результаты проверки отображаются правильно (зеленая/красная рамка)
- [ ] Ошибки грамматики отображаются под textarea
- [ ] Ошибки перевода отображаются отдельным блоком
- [ ] Кнопка "Проверить" показывает loading состояние
- [ ] Двойной клик по словам открывает перевод
- [ ] Кнопка "Добавить ещё упражнения" создает новый блок
- [ ] История предложений сохраняется в БД
- [ ] Обработка ошибок AI работает корректно

---

**Дата создания:** 2025-10-24
**Версия:** 1.0.0
