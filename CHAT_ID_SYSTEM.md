# Chat System с ChatID - Реализация

## Что реализовано

### ✅ Система chatId для разделения чатов

Каждая переписка теперь имеет уникальный `chatId`, что позволяет:
- Вести несколько независимых чатов
- Сохранять историю всех чатов в БД
- Синхронизировать текущий чат между устройствами

### 🗄️ Изменения в базе данных

#### ChatMessage модель:
```prisma
model ChatMessage {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  chatId    String   // Новое поле!
  role      String   // 'user' or 'assistant'
  content   String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, chatId])  // Индекс для быстрого поиска
  @@map("chat_messages")
}
```

#### UserSettings модель:
```prisma
model UserSettings {
  // ... остальные поля
  lastChatId String? // Новое поле для синхронизации
  // ...
}
```

## Логика работы

### 1. Создание chatId

При первом сообщении:
```typescript
// Если chatId не передан
if (!chatId) {
  chatId = randomUUID(); // Генерируем новый UUID
  // Сохраняем в настройки пользователя
  await userSettingsRepository.upsert(userId, { lastChatId: chatId });
}
```

### 2. Сохранение сообщений

Все сообщения сохраняются с chatId:
```typescript
await chatMessageRepository.addMessage({
  userId,
  chatId,  // Обязательное поле
  role: 'user',
  content: message
});
```

### 3. Загрузка истории

При открытии чата:
```typescript
// Если chatId не указан, берем lastChatId из настроек
const settings = await userSettingsRepository.findByUserId(userId);
const activeChatId = settings?.lastChatId;

// Загружаем сообщения только для этого chatId
const messages = await chatMessageRepository.getMessages({ 
  userId, 
  chatId: activeChatId 
});
```

### 4. "Очистка" истории (Новый чат)

**ВАЖНО**: История НЕ удаляется из БД!

```typescript
// В chatStore.ts
clearHistory: async () => {
  // Просто сбрасываем локальное состояние
  set({ messages: [], chatId: null });
  showAlert.success('Начат новый чат');
}
```

При следующей отправке сообщения автоматически создастся новый `chatId`.

## API изменения

### POST /api/chat/message

**Request**:
```json
{
  "message": "Привет!",
  "chatId": "uuid-string" // Опционально
}
```

**Response**:
```json
{
  "message": {
    "role": "assistant",
    "content": "Привет! Чем могу помочь?"
  },
  "chatId": "uuid-string" // Возвращается всегда
}
```

### GET /api/chat/message

**Query params**:
- `chatId` (optional) - ID конкретного чата
- `limit` (optional) - Количество сообщений (default: 50)

**Response**:
```json
{
  "messages": [...],
  "chatId": "uuid-string" // ID загруженного чата
}
```

### DELETE /api/chat/message

**НЕ ИСПОЛЬЗУЕТСЯ** на фронтенде (можно удалить или оставить для админки)

## Frontend (Store)

### Новые поля состояния:

```typescript
interface ChatStore {
  messages: ChatMessage[];
  chatId: string | null;  // Новое!
  // ...
  
  setChatId: (chatId: string | null) => void;
  createNewChat: () => void;  // Новое!
}
```

### Workflow

1. **Открытие чата**:
   ```typescript
   loadHistory() // Загружает lastChatId из настроек и историю
   ```

2. **Отправка сообщения**:
   ```typescript
   sendMessage(message) 
   // Передает текущий chatId
   // Если chatId = null, сервер создаст новый
   ```

3. **"Очистка" (новый чат)**:
   ```typescript
   clearHistory()
   // Сбрасывает: messages = [], chatId = null
   // БД не трогается!
   ```

## Синхронизация между устройствами

### Как это работает:

1. **Пользователь на устройстве A**:
   - Пишет сообщения
   - `chatId = "abc-123"`
   - Сохраняется в `UserSettings.lastChatId`

2. **Пользователь на устройстве B**:
   - Открывает чат
   - `loadHistory()` запрашивает сервер
   - Сервер возвращает сообщения с `lastChatId = "abc-123"`
   - Пользователь видит ту же переписку!

