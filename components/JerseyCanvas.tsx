import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage } from 'react-konva';
import { useHtmlImage } from '../lib/useHtmlImage';
import { Size, SIZE_CAP, MIN_SCALE, MAX_SCALE } from '../lib/schema';

type Placement = { image_url: string; x: number; y: number; w: number; z_index: number };

type P = {
  side: 'front'|'back';
  size: Size;
  uploaded?: { url: string } | null;
  position: { x: number; y: number };      // normalized 0..1
  onPosition: (x: number, y: number) => void;
  placements: Placement[];
  width: number; // container width (parent provides)
};

// Helper to render a saved placement
function PlacementImage({ src, x, y, w }: { src: string; x: number; y: number; w: number }) {
  const img = useHtmlImage(src);
  if (!img) return null;
  return <KImage image={img} x={x} y={y} width={w} listening={false} />;
}

export default function JerseyCanvas(props: P) {
  const { side, size, uploaded, position, onPosition, placements, width } = props;
  const jerseySrc = side === 'front' ? '/jersey-front.svg' : '/jersey-back.svg';

  // Aspect ratio of jersey base
  const stageW = Math.min(width, 1000);
  const stageH = stageW * (2400 / 2000);

  const userImg = useHtmlImage(uploaded?.url ?? null);

  // Read the current slider scale from the DOM (so we don’t pass more props around)
  // This is a tiny bridge — the slider lives in index.tsx.
  const [scale, setScale] = useState(0.8);
  useEffect(() => {
    const input = document.querySelector('input[type="range"]') as HTMLInputElement | null;
    const read = () => {
      if (!input) return;
      const v = parseFloat(input.value);
      if (!isNaN(v)) setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, v)));
    };
    read();
    const on = () => read();
    input?.addEventListener('input', on);
    return () => input?.removeEventListener('input', on);
  }, []);

  const cap = SIZE_CAP[size];
  const chosenW = Math.max(cap * MIN_SCALE, Math.min(cap * MAX_SCALE, cap * scale));

  const wrapRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  function handleDrag(e: any) {
    const xPx = e.target.x();
    const yPx = e.target.y();
    onPosition(xPx / stageW, yPx / stageH);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', maxWidth: stageW }}>
      <img
        src={jerseySrc}
        alt={`99in1 jersey ${side}`}
        style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
        onLoad={() => setImgLoaded(true)}
      />

      {imgLoaded && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Stage width={stageW} height={stageH}>
            <Layer>
              {[...placements].sort((a,b)=>a.z_index-b.z_index).map((p,i)=>(
                <PlacementImage
                  key={i}
                  src={p.image_url}
                  x={p.x * stageW}
                  y={p.y * stageH}
                  w={p.w * stageW}
                />
              ))}

              {userImg && (
                <KImage
                  image={userImg}
                  x={position.x * stageW}
                  y={position.y * stageH}
                  width={chosenW * stageW}   // chosen width preview
                  draggable
                  onDragMove={handleDrag}
                  onDragEnd={handleDrag}
                />
              )}
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  );
}
