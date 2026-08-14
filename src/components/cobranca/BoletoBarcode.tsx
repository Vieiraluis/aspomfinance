import { barsInterleaved2of5 } from '@/lib/boletoItau';

interface Props {
  code: string;
  height?: number;
  thin?: number;
}

export function BoletoBarcode({ code, height = 50, thin = 1.4 }: Props) {
  const bars = barsInterleaved2of5(code);
  let x = 0;
  const rects = bars.map((b, i) => {
    const w = b.width * thin;
    const rect = b.black ? <rect key={i} x={x} y={0} width={w} height={height} fill="#000" /> : null;
    x += w;
    return rect;
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" role="img" aria-label="Código de barras do boleto">
      {rects}
    </svg>
  );
}
