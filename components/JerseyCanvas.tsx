import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Transformer } from 'react-konva';
import { useHtmlImage } from '../lib/useHtmlImage';
import { Size, SIZE_CAP, MIN_SCALE, MAX_SCALE } from '../lib/schema';

type Placement = {
  image_url: string;
  x: number;
  y: number;
  w: number;           // normalized width fraction (0..1)
  z_index: number;
  rotation?: number;   // degrees
};

type P = {
  side: 'front'|'back';
  size: Size;
  uploaded?: { url: string } | null;             // user’s current logo (not yet paid)
  position: { x: number; y: number };           // normalized 0..1
  onPosition: (x: number, y: number) => void;
  onUserTransform?: (w: number, rotation: number) => void; // notify parent
  placements: Placement[];                       // paid logos
  width: number;                                 // container width (px)
};

function PlacementImage({ src, x, y, w, rotation = 0 }: { src: string; x: number; y: number; w: number; rotation?: number }) {
  const img = useHtmlImage(src);
  if (!img) return null;
  return <KImage image={img} x={x} y={y} width={w} rotation={rotation} listening={false} />;
}

export default function JerseyCanvas(props: P) {
  const { side, size, uploaded, position, onPosition, onUserTransform, placements, width } = props;
  const jerseySrc = side === 'front' ? '/jersey-front.svg' : '/jersey-back.svg';

  // Stage size based on jersey aspect 2000x2400
  const stageW = Math.min(width, 1000);
  const stageH = stageW * (2400 / 2000);

  // User image (unpaid, currently editing)
  const userImg = useHtmlImage(uploaded?.url ?? null);

  // User transform state (normalized width & rotation)
  const cap = SIZE_CAP[size];
  const minW = cap * MIN_SCALE;
  const maxW = cap * MAX_SCALE;

  // we store user's working width as a fraction (0..1 of stage width)
  const [userW, setUserW] = useState<number | null>(null);
  const [userRotation, setUserRotation] = useState<number>(0);

  // init default size when image loads or tier changes
  useEffect(() => {
    if (userImg && (userW == null || userW > maxW || userW < minW)) {
      const startW = cap * 0.8; // default 80% of cap
      setUserW(Math.max(minW, Math.min(maxW, startW)));
      onUserTransform?.(Math.max(minW, Math.min(maxW, startW)), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userImg, cap, minW, maxW]);

  // selection refs
  const userNodeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (trRef.current && userNodeRef.current) {
      trRef.current.nodes([userNodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [userImg, userNodeRef.current, trRef.current]);

  function clampUserWidthPx(nextPx: number) {
    const nextFrac = nextPx / stageW;
    const clamped = Math.max(minW, Math.min(maxW, nextFrac));
    return clamped * stageW;
  }

  function handleDrag(e: any) {
    const xPx = e.target.x();
    const yPx = e.target.y();
    onPosition(xPx / stageW, yPx / stageH);
  }

  function onTransform(e: any) {
    const node = userNodeRef.current;
    if (!node) return;

    // Konva uses scale; convert to width then reset scale to 1 to keep math simple
    const scaledW = node.width() * node.scaleX();
    const clampedW = clampUserWidthPx(scaledW);
    node.width(clampedW);
    node.scaleX(1);
    node.scaleY(1);

    // Rotation
    const rot = node.rotation();
    setUserRotation(rot);

    // Save normalized width
    const wFrac = clampedW / stageW;
    setUserW(wFrac);
    onUserTransform?.(wFrac, rot);
  }

  // current preview width in px
  const previewWpx = (userW ?? (cap * 0.8)) * stageW;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: stageW }}>
      {/* Base jersey as HTML image */}
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
              {/* Paid placements */}
              {[...placements].sort((a,b)=>a.z_index-b.z_index).map((p,i)=>(
                <PlacementImage
                  key={i}
                  src={p.image_url}
                  x={p.x * stageW}
                  y={p.y * stageH}
                  w={p.w * stageW}
                  rotation={p.rotation ?? 0}
                />
              ))}

              {/* User’s editable image */}
              {userImg && (
                <>
                  <KImage
                    ref={userNodeRef}
                    image={userImg}
                    x={position.x * stageW}
                    y={position.y * stageH}
                    width={previewWpx}
                    rotation={userRotation}
                    draggable
                    onDragMove={handleDrag}
                    onDragEnd={handleDrag}
                    onTransform={onTransform}
                    onTransformEnd={onTransform}
                  />
                  <Transformer
                    ref={trRef}
                    rotateEnabled
                    enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                      // limit resize by min/max width in px
                      const clampedW = clampUserWidthPx(newBox.width);
                      return {
                        ...newBox,
                        width: clampedW,
                        height: newBox.height // keep aspect Konva will maintain ratios visually
                      };
                    }}
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  );
}
