# Feedback Feature UI Flow

## Desktop View

```
┌─────────────────────────────────────────────────────────────────────┐
│ Изучение английского языка                    [Lang] [Icons...]     │
│                                                                       │
│  [Тренировка] [Сочинения] [Словарь] [История] [AI] [💬] [⚙️]      │
│                                                                  ↑    │
│                                                    NEW: Feedback btn  │
└─────────────────────────────────────────────────────────────────────┘
```

## Mobile View

```
┌──────────────────────────────┐
│ Английского          [☰]     │
└──────────────────────────────┘
                               ↓ Opens drawer
                         ┌─────────────────┐
                         │ 🌍 Язык         │
                         │ 💪 Тренировка   │
                         │ ✍️  Сочинения    │
                         │ 📖 Словарь      │
                         │ 🕐 История      │
                         │ 🤖 AI модель    │
                         │ 💬 Обратная связь │ ← NEW
                         │ ⚙️  Настройки    │
                         └─────────────────┘
```

## Feedback Modal

```
┌─────────────────────────────────────────────────┐
│ Сообщить о проблеме или предложить улучшение  ×│
├─────────────────────────────────────────────────┤
│                                                 │
│  Тип: [v]                                      │
│       ├─ 🐛 Баг                                │
│       └─ 💡 Фича                               │
│                                                 │
│  Заголовок: ____________________________       │
│              (max 200 chars)                   │
│                                                 │
│  Описание:  ____________________________       │
│             ____________________________       │
│             ____________________________       │
│             ____________________________       │
│             ____________________________       │
│             ____________________________       │
│                                                 │
│                                                 │
│                        [Отмена] [Отправить]    │
└─────────────────────────────────────────────────┘
```

## Form Validation

1. **Type**: Pre-selected to "bug", can be changed to "feature"
2. **Title**: Required, shows error if empty
3. **Description**: Required, shows error if empty

## Submit Flow

```
User fills form → Clicks "Отправить" 
                ↓
              Validation
                ↓
          API call to /api/feedback
                ↓
          GitHub API (Octokit)
                ↓
          Issue created with:
          - Title: "🐛 [user title]" or "💡 [user title]"
          - Body: [user description] + @Goroshik mention
          - Label: "bug" or "enhancement"
                ↓
          Success message shown
                ↓
          Modal closes
```

## Error Handling

1. **Empty fields**: Alert shows "Пожалуйста, введите заголовок/описание"
2. **API error**: Alert shows error message
3. **Network error**: Alert shows "Не удалось отправить обратную связь"

## Created GitHub Issue Example

### Bug Report
```
Title: 🐛 Не работает кнопка сохранения в настройках

Body:
При нажатии на кнопку "Сохранить" в настройках ничего не происходит.
Консоль браузера показывает ошибку 500.

---

@Goroshik

Labels: bug
```

### Feature Request
```
Title: 💡 Добавить темную тему

Body:
Было бы здорово иметь возможность переключаться между светлой и темной темой.
Особенно полезно для занятий вечером.

---

@Goroshik

Labels: enhancement
```

## Configuration Required

Repository owner must set up environment variables:

```bash
GITHUB_TOKEN="github_pat_xxx..."  # Personal Access Token with 'repo' scope
GITHUB_OWNER="Goroshik"           # Repository owner
GITHUB_REPO="language_exercise"   # Repository name
```

## Testing Checklist

- [ ] Feedback button visible in desktop header
- [ ] Feedback button visible in mobile menu
- [ ] Modal opens when clicking feedback button
- [ ] Dropdown shows both "Баг" and "Фича" options
- [ ] Title field accepts text input
- [ ] Description field accepts multiline text
- [ ] Form validates empty fields
- [ ] Submit button shows loading state
- [ ] Success message appears after submission
- [ ] GitHub issue is created with correct format
- [ ] Issue mentions @Goroshik
- [ ] Issue has correct label (bug/enhancement)
- [ ] Modal closes after successful submission
