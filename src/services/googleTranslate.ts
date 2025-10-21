// NOTE: Google Translate API service for translating words from English to Russian
import { showAlert } from 'src/utils/alert';

export interface TranslationResponse {
  text: string;
  error?: string;
}

export class GoogleTranslateService {
  private static readonly API_KEY = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
  private static readonly API_URL = 'https://translation.googleapis.com/language/translate/v2';

  /**
   * Translate text from English to Russian using Google Translate API
   * @param text - The text to translate
   * @param targetLang - Target language code (default: 'ru' for Russian)
   * @param sourceLang - Source language code (default: 'en' for English)
   * @returns Promise with translated text or error
   */
  static async translateText(
    text: string,
    targetLang: string = 'ru',
    sourceLang: string = 'en'
  ): Promise<TranslationResponse> {
    try {
      if (!this.API_KEY) {
        return {
          text: '',
          error: 'Google Translate API key not found in environment variables'
        };
      }

      if (!text.trim()) {
        return { text: '', error: 'Empty text provided for translation' };
      }

      const url = `${this.API_URL}?key=${this.API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Google Translate API error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();

      if (data.data?.translations?.length > 0) {
        const translatedText = data.data.translations[0].translatedText;
        return { text: translatedText };
      } else {
        return { text: '', error: 'No translation received from Google Translate API' };
      }
    } catch (error) {
      showAlert.error('Google Translate API Error', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Unknown translation error occurred'
      };
    }
  }

  /**
   * Batch translate multiple texts
   * @param texts - Array of texts to translate
   * @param targetLang - Target language code (default: 'ru' for Russian)
   * @param sourceLang - Source language code (default: 'en' for English)
   * @returns Promise with array of translated texts
   */
  static async translateBatch(
    texts: string[],
    targetLang: string = 'ru',
    sourceLang: string = 'en'
  ): Promise<TranslationResponse[]> {
    try {
      if (!this.API_KEY) {
        const errorResponse = {
          text: '',
          error: 'Google Translate API key not found in environment variables'
        };
        return texts.map(() => errorResponse);
      }

      const validTexts = texts.filter(text => text.trim());
      if (validTexts.length === 0) {
        return texts.map(() => ({ text: '', error: 'Empty text provided' }));
      }

      const url = `${this.API_URL}?key=${this.API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: validTexts,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `Google Translate API error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`;
        return texts.map(() => ({ text: '', error: errorMessage }));
      }

      const data = await response.json();

      if (data.data?.translations) {
        return data.data.translations.map((translation: any) => ({
          text: translation.translatedText || ''
        }));
      } else {
        return texts.map(() => ({
          text: '',
          error: 'No translations received from Google Translate API'
        }));
      }
    } catch (error) {
      showAlert.error('Google Translate API Batch Error', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown translation error occurred';
      return texts.map(() => ({ text: '', error: errorMessage }));
    }
  }
}

export default GoogleTranslateService;
