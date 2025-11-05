# Документация по функционалу упражнений / Exercise Functionality Documentation

## Оглавление / Table of Contents

1. [Обзор](#обзор--overview)
2. [Генерация упражнений](#генерация-упражнений--exercise-generation)
3. [Режим преподавателя](#режим-преподавателя--teacher-mode)
4. [Режим студента](#режим-студента--student-mode)
5. [Проверка ответов](#проверка-ответов--answer-validation)
6. [Формат данных](#формат-данных--data-format)
7. [Архитектура](#архитектура--architecture)
8. [API Endpoints](#api-endpoints)
9. [TODO List](#todo-list)

---

## Обзор / Overview

Приложение предоставляет функционал для генерации и выполнения грамматических упражнений на иностранных языках с использованием AI моделей (Gemini, OpenAI, Claude).

**The application provides functionality for generating and completing grammar exercises in foreign languages using AI models (Gemini, OpenAI, Claude).**

### Основные возможности / Key Features:

- Два режима работы: для преподавателя и студента / Two modes: teacher and student
- AI-генерация упражнений на основе темы, языка, уровня и слов / AI-powered exercise generation based on topic, language, level, and words
- Сохранение истории сгенерированных предложений / Saving history of generated sentences
- Проверка ответов с помощью AI / AI-powered answer validation
- Перевод слов по двойному клику / Word translation on double-click
- Предзаполнение ответов / Answer pre-filling

---

## Генерация упражнений / Exercise Generation

### Входные параметры / Input Parameters:

Упражнения генерируются на основе следующих параметров:

**Exercises are generated based on the following parameters:**

1. **Тема (Topic)** - грамматическая тема (например, "Past Simple", "Articles", "Present Perfect")
2. **Язык (Language)** - целевой язык обучения (выбирается из списка доступных языков в БД)
3. **Уровень (Level)** - уровень сложности по CEFR: A1, A2, B1, B2, C1, C2
4. **Слова (Words)** - опциональный список слов из словаря пользователя, которые должны быть использованы в упражнениях
5. **Режим (Mode)** - `student` (для тренировки) или `teacher` (для изучения)

### Процесс генерации / Generation Process:

```typescript
// Пример запроса / Example request
const response = await fetch('/api/ai/generate-text', {
  method: 'POST',
  body: JSON.stringify({
    mode: 'student',
    topic: 'Past Simple',
    languageId: 'language-id',
    level: 'B1',
    selectedWords: [{ id: 'word-id', word: 'visit' }]
  })
});
```

**Шаги генерации / Generation Steps:**

1. Пользователь выбирает тему, язык, уровень и опционально слова
2. Формируется промпт для AI на основе режима (student/teacher) и параметров
3. Запрос отправляется к выбранной AI модели пользователя (Gemini/OpenAI/Claude)
4. AI возвращает 5 предложений (для student) или 10 предложений (для teacher)
5. Предложения парсятся и сохраняются в историю (`SentenceHistory`)
6. Предложения отображаются пользователю

### Формат ответа AI / AI Response Format:

AI всегда возвращает предложения в едином формате:

**AI always returns sentences in a unified format:**

```
They **visited** many countries last summer. (visit)
She **bought** a beautiful dress yesterday. (buy)
I **have been studying** English for two years. (study)
**The** sun is shining brightly.
```

**Формат:**

- Одно предложение на строку
- Ключевое слово выделено двойными звездочками: `**word**`
- Опциональная подсказка в скобках в конце предложения: `(hint)`
- Подсказки НЕ добавляются для артиклей и форм "to be"

---

## Режим преподавателя / Teacher Mode

### Назначение / Purpose:

Режим для изучения правильных примеров использования грамматики.

**Mode for learning correct grammar examples.**

### Генерация / Generation:

- AI генерирует **10 предложений** с правильными ответами
- Используется промпт `GRAMMAR_PROMPTS.generateTeacherExamples()`
- Предложения содержат выделенное ключевое слово в **правильной форме**

### Отображение / Display:

В режиме преподавателя используется компонент `LearnModeText`:

**Teacher mode uses the `LearnModeText` component:**

```typescript
<LearnModeText text={exercise.sentence} />
```

**Функционал:**

1. Предложение отображается полностью с выделенным словом (жирным шрифтом)
2. Двойной клик по любому слову открывает панель перевода `WordTranslationPanel`
3. Панель показывает перевод слова и кнопку "Добавить в словарь"
4. Кнопка "Проверить" **НЕ отображается** в режиме преподавателя

**Пример отображения:**

```
They visited many countries last summer.
    ↑ (жирный шрифт / bold)
```

### Генерация дополнительных примеров / Generating More Examples:

Кнопка **"Добавить ещё упражнения"** выполняет тот же процесс:

1. Отправляет запрос к AI с теми же параметрами
2. AI возвращает новые 10 предложений
3. Предложения сохраняются в историю по отдельности
4. Создается новый блок упражнений на UI
5. Пользователь видит дополнительный блок с новыми примерами

---

## Режим студента / Student Mode

### Назначение / Purpose:

Режим для тренировки и закрепления грамматики с проверкой ответов.

**Mode for practicing and reinforcing grammar with answer validation.**

### Генерация / Generation:

- AI генерирует **5 предложений** для заполнения
- Используется промпт `GRAMMAR_PROMPTS.generateStudentExercises()`
- Предложения содержат выделенное ключевое слово и подсказки

### Отображение / Display:

В режиме студента используется компонент `TextWithInputs`:

**Student mode uses the `TextWithInputs` component:**

```typescript
<TextWithInputs
  text={exercise.sentence}
  exerciseIndex={`${block.id}_${exerciseIndex}`}
  validationResults={validationResults}
/>
```

**Функционал:**

#### 1. Отображение предложения / Sentence Display:

- Выделенное слово `**word**` заменяется на пропуски: `_____`
- Подсказка отображается под предложением: "Подсказка: visit, visited"
- Опциональный перевод предложения (если есть в истории)

**Пример:**

```
Предложение: They _____ many countries last summer.
Подсказка: visit, visited
```

#### 2. Поле для ответа / Answer Field:

- Многострочный текстовый инпут (textarea)
- Кнопка **"Предзаполнить"** в правом верхнем углу инпута
- При клике на "Предзаполнить" вставляется предложение с пропусками (без подсказки)

**Поведение предзаполнения / Pre-fill Behavior:**

```typescript
// Кнопка активна только если поле пустое
// Button is active only if field is empty
const isPrefillDisabled = textareaValue.trim().length > 0 || !prefillSentence;
```

#### 3. Заполнение ответа / Filling the Answer:

Пользователь может:

- Вставить предложение кнопкой "Предзаполнить"
- Заполнить пропуск правильным словом
- Опционально добавить перевод предложения

**Пример заполнения:**

```
Инпут:
They visited many countries last summer.
Перевод: Они посетили много стран прошлым летом.
```

#### 4. Двойной клик для перевода / Double-click for Translation:

- Двойной клик по любому слову в отображаемом предложении
- Открывается `WordTranslationPanel` с переводом слова
- Возможность добавить слово в словарь

### Проверка ответов / Checking Answers:

Кнопка **"Проверить блок #N"** внизу блока упражнений:

**"Check Block #N" button at the bottom of the exercise block:**

1. Собирает **ВСЕ ЗАПОЛНЕННЫЕ** предложения из textarea блока
2. Отправляет на проверку AI через `/api/ai/check-answers`
3. AI проверяет грамматику и переводы (если указаны)
4. Результаты отображаются под каждым упражнением

**Состояния проверки / Validation States:**

- **Загрузка:** показывается `CircularProgress` на кнопке
- **Успех:** зеленая рамка вокруг инпута
- **Ошибка:** красная рамка + сообщение об ошибке под инпутом

---

## Проверка ответов / Answer Validation

### Процесс проверки / Validation Process:

```typescript
// 1. Сбор ответов / Collect answers
const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
const userAnswers: { [key: string]: string } = {};
textareas.forEach(textarea => {
  userAnswers[textarea.id] = (textarea as HTMLTextAreaElement).value;
});

// 2. Отправка на проверку / Send for validation
const response = await ApiService.checkAnswers({
  topic: selectedTopic,
  answersText: formattedAnswers,
  languageName: 'English'
});
```

### Формат ответа AI / AI Response Format:

AI возвращает результаты проверки в следующем формате:

**AI returns validation results in the following format:**

```
1. CORRECT
2. ERROR: используйте Past Simple вместо Present Simple
3. TRANSLATION_ERRORS: visited - посетили, countries - страны
4. ERROR: отсутствует артикль "the" | TRANSLATION_ERRORS: sun - солнце
```

**Типы ответов / Response Types:**

- `CORRECT` - предложение правильное
- `ERROR: [объяснение]` - грамматическая ошибка
- `TRANSLATION_ERRORS: word1 - перевод1, word2 - перевод2` - ошибки в переводе
- Комбинация обоих через `|`

### Отображение результатов / Displaying Results:

```typescript
// Красная рамка и сообщение об ошибке
// Red border and error message
{isValidated && !isCorrect && errorMessage && (
  <Box sx={{ color: '#d32f2f', backgroundColor: '#ffebee' }}>
    {errorMessage}
  </Box>
)}

// Список неправильных переводов
// List of incorrect translations
{incorrectTranslations && incorrectTranslations.length > 0 && (
  <Box sx={{ color: '#d32f2f', backgroundColor: '#ffebee' }}>
    <strong>Неправильные переводы:</strong>
    <ul>
      {incorrectTranslations.map(item => <li>{item}</li>)}
    </ul>
  </Box>
)}
```

---

## Формат данных / Data Format

### Формат предложений AI / AI Sentence Format:

Существует два формата предложений (приложение поддерживает оба):

**Two sentence formats exist (app supports both):**

#### 1. Формат с bold (новый, основной) / Bold Format (new, primary):

```
They **visited** many countries last summer. (visit)
```

- `**word**` - выделенное слово в правильной форме
- `(hint)` - опциональная подсказка в скобках

#### 2. Формат с placeholder (legacy) / Placeholder Format (legacy):

```
They {{input}} many countries (visit, visited)
```

- `{{input}}` - место для вставки слова
- `(hint1, hint2)` - подсказки в скобках

**Компонент `TextWithInputs` обрабатывает оба формата:**

```typescript
const hasBoldFormat = BOLD_WORD_REGEX.test(mainLine);
if (hasBoldFormat) {
  // Обработка формата **word**
  // Handle **word** format
  const displaySentence = mainLine.replace(/\*\*(.*?)\*\*/g, '_____');
} else {
  // Обработка формата {{input}}
  // Handle {{input}} format
  const displaySentence = mainLine.replace(PLACEHOLDER_REGEX, '_____');
}
```

### Сохранение в БД / Database Storage:

```typescript
// Модель SentenceHistory
{
  id: string;
  ownerId: string;           // ID пользователя
  sentence: string;          // Предложение (БЕЗ подсказок)
  languageId: string;        // ID языка
  usedWordIds: string[];     // Массив ID использованных слов из словаря
  level: string;             // Уровень (A1-C2)
  mode: string;              // 'student' или 'teacher'
  createdAt: Date;
}
```

**Важно:** Подсказки удаляются перед сохранением в историю:

**Important:** Hints are removed before saving to history:

```typescript
const sentenceWithoutHints = sentence.replace(/\s*\([^)]+\)\s*$/, '').trim();
```

---

## Архитектура / Architecture

### Компоненты / Components:

```
src/app/(main)/exercises/[path]/
├── page.tsx                    # Главная страница упражнений / Main exercise page
├── ExerciseBlock.tsx           # Блок упражнений / Exercise block
├── LearnModeText.tsx          # Отображение для режима преподавателя / Teacher mode display
├── TextWithInputs.tsx         # Отображение для режима студента / Student mode display (в src/components)
└── WordSelector.tsx           # Селектор слов из словаря / Dictionary word selector
```

### Сервисы / Services:

```
src/services/
├── generateTextService.ts      # Логика генерации упражнений / Exercise generation logic
├── checkAnswersService.ts      # Логика проверки ответов / Answer validation logic
└── aiFactory.ts                # Фабрика для выбора AI провайдера / AI provider factory
```

### Промпты / Prompts:

```typescript
// src/prompts/grammarPrompts.ts
export const GRAMMAR_PROMPTS = {
  // Генерация упражнений для студента (5 предложений)
  generateStudentExercises: (topic, languageName, selectedWords?) => string;

  // Генерация примеров для преподавателя (10 предложений)
  generateTeacherExamples: (topic, level, languageName, selectedWords?) => string;

  // Проверка ответов студента
  validateAnswers: (topic, answersText, languageName?) => string;
};
```

### State Management:

```typescript
// src/store/appStore.ts (Zustand)
interface AppStore {
  state: 'loading-topics' | 'loading-exercises' | 'exercises' | 'topic-selection';
  selectedTopic: string;
  exerciseBlocks: ExerciseBlock[]; // Массив блоков упражнений
  validationResults: {
    // Результаты проверки по блокам
    [blockId: string]: {
      [inputId: string]: {
        isCorrect: boolean;
        error?: string;
        incorrectTranslations?: string[];
      };
    };
  };

  // Actions
  handleTopicSelect: (params) => Promise<void>;
  generateMoreExercises: (params) => Promise<void>;
  handleCheckAnswers: (blockId, userAnswers) => Promise<void>;
}
```

### Поток данных / Data Flow:

```
1. Пользователь выбирает параметры
   User selects parameters
   ↓
2. handleTopicSelect / generateMoreExercises
   ↓
3. ApiService.generateText() → /api/ai/generate-text
   ↓
4. processGenerateTextRequest (сервис)
   ↓
5. AIFactory.getAIService(userId) → выбор AI модели
   Choose AI model
   ↓
6. aiService.generateText(prompt) → вызов AI API
   Call AI API
   ↓
7. formatAIResponse() → парсинг ответа
   Parse response
   ↓
8. sentenceHistoryRepository.addHistoryBatch() → сохранение в БД
   Save to database
   ↓
9. Обновление state → отображение на UI
   Update state → display on UI
```

---

## API Endpoints

### 1. Генерация упражнений / Generate Exercises

**POST** `/api/ai/generate-text`

```typescript
Request:
{
  mode: 'student' | 'teacher',
  topic: string,                    // e.g., "Past Simple"
  languageId: string,               // UUID языка / Language UUID
  level: string,                    // A1, A2, B1, B2, C1, C2
  selectedWords?: DictionaryWord[]  // Опциональные слова
}

Response:
{
  success: true,
  data: string[]  // Массив сгенерированных предложений
}
```

### 2. Проверка ответов / Check Answers

**POST** `/api/ai/check-answers`

```typescript
Request:
{
  topic: string,                    // Грамматическая тема
  answersText: string,              // Форматированный текст с ответами
  languageName?: string             // По умолчанию 'English'
}

Response:
{
  success: true,
  data: string[]  // Массив результатов проверки
}
```

### 3. История сгенерированных предложений / Generated Sentences History

**GET** `/api/ai/generated-history`

```typescript
Query:
?languageId=string&mode=string&level=string&page=number&perPage=number

Response:
{
  success: true,
  data: {
    sentences: SentenceHistory[],
    totalCount: number,
    currentPage: number,
    totalPages: number
  }
}
```

---

## TODO List

### 🐛 Найденные проблемы / Issues Found:

#### 1. ❌ Неправильная обработка textarea в проверке ответов / Incorrect Textarea Handling in Answer Validation

**Местоположение / Location:** `src/store/appStore.ts` → `handleCheckAnswers()`

**Проблема / Issue:**

```typescript
// Текущая реализация пытается обработать {{input}} placeholders
// Current implementation tries to handle {{input}} placeholders
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

**Проблема:**

- В режиме студента предложения используют формат `**word**`, а не `{{input}}`
- `userAnswers` содержит полные предложения из textarea с ID вида `textarea_${blockId}_${index}`
- Код пытается найти несуществующие `input_${blockId}_${index}_${counter}` вместо `textarea_${blockId}_${index}`

**Правильная реализация / Correct Implementation:**

```typescript
const answersText = block.exercises
  .map((exercise, index) => {
    const textareaId = `textarea_${blockId}_${index}`;
    const userAnswer = userAnswers[textareaId] || '';
    // Отправляем только заполненные ответы
    // Send only filled answers
    return userAnswer.trim() ? `${index + 1}. ${userAnswer}` : null;
  })
  .filter(Boolean)
  .join('\n');
```

#### 2. ❌ Неправильное сохранение результатов проверки / Incorrect Validation Results Storage

**Проблема / Issue:**

```typescript
// Текущий код пытается создать results для несуществующих input_* ID
// Current code tries to create results for non-existent input_* IDs
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

**Правильная реализация / Correct Implementation:**

```typescript
data.forEach((line: string, index: number) => {
  const textareaId = `textarea_${blockId}_${index}`;
  const isCorrect = line.includes('CORRECT');
  let errorMessage: string | undefined;
  let incorrectTranslations: string[] | undefined;

  if (!isCorrect) {
    if (line.includes('ERROR:')) {
      const errorPart = line.split('|')[0];
      errorMessage = errorPart.replace(/^\d+\.\s*ERROR:\s*/, '').trim();
    }

    if (line.includes('TRANSLATION_ERRORS:')) {
      const translationPart = line.split('TRANSLATION_ERRORS:')[1];
      incorrectTranslations = translationPart
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }

  results[textareaId] = { isCorrect, error: errorMessage, incorrectTranslations };
});
```

#### 3. ⚠️ Отсутствует фильтрация пустых ответов / Missing Empty Answer Filtering

**Проблема / Issue:**
Кнопка "Проверить" должна отправлять **только заполненные** предложения, но текущая реализация отправляет все, включая пустые.

**Button "Check" should send only filled sentences, but current implementation sends all including empty ones.**

**Решение / Solution:**

```typescript
const handleCheckAnswers = () => {
  const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
  const userAnswers: { [key: string]: string } = {};
  const hasAnyFilledAnswer = Array.from(textareas).some(
    textarea => (textarea as HTMLTextAreaElement).value.trim().length > 0
  );

  if (!hasAnyFilledAnswer) {
    showAlert.warning('Заполните хотя бы одно упражнение');
    return;
  }

  textareas.forEach(textarea => {
    const value = (textarea as HTMLTextAreaElement).value;
    if (value.trim()) {
      // Только заполненные
      userAnswers[textarea.id] = value;
    }
  });

  onCheckAnswers(block.id, userAnswers);
};
```

#### 4. ⚠️ Отсутствует обработка опциональных переводов / Missing Optional Translation Handling

**Проблема / Issue:**
Пользователь может добавить перевод в textarea, но промпт для проверки не указывает формат с переводом.

**User can add translation in textarea, but validation prompt doesn't specify translation format.**

**Решение / Solution:**
Обновить промпт `validateAnswers` для явного указания, что переводы могут быть в формате:

```
They visited many countries last summer.
Перевод: Они посетили много стран прошлым летом.
```

#### 5. ℹ️ Не используется API `/api/ai/check-answers` / API `/api/ai/check-answers` Not Used

**Проблема / Issue:**

```typescript
// В appStore.ts используется прямой generateText вместо checkAnswers API
// In appStore.ts, direct generateText is used instead of checkAnswers API
const validatePrompt = GRAMMAR_PROMPTS.validateAnswers(selectedTopic, answersText);
const data = await ApiService.generateText({ prompt: validatePrompt });
```

**Правильно / Correct:**

```typescript
const data = await ApiService.checkAnswers({
  topic: selectedTopic,
  answersText: answersText,
  languageName: languageName
});
```

#### 6. ⚠️ Отсутствует индикация заполненных упражнений / Missing Filled Exercise Indication

**Рекомендация / Recommendation:**
Добавить визуальную индикацию (например, счетчик) заполненных упражнений перед проверкой:

**Add visual indication (e.g., counter) of filled exercises before checking:**

```typescript
const filledCount = Array.from(textareas).filter(
  textarea => (textarea as HTMLTextAreaElement).value.trim().length > 0
).length;

// В UI: "Проверить блок #1 (3 из 5 заполнено)"
// In UI: "Check block #1 (3 of 5 filled)"
```

### ✅ Что работает правильно / What Works Correctly:

1. ✅ Генерация упражнений для обоих режимов
2. ✅ Формат предложений `**word**` с подсказками
3. ✅ Сохранение истории в БД
4. ✅ Отображение для режима преподавателя (LearnModeText)
5. ✅ Отображение для режима студента (TextWithInputs)
6. ✅ Кнопка "Предзаполнить" с правильной логикой
7. ✅ Двойной клик для перевода слов
8. ✅ Добавление слов в словарь через WordTranslationPanel
9. ✅ Создание дополнительных блоков упражнений
10. ✅ UI состояния загрузки и проверки

### 📋 Рекомендации по улучшению / Improvement Recommendations:

1. **Добавить unit-тесты** для парсинга форматов предложений
   **Add unit tests** for sentence format parsing

2. **Добавить E2E тесты** для флоу генерации и проверки
   **Add E2E tests** for generation and validation flows

3. **Улучшить обработку ошибок** в случае недоступности AI
   **Improve error handling** when AI is unavailable

4. **Добавить кэширование** результатов перевода слов
   **Add caching** for word translation results

5. **Рефакторинг handleCheckAnswers** для упрощения логики
   **Refactor handleCheckAnswers** to simplify logic

6. **Добавить прогресс-бар** для долгих AI запросов
   **Add progress bar** for long AI requests

7. **Поддержка отмены** генерации упражнений
   **Support cancellation** of exercise generation

8. **Офлайн режим** с сохранением черновиков ответов
   **Offline mode** with draft answer saving

---

## Примеры использования / Usage Examples

### Пример 1: Генерация упражнений для студента / Example 1: Generate Student Exercises

```typescript
// Пользователь на странице /exercises/Past_Simple
// User on page /exercises/Past_Simple

// 1. Выбор параметров
selectedMode = 'student';
selectedLevel = 'B1';
selectedLanguageId = 'en-id';
selectedWords = [{ id: 'w1', word: 'visit' }, { id: 'w2', word: 'travel' }];

// 2. Клик "Создать упражнения"
handleGenerateInitial();

// 3. Результат - 5 предложений
[
  "They **visited** many countries last summer. (visit)",
  "We **traveled** across Europe by train. (travel)",
  "She **went** to Paris for vacation. (go)",
  "I **saw** the Eiffel Tower yesterday. (see)",
  "He **took** many photos during the trip. (take)"
]

// 4. Отображение на UI
- Блок упражнений #1 (создан 14:23:45)
  1. They _____ many countries last summer.
     Подсказка: visit
     [Textarea с кнопкой "Предзаполнить"]

  2. We _____ across Europe by train.
     Подсказка: travel
     [Textarea с кнопкой "Предзаполнить"]
  ...
  [Кнопка: Проверить блок #1]
```

### Пример 2: Проверка ответов / Example 2: Check Answers

```typescript
// Пользователь заполнил упражнения
// User filled exercises

// Textarea #1:
"They visited many countries last summer.
Перевод: Они посетили много стран прошлым летом."

// Textarea #2:
"We traveled across Europe by train."

// Клик "Проверить блок #1"
handleCheckAnswers(block.id, {
  'textarea_block123_0': 'They visited many countries last summer.\nПеревод: ...',
  'textarea_block123_1': 'We traveled across Europe by train.'
});

// AI возвращает
[
  "1. CORRECT",
  "2. CORRECT"
]

// Результат на UI
✅ Textarea #1: зеленая рамка
✅ Textarea #2: зеленая рамка
```

### Пример 3: Режим преподавателя / Example 3: Teacher Mode

```typescript
// Пользователь выбирает режим "Преподаватель"
selectedMode = 'teacher';
selectedLevel = 'C1';

// Генерация - 10 предложений с правильными ответами
[
  "They **visited** many countries last summer.",
  "We **have been studying** English for five years.",
  "She **would have come** if she had known about the party.",
  ...
]

// Отображение - полные предложения с выделенными словами
- Блок примеров #1
  1. They visited many countries last summer.
         ↑ (жирный, кликабельно для перевода)

  2. We have been studying English for five years.
        ↑ (жирный, кликабельно для перевода)
  ...

// Кнопки "Проверить" НЕТ
// NO "Check" button
```

---

## Контакты и поддержка / Contacts and Support

При возникновении вопросов или предложений по улучшению документации, создайте issue в репозитории проекта.

**For questions or suggestions for improving the documentation, create an issue in the project repository.**

---

**Последнее обновление / Last updated:** 2025-10-24
**Версия документации / Documentation version:** 1.0.0
