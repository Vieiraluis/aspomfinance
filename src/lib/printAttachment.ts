import { isPdfFileUrl, normalizeStorageUrl } from '@/lib/storageUrl';

/**
 * Abre o anexo (boleto ou comprovante) em uma janela e dispara a impressão.
 * PDFs são abertos em nova aba (impressão pelo visualizador nativo);
 * imagens são renderizadas em uma página A4 e impressas automaticamente.
 */
export const printAttachment = (url?: string | null, title = 'Anexo') => {
  const finalUrl = normalizeStorageUrl(url);
  if (!finalUrl) return;

  if (isPdfFileUrl(finalUrl)) {
    const win = window.open(finalUrl, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        try {
          win.focus();
          win.print();
        } catch {
          /* visualizador nativo cuida da impressão */
        }
      });
    }
    return;
  }

  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) return;

  win.document.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      body { margin: 0; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
    </style>
  </head>
  <body>
    <img src="${finalUrl}" alt="${title}" onload="window.focus();window.print();" />
  </body>
</html>`);
  win.document.close();
};
