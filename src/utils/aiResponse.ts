/**
 * AI providers are inconsistent: some return a bare string, some an object with
 * a `text` field. Normalising here keeps every caller off `any`.
 */
export function extractResponseText(rawResult: unknown): string {
  if (typeof rawResult === 'string') return rawResult;
  if (rawResult && typeof rawResult === 'object') {
    return (rawResult as { text?: string }).text ?? '';
  }
  return '';
}

/** True when the provider rejected because the user has no token configured. */
export function isMissingTokenError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('No token found');
}
