import { describe, expect, it } from 'vitest';
import topics_eng from 'src/constants/topics_eng';
import topics_pl from 'src/constants/topics_pl';
import { getTopicsService } from './topicsService';

describe('getTopicsService', () => {
  it('returns the Polish topics for pl', () => {
    expect(getTopicsService('pl')).toBe(topics_pl);
  });

  it('returns the English topics for en', () => {
    expect(getTopicsService('en')).toBe(topics_eng);
  });

  it('defaults to English when no language is given', () => {
    expect(getTopicsService()).toBe(topics_eng);
  });

  it('falls back to English for an unsupported language', () => {
    expect(getTopicsService('de')).toBe(topics_eng);
  });

  it('keeps the two topic sets distinct', () => {
    expect(topics_pl).not.toBe(topics_eng);
  });
});
