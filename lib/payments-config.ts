/**
 * Client-safe payment flags. Only NEXT_PUBLIC_* values are read here, so this
 * file never exposes secrets and can be imported from client components.
 */

/**
 * When true, the UI runs a clearly-labelled demo checkout without calling the
 * server. Used for the GitHub Pages static export, where no API routes exist.
 */
export const PAYMENTS_DEMO = process.env.NEXT_PUBLIC_PAYMENTS_DEMO === 'true';

/** Base path the app is served from ('' locally, '/Hashtagger' on GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Prefixes an absolute app path (e.g. '/api/stripe/checkout') with the base path. */
export function apiUrl(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Shared email rule so the paywall form and the checkout route agree. */
export const MAX_EMAIL_LENGTH = 254;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(trimmed);
}
