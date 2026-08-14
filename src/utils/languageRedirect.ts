/**
 * Where to send the user after the learning language changed.
 * Returns null when the current page should be left alone.
 */
export function resolveLanguageSwitchRedirect(
  pathname: string | null,
  newTopic: string | null
): string | null {
  if (!pathname?.startsWith('/exercises/')) return null;

  const currentPath = pathname.split('/').pop();
  // The history page is language-agnostic, never redirect away from it.
  if (currentPath === 'generated-history') return null;

  // No saved topic for the new language - fall back to the topic list.
  if (!newTopic) return '/topics';

  const newPath = newTopic.toLowerCase().replace(/ /g, '_');
  return currentPath === newPath ? null : `/exercises/${newPath}`;
}
