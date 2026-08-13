/**
 * Russian names of the learning languages, in the cases the UI needs.
 *
 * Four places used to carry their own table: the header ("изучение
 * английского"), the chat prompt ("английский язык"), the essay header ("на
 * английском языке") and the import dialog ("Английский"). They are here now so
 * a new language is added once.
 */

export type LanguageCase = 'nominative' | 'genitive' | 'prepositional';

type Forms = Record<LanguageCase, string>;

export const LANGUAGE_FORMS: Record<string, Forms> = {
  en: { nominative: 'английский', genitive: 'английского', prepositional: 'английском' },
  pl: { nominative: 'польский', genitive: 'польского', prepositional: 'польском' },
  de: { nominative: 'немецкий', genitive: 'немецкого', prepositional: 'немецком' },
  fr: { nominative: 'французский', genitive: 'французского', prepositional: 'французском' },
  es: { nominative: 'испанский', genitive: 'испанского', prepositional: 'испанском' },
  it: { nominative: 'итальянский', genitive: 'итальянского', prepositional: 'итальянском' }
};

export const DEFAULT_LANGUAGE_CODE = 'en';

/** The requested form, or the code itself when the language is unknown. */
export function languageForm(code: string, form: LanguageCase): string {
  return LANGUAGE_FORMS[code]?.[form] ?? code;
}

/** Capitalised nominative, for standalone labels rather than sentences. */
export function languageLabel(code: string): string {
  const name = LANGUAGE_FORMS[code]?.nominative;
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : code.toUpperCase();
}
