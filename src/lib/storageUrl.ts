import { supabase } from '@/integrations/supabase/client';

const PUBLIC_MARKER = '/storage/v1/object/public/';
const SIGN_MARKER = '/storage/v1/object/sign/';

/**
 * Mantém as URLs guardadas no banco em um formato estável (sem token),
 * a partir do qual conseguimos gerar URLs assinadas sob demanda.
 */
export const normalizeStorageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);

    if (!parsed.pathname.includes(SIGN_MARKER)) {
      return `${parsed.origin}${parsed.pathname}`;
    }

    const normalizedPath = parsed.pathname.replace(SIGN_MARKER, PUBLIC_MARKER);

    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return url;
  }
};

export const parseStorageUrl = (
  url?: string | null
): { bucket: string; path: string } | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = parsed.pathname.includes(PUBLIC_MARKER)
      ? PUBLIC_MARKER
      : parsed.pathname.includes(SIGN_MARKER)
        ? SIGN_MARKER
        : null;
    if (!marker) return null;

    const rest = parsed.pathname.split(marker)[1];
    if (!rest) return null;

    const [bucket, ...segments] = rest.split('/');
    if (!bucket || segments.length === 0) return null;

    return { bucket, path: segments.map(decodeURIComponent).join('/') };
  } catch {
    return null;
  }
};

/**
 * Os buckets são privados: gera uma URL assinada temporária para exibir/baixar
 * o arquivo. URLs externas (não Supabase) são devolvidas como estão.
 */
export const getSignedStorageUrl = async (
  url?: string | null,
  expiresIn = 60 * 60
): Promise<string | undefined> => {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const parsed = parseStorageUrl(url);
  if (!parsed) return url;

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, expiresIn);

  if (error || !data?.signedUrl) return undefined;
  return data.signedUrl;
};

/** Abre o arquivo do storage em uma nova aba usando URL assinada. */
export const openStorageUrl = async (url?: string | null) => {
  const signed = await getSignedStorageUrl(url);
  if (signed) window.open(signed, '_blank', 'noopener,noreferrer');
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
