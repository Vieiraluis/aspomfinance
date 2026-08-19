import { useSignedUrl } from '@/hooks/useSignedUrl';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  url?: string | null;
  fallback?: React.ReactNode;
}

/** <img> para arquivos em buckets privados: resolve a URL assinada antes de exibir. */
export const StorageImage = ({ url, fallback = null, alt = '', ...props }: StorageImageProps) => {
  const signed = useSignedUrl(url);
  if (!signed) return <>{fallback}</>;
  return <img src={signed} alt={alt} {...props} />;
};

import { AvatarImage } from '@/components/ui/avatar';

interface StorageAvatarImageProps {
  url?: string | null;
  alt?: string;
}

/** <AvatarImage> para arquivos em buckets privados. */
export const StorageAvatarImage = ({ url, alt }: StorageAvatarImageProps) => {
  const signed = useSignedUrl(url);
  return <AvatarImage src={signed} alt={alt} />;
};
