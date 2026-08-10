import { describe, expect, it } from 'vitest';
import { getLevelsService } from './levelService';

describe('getLevelsService', () => {
  it('returns the six CEFR levels', async () => {
    await expect(getLevelsService()).resolves.toHaveLength(6);
  });

  it('lists them from A1 up to C2', async () => {
    const levels = await getLevelsService();
    expect(levels.map(level => level.value)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('labels every level with its code', async () => {
    const levels = await getLevelsService();
    for (const level of levels) {
      expect(level.label.startsWith(level.value)).toBe(true);
    }
  });

  it('gives every level a non-empty label', async () => {
    const levels = await getLevelsService();
    expect(levels.every(level => level.label.length > level.value.length)).toBe(true);
  });
});
