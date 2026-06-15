export function normalizeProjectUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function isValidProjectUrl(url: string): boolean {
  const normalized = normalizeProjectUrl(url);
  if (!normalized) return true;

  try {
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}
