export const normalizeStorageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);

    if (!parsed.pathname.includes('/storage/v1/object/sign/')) {
      return url;
    }

    const normalizedPath = parsed.pathname.replace(
      '/storage/v1/object/sign/',
      '/storage/v1/object/public/'
    );

    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return url;
  }
};

export const isPdfFileUrl = (url: string): boolean => {
  if (url.startsWith('data:application/pdf')) return true;

  try {
    const parsed = new URL(url);
    return /\.pdf$/i.test(parsed.pathname);
  } catch {
    return /\.pdf($|\?)/i.test(url);
  }
};
