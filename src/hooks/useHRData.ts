import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { normalizeStorageUrl } from '@/lib/storageUrl';

// ============== EMPLOYEES ==============
...
// ============== FILE UPLOAD ==============
export const useUploadHRFile = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      if (!user) throw new Error('Not authenticated');

      const maxSize = 20 * 1024 * 1024;
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');

      if (!isValidType) {
        throw new Error('Formato inválido. Envie PDF ou imagem.');
      }

      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. O limite é 20MB.');
      }

      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('hr-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(fileName);

      return normalizeStorageUrl(urlData?.publicUrl) || '';
    },
  });
};
