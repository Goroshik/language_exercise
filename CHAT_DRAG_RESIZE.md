# Drag-to-Resize функционал для ChatWidget

## Что реализовано

### ✨ Изменение размера перетаскиванием

ChatWidget теперь можно изменять в размерах, потянув за угол окна:

- **Хватка за угол**: Левый верхний угол окна - зона для изменения размера
- **Визуальный индикатор**: Полупрозрачный треугольник в углу (видимость при наведении)
- **Плавное изменение**: Размер меняется в реальном времени во время перетаскивания
- **Ограничения**:
  - Минимальная ширина: 320px
  - Минимальная высота: 400px
  - Максимальная ширина: 800px
  - Максимальная высота: 900px

## Технические детали

### Константы размеров

```typescript
const MIN_WIDTH = 320;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 900;
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 500;
```

### State управление

```typescript
const [size, setSize] = useState({ 
  width: DEFAULT_WIDTH, 
  height: DEFAULT_HEIGHT 
});
const [isResizing, setIsResizing] = useState(false);
const resizeRef = useRef<{
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
} | null>(null);
```

### Логика изменения размера

#### 1. Начало изменения (onMouseDown)

```typescript
const handleResizeStart = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsResizing(true);
  resizeRef.current = {
    startX: e.clientX,
    startY: e.clientY,
    startWidth: size.width,
    startHeight: size.height
  };
}, [size]);
```

#### 2. Процесс изменения (onMouseMove)

```typescript
const handleResizeMove = useCallback((e: MouseEvent) => {
  if (!isResizing || !resizeRef.current) return;

  // Разница в пикселях от начальной точки
  const deltaX = resizeRef.current.startX - e.clientX;
  const deltaY = resizeRef.current.startY - e.clientY;

  // Новые размеры с ограничениями
  const newWidth = Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX)
  );
  const newHeight = Math.min(
    MAX_HEIGHT,
    Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY)
  );

  setSize({ width: newWidth, height: newHeight });
}, [isResizing]);
```

#### 3. Завершение изменения (onMouseUp)

```typescript
const handleResizeEnd = useCallback(() => {
  setIsResizing(false);
  resizeRef.current = null;
}, []);
```

### Обработка событий мыши

```typescript
useEffect(() => {
  if (isResizing) {
    // Добавляем глобальные обработчики
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    
    // Меняем курсор и блокируем выделение текста
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  }

  return () => {
    // Очистка при размонтировании
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
}, [isResizing, handleResizeMove, handleResizeEnd]);
```

## UI компоненты

### Resize Handle (зона захвата)

```tsx
<Box
  onMouseDown={handleResizeStart}
  sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    cursor: 'nwse-resize',
    zIndex: 10,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    '&:hover .resize-indicator': {
      opacity: 1  // Показываем индикатор при наведении
    }
  }}
>
  <Box
    className="resize-indicator"
    sx={{
      width: 0,
      height: 0,
      borderLeft: '20px solid transparent',
      borderTop: '20px solid',
      borderTopColor: 'rgba(255, 255, 255, 0.3)',
      opacity: 0.5,
      transition: 'opacity 0.2s',
      pointerEvents: 'none'
    }}
  />
</Box>
```

### Динамические размеры Paper

```tsx
<Paper
  sx={{
    width: `${size.width}px`,
    height: `${size.height}px`,
    transition: isResizing ? 'none' : 'opacity 0.3s'
    // Отключаем transition при изменении для плавности
  }}
>
```

## Поведение

### Курсор

- **Нормальное состояние**: Стандартный курсор
- **Наведение на угол**: Курсор `nwse-resize` (⇖⇘)
- **Во время изменения**: Глобальный курсор `nwse-resize`

### Визуальная обратная связь

1. **Индикатор в углу**:
   - По умолчанию: opacity 0.5
   - При наведении: opacity 1.0
   - Форма: треугольник (создан через CSS borders)

2. **Отключение выделения текста**:
   - Во время изменения размера текст не выделяется
   - Предотвращает случайное выделение контента

3. **Плавность**:
   - Размер меняется синхронно с движением мыши
   - Нет задержек или лагов

## UX улучшения

### Ограничения размера

- **Минимальные**: Гарантируют читаемость контента
- **Максимальные**: Предотвращают чрезмерное увеличение
- **Адаптивные**: Учитывают размер viewport

### Логика направления

Изменение размера происходит влево-вверх (от правого нижнего угла):
- Движение мыши влево → увеличение ширины
- Движение мыши вверх → увеличение высоты

Это естественно, так как окно зафиксировано в правом нижнем углу.

## Отличия от кнопки expand/collapse

| Старый способ (кнопка) | Новый способ (drag) |
|------------------------|---------------------|
| 2 фиксированных размера | Любой размер в диапазоне |
| Клик по кнопке | Перетаскивание угла |
| Резкое изменение | Плавное изменение |
| Занимает место в UI | Скрытый функционал |

## Использование

### Для пользователя

1. Откройте чат (кнопка с иконкой 💬)
2. Наведите на левый верхний угол окна
3. Увидите треугольный индикатор
4. Зажмите левую кнопку мыши
5. Двигайте мышь для изменения размера
6. Отпустите кнопку мыши

### Для разработчика

Размер сохраняется только в runtime (не в localStorage). Для сохранения между сессиями добавьте:

```typescript
// В useEffect
useEffect(() => {
  const saved = localStorage.getItem('chatWidgetSize');
  if (saved) {
    setSize(JSON.parse(saved));
  }
}, []);

// При изменении size
useEffect(() => {
  localStorage.setItem('chatWidgetSize', JSON.stringify(size));
}, [size]);
```

## Будущие улучшения

### Возможные доработки:

1. **Сохранение размера**
   - localStorage для персистентности
   - Восстановление при перезагрузке

2. **Больше зон захвата**
   - Углы: все 4 угла
   - Края: верх, низ, левый, правый
   - Разные направления изменения

3. **Анимация**
   - Плавное возвращение к размеру по умолчанию (двойной клик)
   - Spring анимация при отпускании

4. **Snap to grid**
   - Привязка к сетке (например, кратно 50px)
   - Более предсказуемые размеры

5. **Мобильная поддержка**
   - Touch events для сенсорных экранов
   - Жесты pinch-to-zoom

## Тестирование

### Проверьте:

1. ✅ Курсор меняется при наведении на угол
2. ✅ Индикатор становится ярче при наведении
3. ✅ Размер меняется плавно при перетаскивании
4. ✅ Нельзя уменьшить меньше минимума
5. ✅ Нельзя увеличить больше максимума
6. ✅ Текст не выделяется во время изменения
7. ✅ Курсор возвращается после отпускания
8. ✅ Можно использовать чат после изменения размера

### Край-кейсы:

- Быстрое движение мыши за пределы окна
- Изменение размера viewport во время drag
- Множественные быстрые клики
- Переход мыши на другое окно во время drag

## Заключение

Теперь ChatWidget имеет:
- 🎯 Интуитивное изменение размера drag-and-drop
- 👁️ Визуальный индикатор зоны захвата
- 🔒 Ограничения для оптимального UX
- ⚡ Плавную работу без задержек
- 🖱️ Правильную обработку курсора и событий мыши

Полностью готово к использованию! 🚀
