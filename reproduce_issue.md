# Issue Reproduction

## Problem Description
When loading new exercises, the entire page reloads and old data is reset instead of preserving existing exercises.

## Current Problematic Behavior
1. User selects a topic -> exercises are loaded (this works correctly)
2. User clicks "Больше упражнений" -> new exercises are appended correctly (this works)
3. User clicks "Выбрать другую тему" and selects a new topic -> ALL previous exercises are lost

## Root Cause
In App.tsx line 104:
```typescript
setExerciseBlocks([newBlock]);
```

This line replaces ALL existing exercise blocks with only the new block, instead of appending to existing blocks.

## Expected Behavior
When selecting a new topic, the new exercises should be appended to existing exercises, not replace them.

## Solution
Change line 104 from:
```typescript
setExerciseBlocks([newBlock]);
```

To:
```typescript
setExerciseBlocks(prevBlocks => [...prevBlocks, newBlock]);
```

This matches the pattern used in generateMoreExercises() at line 147.
