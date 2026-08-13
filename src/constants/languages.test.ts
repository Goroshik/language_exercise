import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LANGUAGE_CODE,
  LANGUAGE_FORMS,
  type LanguageCase,
  languageForm,
  languageLabel
} from './languages';

const CODES = Object.keys(LANGUAGE_FORMS);
const CASES: LanguageCase[] = ['nominative', 'genitive', 'prepositional'];

describe('LANGUAGE_FORMS', () => {
  it('covers the six languages the app offers', () => {
    expect(CODES).toEqual(['en', 'pl', 'de', 'fr', 'es', 'it']);
  });

  it.each(CODES)('gives %s all three cases', code => {
    for (const form of CASES) {
      expect(LANGUAGE_FORMS[code]?.[form]).toBeTruthy();
    }
  });

  it('includes the default language', () => {
    expect(LANGUAGE_FORMS[DEFAULT_LANGUAGE_CODE]).toBeDefined();
  });

  it('distinguishes the cases from each other', () => {
    expect(new Set(CASES.map(form => languageForm('en', form))).size).toBe(3);
  });
});

describe('languageForm', () => {
  it.each([
    ['en', 'nominative', 'английский'],
    ['en', 'genitive', 'английского'],
    ['en', 'prepositional', 'английском'],
    ['pl', 'genitive', 'польского'],
    ['de', 'prepositional', 'немецком']
  ] as Array<[string, LanguageCase, string]>)('renders %s in the %s', (code, form, expected) => {
    expect(languageForm(code, form)).toBe(expected);
  });

  it('falls back to the code for an unknown language', () => {
    expect(languageForm('zz', 'nominative')).toBe('zz');
  });

  it('falls back for an empty code', () => {
    expect(languageForm('', 'genitive')).toBe('');
  });
});

describe('languageLabel', () => {
  it('capitalises the nominative', () => {
    expect(languageLabel('pl')).toBe('Польский');
  });

  it.each(CODES)('capitalises %s', code => {
    const label = languageLabel(code);
    expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());
  });

  it('upper-cases the code itself when the language is unknown', () => {
    expect(languageLabel('zz')).toBe('ZZ');
  });

  it('does not shout the rest of the name', () => {
    expect(languageLabel('en')).toBe('Английский');
  });
});
