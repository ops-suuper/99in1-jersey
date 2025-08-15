import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage } from 'react-konva';
import { useHtmlImage } from '../lib/useHtmlImage';
import { Size, SIZE_TO_W } from '../lib/schema';

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

// Small helper so we can use the image hook safely per placement
function PlacementImage({ src, x, y, w }: { src: string; x: number; y: number; w: number }) {
  const img = useHtmlImage(src);
  if (!img) return null;
  return <KImage image={img} x={x} y={y} width={w} listening={false} />;
}

export default function JerseyCanvas(props: P) {
  const { side, size, uploaded, position, onPosition, placements, width } = props;
  const jerseySrc = side === 'front' ? '/jersey-front.svg' : '/jersey-back.svg';

  // Maintain original jersey aspect ratio (2000x2400)
  const stageW = Math.min(width, 1000);
  const stageH = stageW * (2400 / 2000);

  const userImg = useHtmlImage(uploaded?.url ?? null);
  const upW = SIZE_TO_W[size] * stageW;

  // ===== Overlay approach: HTML jersey below, Konva logos above =====
  const wrapRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  function handleDrag(e: any) {
    const xPx = e.target.x();
    const yPx = e.target.y();
    onPosition(xPx / stageW, yPx / stageH);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', maxWidth: stageW }}>
      {/* Jersey as a normal image (no Konva) */}
      <img
        src={jerseySrc}
        alt={`99in1 jersey ${side}`}
        style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
        onLoad={() => setImgLoaded(true)}
      />

      {/* Transparent Konva overlay for logos only */}
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
                  width={upW}
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
