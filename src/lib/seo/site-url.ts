export function resolvePublicSiteUrl(
  value: string | undefined,
  fallback?: string,
): URL {
  const candidate = value?.trim() || fallback;
  if (!candidate) {
    throw new Error(
      'PUBLIC_SITE_URL must be set to the canonical production origin.',
    );
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('PUBLIC_SITE_URL must be a valid absolute URL.');
  }

  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) {
    throw new Error(
      'PUBLIC_SITE_URL must use HTTPS (HTTP is allowed only for a loopback origin).',
    );
  }
  if (url.username || url.password) {
    throw new Error('PUBLIC_SITE_URL must not include credentials.');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      'PUBLIC_SITE_URL must contain only an origin, without a path, query, or fragment.',
    );
  }

  return new URL(url.origin);
}
