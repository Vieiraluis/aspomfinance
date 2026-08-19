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
