# Alert System Documentation

## Overview

This project uses a global alert system built with Zustand and MUI components. The system allows displaying error, success, warning, and info messages from anywhere in the application.

## Usage

### Basic Usage

Import the `showAlert` utility in any file:

```typescript
import { showAlert } from 'src/utils/alert';
```

### Show Alerts

```typescript
// Error alert (red)
showAlert.error('Something went wrong!');

// Success alert (green)
showAlert.success('Operation completed successfully!');

// Warning alert (orange)
showAlert.warning('Please check your input');

// Info alert (blue)
showAlert.info('Processing your request...');
```

### Features

- **Multiple Alerts**: Multiple alerts can be displayed simultaneously and will stack vertically
- **Auto-dismiss**: Each alert automatically dismisses after 6 seconds
- **Manual Dismiss**: Users can manually close alerts using the X button
- **Global Access**: Can be called from any component, service, or utility function
- **Position**: Alerts appear in the bottom-right corner of the screen

### Architecture

1. **Alert Store** (`src/store/alertStore.ts`): Zustand store managing alert state
2. **Alert Provider** (`src/components/AlertProvider.tsx`): React component rendering alerts
3. **Alert Utility** (`src/utils/alert.ts`): Helper functions for triggering alerts
4. **Root Layout**: AlertProvider is integrated in `src/app/layout.tsx`

### Migration from console.log/console.error

All `console.error` and `console.log` calls (outside API routes) have been replaced with appropriate alert calls:

- `console.error(...)` → `showAlert.error(...)`
- `console.log(...)` (for success messages) → `showAlert.success(...)`
- `console.log(...)` (for info messages) → `showAlert.info(...)`

## Example

```typescript
try {
  const result = await someAsyncOperation();
  showAlert.success('Data saved successfully!');
} catch (error) {
  showAlert.error('Failed to save data');
}
```
