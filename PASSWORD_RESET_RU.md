# Реализация Сброса Пароля через Email

## Что было реализовано

В соответствии с задачей "Нужно сделать отправку имейла на сброс пароля" была реализована полная система сброса пароля с отправкой email.

## Основные возможности

### Для пользователей:
1. **Запрос сброса пароля**: Пользователь вводит email на странице `/auth/reset`
2. **Получение письма**: На email приходит письмо со ссылкой для сброса
3. **Установка нового пароля**: По ссылке пользователь вводит новый пароль
4. **Вход**: После сброса пользователь входит с новым паролем

### Безопасность:
- ✅ Токены действительны только 1 час
- ✅ Каждый токен можно использовать только один раз
- ✅ Защита от перебора пользователей (одинаковый ответ для существующих и несуществующих email)
- ✅ Безопасная генерация токенов (32 байта случайных данных)
- ✅ Хеширование паролей с bcrypt
- ✅ Проверка кода на уязвимости: 0 найдено

## Настройка

### 1. Настройка Email

Добавьте в файл `.env` следующие переменные:

```env
# Настройки SMTP сервера
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Настройка Gmail (для продакшена)

1. Включите двухфакторную аутентификацию в Google аккаунте
2. Создайте пароль приложения: https://myaccount.google.com/apppasswords
3. Используйте этот пароль в `EMAIL_PASSWORD`

### 3. Настройка Mailtrap (для тестирования)

1. Зарегистрируйтесь на https://mailtrap.io (бесплатно)
2. Получите SMTP credentials в настройках inbox
3. Настройте в `.env`:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM=noreply@example.com
```

Все письма будут перехватываться Mailtrap и не отправляться на реальные адреса.

### 4. База данных

После обновления кода необходимо применить миграцию Prisma:

```bash
npx prisma generate
# Затем при необходимости:
npx prisma db push
```

Это создаст новую коллекцию `password_reset_tokens` в MongoDB.

## Использование

### Для пользователей:

1. **Запрос сброса**:
   - Зайти на `/auth/login`
   - Нажать "Забыли пароль?"
   - Ввести email
   - Проверить почту (включая папку спам)

2. **Сброс пароля**:
   - Открыть письмо и перейти по ссылке
   - Ввести новый пароль (минимум 6 символов)
   - Подтвердить пароль
   - Нажать "Сбросить пароль"
   - Войти с новым паролем

### Для разработчиков:

**API Endpoints:**

```bash
# Запрос сброса пароля
POST /api/auth/request-reset
Body: { "email": "user@example.com" }

# Проверка токена
GET /api/auth/verify-token?token=<token>

# Сброс пароля
POST /api/auth/reset-password
Body: { "token": "<token>", "newPassword": "newpass123" }
```

## Файлы

### Новые файлы:
- `src/repository/PasswordResetTokenRepository.ts` - работа с токенами в БД
- `src/services/emailService.ts` - отправка email через nodemailer
- `src/services/passwordResetService.ts` - бизнес-логика сброса пароля
- `src/app/api/auth/request-reset/route.ts` - API для запроса сброса
- `src/app/api/auth/reset-password/route.ts` - API для сброса пароля
- `src/app/api/auth/verify-token/route.ts` - API для проверки токена
- `PASSWORD_RESET.md` - документация на английском
- `PASSWORD_RESET_TESTING.md` - руководство по тестированию

### Измененные файлы:
- `prisma/schema.prisma` - добавлена модель PasswordResetToken
- `src/app/auth/reset/page.tsx` - обновленный интерфейс сброса
- `src/repository/UserRepository.ts` - добавлен метод обновления пароля
- `src/repository/client.ts` - экспорт нового репозитория
- `.env.example` - примеры настроек email
- `package.json` - добавлен nodemailer

## Тестирование

### Быстрый тест:

1. Запустите приложение: `npm run dev`
2. Перейдите на `/auth/reset`
3. Введите существующий email
4. Проверьте консоль сервера или Mailtrap inbox
5. Скопируйте токен из URL или письма
6. Перейдите по ссылке сброса
7. Установите новый пароль
8. Войдите с новым паролем

### Подробное руководство:

См. файл `PASSWORD_RESET_TESTING.md`

## Проверки качества

✅ **Сборка**: Успешно (`npm run build`)  
✅ **Линтинг**: Без ошибок (`npm run lint`)  
✅ **TypeScript**: Без ошибок типов  
✅ **CodeQL**: 0 уязвимостей безопасности  

## Возможные улучшения в будущем

- Rate limiting для защиты от спама
- reCAPTCHA для защиты от ботов
- Автоматическая очистка истекших токенов (cron job)
- Многоязычные шаблоны email
- Улучшенный дизайн email писем
- Уведомления о смене пароля

## Поддержка

Если возникли проблемы:

1. Проверьте настройки email в `.env`
2. Проверьте логи сервера на наличие ошибок
3. Убедитесь, что MongoDB запущена
4. Проверьте, что Prisma client обновлен (`npx prisma generate`)
5. См. раздел "Common Issues" в `PASSWORD_RESET_TESTING.md`

## Заключение

Система полностью готова к использованию. Для продакшена рекомендуется:
- Использовать надежный SMTP сервис (SendGrid, AWS SES, Mailgun)
- Включить HTTPS
- Добавить rate limiting
- Настроить мониторинг отправки писем
- Добавить алерты на ошибки отправки