3. **Начинает новый чат на устройстве B**:
   - `clearHistory()` → `chatId = null`
   - Отправляет сообщение
   - Создается `chatId = "xyz-789"`
   - Обновляется `UserSettings.lastChatId = "xyz-789"`

4. **Открывает на устройстве A**:
   - `loadHistory()` получает новый `lastChatId = "xyz-789"`
   - Видит новую переписку!

## Repository методы

### ChatMessageRepository

```typescript
// Добавить сообщение
addMessage({ userId, chatId, role, content })

// Получить сообщения чата
getMessages({ userId, chatId, limit })

// Удалить чат (НЕ используется на UI)
deleteAllMessages(userId, chatId)

// Получить список всех chatId пользователя
getAllChats(userId)
```

### UserSettingsRepository

```typescript
// Обновить lastChatId
updateLastChatId(userId, chatId)

// Или через upsert
upsert(userId, { lastChatId: chatId })
```

## Будущие улучшения

### 1. UI для управления чатами

Можно добавить:
- Список всех чатов пользователя
- Переключение между чатами
- Удаление старых чатов
- Поиск по чатам

```typescript
// Пример компонента
<ChatList>
  <ChatItem 
    chatId="abc-123" 
    preview="Последнее сообщение..."
    timestamp="2 часа назад"
    onClick={() => loadChat("abc-123")}
  />
  <ChatItem 
    chatId="xyz-789" 
    preview="Привет! Чем могу..."
    timestamp="Вчера"
    isActive
  />
</ChatList>
```

### 2. Метаданные чата

Добавить модель Chat:
```prisma
model Chat {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  chatId    String   @unique
  userId    String   @db.ObjectId
  title     String?  // Авто-генерация из первого сообщения
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("chats")
}
```

### 3. Автоматическое название чата

Генерировать title из первого сообщения:
```typescript
async function generateChatTitle(firstMessage: string): Promise<string> {
  // Обрезать до 50 символов или использовать AI для генерации
  return firstMessage.substring(0, 50) + '...';
}
```

### 4. Экспорт/импорт чатов

```typescript
exportChat(chatId: string): Promise<Blob>
importChat(file: Blob): Promise<string>
```

## Миграция существующих данных

Если в БД уже есть сообщения без `chatId`:

```typescript
// Скрипт миграции
async function migrateOldMessages() {
  const messages = await prisma.chatMessage.findMany({
    where: { chatId: null }
  });
  
  // Группируем по userId
  const grouped = groupBy(messages, 'userId');
  
  for (const [userId, userMessages] of Object.entries(grouped)) {
    const chatId = randomUUID();
    
    await prisma.chatMessage.updateMany({
      where: { 
        userId, 
        chatId: null 
      },
      data: { chatId }
    });
    
    await prisma.userSettings.update({
      where: { userId },
      data: { lastChatId: chatId }
    });
  }
}
```

## Тестирование

### Проверьте:

1. ✅ Первое сообщение создает chatId
2. ✅ chatId сохраняется в UserSettings
3. ✅ Следующие сообщения используют тот же chatId
4. ✅ "Новый чат" сбрасывает UI
5. ✅ История не удаляется из БД
6. ✅ При загрузке подтягивается lastChatId
7. ✅ Синхронизация между вкладками/устройствами

### Тест-кейсы:

```typescript
// 1. Новый чат
await sendMessage("Привет");
expect(chatId).toBeDefined();
expect(userSettings.lastChatId).toBe(chatId);

// 2. Продолжение чата
await sendMessage("Как дела?");
expect(chatId).toBe(previousChatId); // Тот же!

// 3. Новый чат
clearHistory();
expect(chatId).toBeNull();
await sendMessage("Новая тема");
expect(chatId).not.toBe(previousChatId); // Другой!

// 4. БД сохранность
const allMessages = await getMessagesFromDB(userId);
expect(allMessages.length).toBe(3); // Все на месте!
```

## Заключение

Теперь система чата:
- 💾 Сохраняет всю историю в БД
- 🔄 Синхронизируется между устройствами
- 📝 Поддерживает множественные чаты
- 🗑️ "Очистка" не удаляет данные
- 🆕 Легко начать новый чат
- 🚀 Готова к расширению функционала

Все старые переписки остаются в БД и могут быть восстановлены!
