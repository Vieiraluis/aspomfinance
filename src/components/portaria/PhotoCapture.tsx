import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadVisitorPhoto } from '@/hooks/usePortariaData';
import { useAuth } from '@/hooks/useAuth';
import { StorageImage } from '@/components/ui/storage-image';

interface PhotoCaptureProps {
  value?: string;
  onChange: (url?: string) => void;
}

export function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOpen(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCamOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      }, 50);
    } catch {
      toast({
        title: 'Câmera indisponível',
        description: 'Permita o acesso à câmera ou anexe uma imagem do dispositivo.',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async (blob: Blob, ext: string) => {
    if (!user) return;
    setBusy(true);
    try {
      const url = await uploadVisitorPhoto(user.id, blob, ext);
      onChange(url);
      toast({ title: 'Foto salva!' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar foto', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const shoot = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
    );
    stopCamera();
    if (blob) await handleUpload(blob, 'jpg');
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-[4/3] rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center">
        {camOpen ? (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        ) : value ? (
          <StorageImage
            url={value}
            alt="Foto do visitante"
            className="w-full h-full object-cover"
            fallback={<Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          />
        ) : (
          <div className="text-center text-muted-foreground text-sm p-4">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-60" />
            Foto do visitante
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {camOpen ? (
          <>
            <Button type="button" size="sm" onClick={shoot}>
              <Camera className="w-4 h-4 mr-2" /> Capturar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={startCamera}>
              <Camera className="w-4 h-4 mr-2" /> Usar câmera
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Anexar
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
                <X className="w-4 h-4 mr-2" /> Remover
              </Button>
            )}
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (file.size > 20 * 1024 * 1024) {
            toast({ title: 'Arquivo muito grande', description: 'Máximo de 20MB.', variant: 'destructive' });
            return;
          }
          handleUpload(file, file.name.split('.').pop() || 'jpg');
        }}
      />
    </div>
  );
}
