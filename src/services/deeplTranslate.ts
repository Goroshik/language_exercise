// NOTE: DeepL Translation API service for translating words from English to Russian
export interface TranslationResponse {
  text: string;
  error?: string;
}

export class DeepLTranslateService {
  private static readonly API_KEY = process.env.REACT_APP_DEEPL_TRANSLATE_API_KEY;

  // NOTE: Alternative CORS-enabled translation API for browser usage
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

    // NOTE: Skip DeepL API in browser due to CORS restrictions, use LibreTranslate directly
    // NOTE: DeepL API doesn't support CORS from browser environments
    console.log('Using LibreTranslate API for browser compatibility');

    // NOTE: Use LibreTranslate API (CORS-enabled for browser usage)
    try {
      const libreResponse = await fetch(this.LIBRE_TRANSLATE_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DeepL-Auth-Key ${this.API_KEY}`
        },
        body: JSON.stringify({
          text: [text],
          target_lang: targetLang
        })
      });

      if (!libreResponse.ok) {
        throw new Error(
          `LibreTranslate API error: ${libreResponse.status} ${libreResponse.statusText}`
        );
      }

      const libreData = await libreResponse.json();

      if (libreData.translatedText) {
        return { text: libreData.translatedText };
      } else {
        return { text: '', error: 'No translation received from LibreTranslate API' };
      }
    } catch (error) {
      console.error('Translation API Error:', error);

      // NOTE: Enhanced error handling for CORS and network issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          text: '',
          error: 'Network error or CORS issue. Please check your internet connection.'
        };
      }

      return {
        text: '',
        error: error instanceof Error ? error.message : 'Unknown translation error occurred'
      };
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
}

export default DeepLTranslateService;
