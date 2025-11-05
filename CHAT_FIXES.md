# AI Chat System - Исправления и Улучшения

## Проблемы, которые были исправлены

### 1. Отсутствие модели ChatMessage в Prisma схеме

**Проблема**: В базе данных не была создана модель для хранения сообщений чата.

**Решение**: Добавлена модель `ChatMessage` в `prisma/schema.prisma`:

```prisma
model ChatMessage {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  role      String   // 'user' or 'assistant'
  content   String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}
```

### 2. Отсутствие index.ts в репозитории

**Проблема**: Импорт `import { chatMessageRepository } from 'src/repository'` не работал.

**Решение**: Создан файл `src/repository/index.ts` для экспорта всех репозиториев:

```typescript
export {
  prisma,
  tagRepository,
  wordRepository,
  entityTagRepository,
  userRepository,
  userTokenRepository,
  userSettingsRepository,
  sentenceHistoryRepository,
  languageRepository,
  userAnswerRepository,
  chatMessageRepository
} from './client';
```

### 3. Неправильный импорт в ChatMessageRepository

**Проблема**: Импорт из `'src/generated/prisma/client'` вместо правильного пути.

**Решение**: Исправлен импорт на `'src/generated/prisma'`.

### 4. Отсутствие API endpoints для истории чата

**Проблема**: Не было возможности загрузить историю чата из БД и очистить её.

**Решение**: Добавлены методы GET и DELETE в `/api/chat/message/route.ts`:

- `GET /api/chat/message?limit=50` - получение истории
- `DELETE /api/chat/message` - очистка истории

## Новые функции

### 1. Загрузка истории чата из БД

- При открытии чата автоматически загружается история из базы данных
- Метод `loadHistory()` в `chatStore.ts`
- Синхронизация между локальным хранилищем и БД

### 2. Очистка истории в БД

- Кнопка очистки истории теперь удаляет сообщения из базы данных
- Метод `clearHistory()` в `chatStore.ts`
- Показывает уведомление об успешной очистке

### 3. Полная интеграция с базой данных

- Все сообщения сохраняются в MongoDB
- История сохраняется между сессиями
- Связь с моделью User через userId

## Архитектура

### Backend (API)

```
POST   /api/chat/message   - Отправка сообщения AI
GET    /api/chat/message   - Получение истории чата
DELETE /api/chat/message   - Очистка истории чата
```

### Services

- `ChatService` - бизнес-логика чата
  - `sendMessage()` - отправка сообщения и получение ответа AI
  - `getChatHistory()` - получение истории из БД
  - `clearChatHistory()` - очистка истории в БД

### Repository

- `ChatMessageRepository` - работа с БД
  - `addMessage()` - добавление сообщения
  - `getMessages()` - получение сообщений пользователя
  - `deleteAllMessages()` - удаление всех сообщений пользователя

### Frontend (Store)

- `chatStore.ts` - состояние чата (Zustand)
  - `sendMessage()` - отправка сообщения через API
  - `loadHistory()` - загрузка истории из API
  - `clearHistory()` - очистка через API
  - Сохранение в localStorage для offline доступа

### Components

- `ChatModal` - модальное окно чата (для десктопа)
- `ChatWidget` - виджет чата с плавающей кнопкой (для мобильных)
- Оба компонента используют одинаковый store и загружают историю при открытии

## Использование

### Отправка сообщения

```typescript
const { sendMessage } = useChatStore();
await sendMessage('Привет, AI!');
```

### Загрузка истории

```typescript
const { loadHistory } = useChatStore();
await loadHistory(); // Автоматически вызывается при открытии чата
```

### Очистка истории

```typescript
const { clearHistory } = useChatStore();
await clearHistory(); // Очищает БД и локальное хранилище
```

## Тестирование

1. Запустить dev сервер: `yarn dev`
2. Открыть чат (кнопка Chat в интерфейсе)
3. Отправить несколько сообщений
4. Обновить страницу - история должна загрузиться
5. Нажать кнопку очистки - история должна удалиться

## Требования

- MongoDB с replica set (для транзакций)
- Настроенные AI токены (Gemini/OpenAI/Claude)
- Авторизованный пользователь (JWT в cookies)

## Примечания

- История чата привязана к пользователю через `userId`
- Сообщения хранятся неограниченно (нет TTL)
- При удалении пользователя сообщения удаляются каскадно
- Локальное хранилище синхронизируется с БД при открытии чата
