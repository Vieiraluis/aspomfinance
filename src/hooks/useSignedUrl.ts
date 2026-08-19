import { useEffect, useState } from 'react';
import { getSignedStorageUrl } from '@/lib/storageUrl';

/**
 * Resolve uma URL de arquivo do storage (bucket privado) para uma URL assinada
 * temporária, apta a ser usada em <img src> ou links.
 */
export const useSignedUrl = (url?: string | null): string | undefined => {
  const [signed, setSigned] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (!url) {
      setSigned(undefined);
      return;
    }
    getSignedStorageUrl(url).then((result) => {
      if (active) setSigned(result);
    });
    return () => {
      active = false;
    };
  }, [url]);

  return signed;
};
