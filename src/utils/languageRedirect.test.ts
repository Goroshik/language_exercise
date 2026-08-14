import { describe, expect, it } from 'vitest';
import { resolveLanguageSwitchRedirect } from './languageRedirect';

describe('resolveLanguageSwitchRedirect', () => {
  it('stays put when not on an exercises page', () => {
    expect(resolveLanguageSwitchRedirect('/dictionary', 'Past Simple')).toBeNull();
  });

  it('stays put when the pathname is unknown', () => {
    expect(resolveLanguageSwitchRedirect(null, 'Past Simple')).toBeNull();
  });

  it('never redirects away from the history page', () => {
    expect(resolveLanguageSwitchRedirect('/exercises/generated-history', 'Past Simple')).toBeNull();
  });

  it('falls back to the topic list when the new language has no saved topic', () => {
    expect(resolveLanguageSwitchRedirect('/exercises/past_simple', null)).toBe('/topics');
  });

  it('redirects to the topic saved for the new language', () => {
    expect(resolveLanguageSwitchRedirect('/exercises/past_simple', 'Present Perfect')).toBe(
      '/exercises/present_perfect'
    );
  });

  it('stays put when the saved topic is the current one', () => {
    expect(resolveLanguageSwitchRedirect('/exercises/past_simple', 'Past Simple')).toBeNull();
  });

  it('slugifies multi-word topics', () => {
    expect(resolveLanguageSwitchRedirect('/exercises/x', 'Present Perfect Continuous')).toBe(
      '/exercises/present_perfect_continuous'
    );
  });
});
