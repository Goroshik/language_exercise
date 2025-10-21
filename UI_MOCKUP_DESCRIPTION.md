# AI Model Selector - UI Mockup Description

## Header Layout (After Login)

The header bar contains the following elements from left to right:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Изучение английского языка        [📚] [📖] [🕐] [🤖] [⚙️]              │
└─────────────────────────────────────────────────────────────────────────┘
```

Where:

- **Изучение английского языка** - App title (left-aligned)
- **[📚]** - Topics button (TopicIcon)
- **[📖]** - Dictionary button (BookIcon)
- **[🕐]** - History button (HistoryIcon)
- **[🤖]** - **NEW: AI Model selector button (SmartToyIcon)** ⭐
- **[⚙️]** - Settings button (SettingsIcon)

All buttons have white background with primary color icons.

## AI Model Selector Modal

When clicking the 🤖 button, a modal dialog appears:

### Case 1: User Has Multiple Tokens

```
┌──────────────────────────────────────────────────┐
│  Выбор AI модели                              ✕  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Выберите AI модель для генерации текста.       │
│  Доступны только модели, для которых            │
│  добавлен токен.                                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Провайдер                                  │ │
│  │ Gemini                              ▼      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Модель                                     │ │
│  │ Gemini 2.5 Flash                    ▼      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Текущая модель:                            │ │
│  │ Gemini 1.5 Pro                             │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
├──────────────────────────────────────────────────┤
│                        [Отмена]  [Сохранить]    │
└──────────────────────────────────────────────────┘
```

### Case 2: User Has One Token Only

```
┌──────────────────────────────────────────────────┐
│  Выбор AI модели                              ✕  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Выберите AI модель для генерации текста.       │
│  Доступны только модели, для которых            │
│  добавлен токен.                                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Провайдер                           🔒     │ │
│  │ OpenAI                                     │ │ <- Disabled, auto-selected
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Модель                                     │ │
│  │ GPT-4o                              ▼      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Текущая модель:                            │ │
│  │ GPT-4o Mini                                │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
├──────────────────────────────────────────────────┤
│                        [Отмена]  [Сохранить]    │
└──────────────────────────────────────────────────┘
```

### Case 3: User Has No Tokens

```
┌──────────────────────────────────────────────────┐
│  Выбор AI модели                              ✕  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠️  У вас нет добавленных токенов.             │
│      Пожалуйста, добавьте токен в настройках,   │
│      чтобы использовать AI модели.              │
│                                                  │
├──────────────────────────────────────────────────┤
│                                     [Отмена]     │
└──────────────────────────────────────────────────┘
```

### Case 4: Saving In Progress

```
┌──────────────────────────────────────────────────┐
│  Выбор AI модели                              ✕  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Provider and model dropdowns shown]            │
│                                                  │
├──────────────────────────────────────────────────┤
│                   [Отмена]  [⏳ Сохранение...]  │ <- Loading spinner
└──────────────────────────────────────────────────┘
```

### Case 5: Success State

```
┌──────────────────────────────────────────────────┐
│  Выбор AI модели                              ✕  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ✓  Модель успешно сохранена!                   │
│                                                  │
│  [Provider and model dropdowns shown]            │
│                                                  │
├──────────────────────────────────────────────────┤
│                        [Отмена]  [Сохранить]    │
└──────────────────────────────────────────────────┘
```

## Provider Dropdown Options

When clicking on the Provider dropdown, it shows only providers for which the user has tokens:

```
┌────────────────────────┐
│ Gemini              ✓  │  <- Selected
│ OpenAI                 │
│ Claude                 │
└────────────────────────┘
```

## Model Dropdown Options (Example: Gemini Selected)

```
┌────────────────────────────────────┐
│ Gemini 2.0 Flash (Experimental)    │
│ Gemini 2.5 Flash                ✓  │  <- Selected
│ Gemini 1.5 Pro                     │
│ Gemini 1.0 Pro                     │
└────────────────────────────────────┘
```

## Model Dropdown Options (Example: OpenAI Selected)

```
┌────────────────────────────────────┐
│ GPT-4o                          ✓  │  <- Selected
│ GPT-4o Mini                        │
│ GPT-4 Turbo                        │
│ GPT-3.5 Turbo                      │
└────────────────────────────────────┘
```

## Model Dropdown Options (Example: Claude Selected)

```
┌────────────────────────────────────┐
│ Claude 3.5 Sonnet               ✓  │  <- Selected
│ Claude 3 Opus                      │
│ Claude 3 Sonnet                    │
│ Claude 3 Haiku                     │
└────────────────────────────────────┘
```

## Color Scheme

- **Primary Color**: Blue (Material-UI primary)
- **Background**: White
- **Success Alert**: Green background with white text
- **Warning Alert**: Orange/Yellow background with dark text
- **Error Alert**: Red background with white text
- **Current Model Box**: Light gray background (#f5f5f5)
- **Buttons**:
  - Cancel: Default (gray)
  - Save: Primary color (blue)
  - Disabled: Gray with reduced opacity

## Behavior

1. **Modal opens** → Fetches data from API
2. **Loading** → Shows spinner while fetching
3. **Provider selection** → Updates model dropdown immediately
4. **Model selection** → Enables Save button if different from current
5. **Save clicked** → Shows loading spinner, makes PATCH request
6. **Success** → Shows success message for 1 second, then auto-closes
7. **Error** → Shows error message, keeps modal open

## Accessibility

- All buttons have `aria-label` attributes
- Tooltips on header icons
- Keyboard navigation supported
- Screen reader friendly labels
- Disabled states clearly indicated
