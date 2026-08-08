// NOTE: DeepL Translation API service for translating words from English to Russian
export interface TranslationResponse {
  text: string;
  error?: string;
}

export class DeepLTranslateService {
  private static readonly LIBRE_TRANSLATE_URL = 'https://api-free.deepl.com/v2/translate';

  /**
   * Translate text from English to Russian using browser-compatible APIs
   * @param text - The text to translate
   * @param targetLang - Target language code (default: 'RU' for Russian)
   * @param sourceLang - Source language code (default: 'EN' for English)
   * @returns Promise with translated text or error
   */
  static async translateText(
    text: string,
    targetLang: string = 'RU',
    sourceLang: string = 'EN'
  ): Promise<TranslationResponse> {
    if (!text.trim()) {
      return { text: '', error: 'Empty text provided for translation' };
    }

    const apiKey = await this.getDeepLToken();
    if (!apiKey) {
      return { text: '', error: 'Токен DeepL не найден' };
    }

    // NOTE: Skip DeepL API in browser due to CORS restrictions, use LibreTranslate directly
    // NOTE: DeepL API doesn't support CORS from browser environments

    // NOTE: Use LibreTranslate API (CORS-enabled for browser usage)
    try {
      const libreResponse = await fetch(this.LIBRE_TRANSLATE_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DeepL-Auth-Key ${apiKey}`
        },
        body: JSON.stringify({
          text,
          target_lang: targetLang,
          source_lang: sourceLang
        })
      });
      const data = await libreResponse.json();
      if (data.translations && data.translations[0]?.text) {
        return { text: data.translations[0].text };
      }
      return { text: '', error: data.message || 'Ошибка перевода' };
      // TODO: Fix types - use proper Error type instead of any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return { text: '', error: error?.message || 'Ошибка при переводе' };
    }
  }

  /**
   * Batch translate multiple texts
   * @param texts - Array of texts to translate
   * @param targetLang - Target language code (default: 'RU' for Russian)
   * @param sourceLang - Source language code (default: 'EN' for English)
   * @returns Promise with array of translated texts
   */
  static async translateBatch(
    texts: string[],
    targetLang: string = 'RU',
    sourceLang: string = 'EN'
  ): Promise<TranslationResponse[]> {
    // NOTE: For batch translation, translate each text individually using the fallback mechanism
    const results: TranslationResponse[] = [];

    for (const text of texts) {
      const result = await this.translateText(text, targetLang, sourceLang);
      results.push(result);
    }

    return results;
  }

  private static async getDeepLToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/tokens');
      if (!response.ok) return null;
      const tokens = await response.json();
      // TODO: Fix types - create proper Token interface instead of using any
      const deeplTokenObj = Array.isArray(tokens)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tokens.find((t: any) => t.service === 'deepl')
        : null;
      return deeplTokenObj?.token || null;
    } catch {
      return null;
    }
  }
}

export default DeepLTranslateService;
