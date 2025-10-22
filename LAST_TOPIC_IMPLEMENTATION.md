# Реализация сохранения последнего выбранного топика

## Обзор изменений

Реализовано сохранение последнего выбранного топика **только на клиенте** через `localStorage`. Данные больше НЕ отправляются на сервер.

## Изменения в коде

### 1. Store (`src/store/appStore.ts`)

Добавлены:

- **Состояние**: `lastSelectedTopicPath: string` - хранит путь последнего выбранного топика
- **Функция**: `loadLastSelectedTopic()` - загружает последний топик из `localStorage`

```typescript
lastSelectedTopicPath: '',

loadLastSelectedTopic: async () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('lastSelectedTopicPath');
    if (stored) {
      set({ lastSelectedTopicPath: stored });
      return stored;
    }
  }
  return '';
}
```

### 2. Страница выбора топика (`src/app/(main)/topics/page.tsx`)

**Было**: Отправка на сервер через API

```typescript
fetch('/api/settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lastSelectedTopic: path })
});
```

**Стало**: Сохранение в localStorage

```typescript
if (typeof window !== 'undefined') {
  localStorage.setItem('lastSelectedTopicPath', path);
}
```

### 3. Страница упражнений (`src/app/(main)/exercises/[path]/page.tsx`)

**Было**: Отправка на сервер через API

```typescript
fetch('/api/settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lastSelectedTopic: topicPath })
});
```

**Стало**: Сохранение в localStorage

```typescript
if (topicPath && typeof window !== 'undefined') {
  localStorage.setItem('lastSelectedTopicPath', topicPath);
}
```

### 4. Header (`src/components/Header.tsx`)

Использует `loadLastSelectedTopic()` для загрузки последнего топика при монтировании:

```typescript
const { selectedTopic, loadLastSelectedTopic, state, isNavigating, setIsNavigating } =
  useAppStore();

useEffect(() => {
  loadLastSelectedTopic();
}, [loadLastSelectedTopic]);
```

### 5. ESLint config (`eslint.config.js`)

Добавлены глобальные переменные для работы с Web Storage API:

```javascript
globals: {
  // ...
  localStorage: 'readonly',
  sessionStorage: 'readonly'
}
```

## Преимущества такого подхода

1. ✅ **Нет запросов на сервер** - снижена нагрузка на API
2. ✅ **Быстрая работа** - мгновенный доступ к данным из localStorage
3. ✅ **Приватность** - данные хранятся только локально у пользователя
4. ✅ **Простота** - не требуется синхронизация с БД
5. ✅ **Работает офлайн** - доступно даже без подключения к серверу

## Поле в Prisma Schema

Поле `lastSelectedTopic` в модели `UserSettings` **остается в схеме**, но больше не используется для этой функциональности. Его можно:

- Удалить (если не планируется использовать)
- Оставить для других целей (например, аналитика на сервере)

## Тестирование

Для проверки работы:

1. Откройте приложение
2. Выберите топик на странице `/topics`
3. Проверьте в DevTools → Application → Local Storage → `lastSelectedTopicPath`
4. Обновите страницу - значение должно сохраниться
5. Проверьте Network → убедитесь, что нет запросов PATCH к `/api/settings`

## Связанные файлы

- `src/store/appStore.ts` - стор с функцией загрузки
- `src/app/(main)/topics/page.tsx` - страница выбора топика
- `src/app/(main)/exercises/[path]/page.tsx` - страница упражнений
- `src/components/Header.tsx` - компонент хедера
- `src/types/index.ts` - типы
- `eslint.config.js` - конфигурация линтера
- `prisma/schema.prisma` - схема БД (поле не используется)
