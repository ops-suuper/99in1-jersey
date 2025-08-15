import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Transformer } from 'react-konva';
import { useHtmlImage } from '../lib/useHtmlImage';
import { Size, LONG_SIDE_CAP, MIN_SCALE, MAX_SCALE, clamp } from '../lib/schema';

type Placement = {
  image_url: string;
  x: number;           // 0..1
  y: number;           // 0..1
  w: number;           // width fraction 0..1 (long side on canvas)
  z_index: number;
  rotation?: number;   // deg
};

type P = {
  side: 'front'|'back';
  size: Size;
  uploaded?: { url: string } | null;
  position: { x: number; y: number };    // 0..1
  onPosition: (x: number, y: number) => void;
  onUserTransform?: (w: number, rotation: number) => void; // normalized width + rotation
  placements: Placement[];
  width: number; // px
};

function PlacementImage({ src, x, y, w, rotation = 0 }: { src: string; x: number; y: number; w: number; rotation?: number }) {
  const img = useHtmlImage(src);
  if (!img) return null;
  return <KImage image={img} x={x} y={y} width={w} rotation={rotation} listening={false} />;
}

export default function JerseyCanvas(props: P) {
  const { side, size, uploaded, position, onPosition, onUserTransform, placements, width } = props;
  const jerseySrc = side === 'front' ? '/jersey-front.svg' : '/jersey-back.svg';

  const stageW = Math.min(width, 1000);
  const stageH = stageW * (2400 / 2000);

  // Base jersey as HTML <img> underlay for stability
  const [imgLoaded, setImgLoaded] = useState(false);

  // User image
  const userImg = useHtmlImage(uploaded?.url ?? null);
  const userNodeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  // Tier caps (width fraction)
  const cap = LONG_SIDE_CAP[size];
  const minWfrac = cap * MIN_SCALE;
  const maxWfrac = cap * MAX_SCALE;

  // Working normalized width + rotation for the user logo
  const [userWfrac, setUserWfrac] = useState<number | null>(null);
  const [userRotation, setUserRotation] = useState<number>(0);

  // When image loads or tier changes, auto-fit to cap (keep ratio)
  useEffect(() => {
    if (!userImg) return;
    // start around 80% of cap
    const start = clamp(cap * 0.8, minWfrac, maxWfrac);
    setUserWfrac(start);
    onUserTransform?.(start, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userImg, cap, minWfrac, maxWfrac]);

  // Attach transformer to the user node when available
  useEffect(() => {
    if (trRef.current && userNodeRef.current) {
      trRef.current.nodes([userNodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [userImg, userNodeRef.current, trRef.current]);

  function clampUserWidthPx(nextPx: number) {
    const frac = clamp(nextPx / stageW, minWfrac, maxWfrac);
    return frac * stageW;
  }

  function handleDrag(e: any) {
    const xPx = e.target.x();
    const yPx = e.target.y();
    onPosition(xPx / stageW, yPx / stageH);
  }

  // Force uniform scaling (aspect preserved) & clamp to tier
  function onTransform() {
    const node = userNodeRef.current;
    if (!node) return;

    // Use a uniform scale: take the max of |scaleX| and |scaleY|
    const s = Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()));

    // Proposed new width in px based on this uniform scale
    const nextWidthPx = node.width() * s;

    // Clamp to tier limits in px
    const clampedWidthPx = clampUserWidthPx(nextWidthPx);

    // Reset the node to a "baked" width and neutral scale
    // Height will follow the image aspect automatically
    node.width(clampedWidthPx);
    node.scaleX(1);
    node.scaleY(1);

    // Save normalized width + rotation
    const wFrac = clampedWidthPx / stageW;
    setUserWfrac(wFrac);
    const rot = node.rotation();
    setUserRotation(rot);
    onUserTransform?.(wFrac, rot);

    // Redraw
    node.getLayer()?.batchDraw();
  }

  const previewWpx = (userWfrac ?? (cap * 0.8)) * stageW;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: stageW }}>
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
                  rotation={p.rotation ?? 0}
                />
              ))}

              {userImg && (
                <>
                  <KImage
                    ref={userNodeRef}
                    image={userImg}
                    x={position.x * stageW}
                    y={position.y * stageH}
                    width={previewWpx}   // set width only -> Konva preserves aspect
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
                    // Limit anchors to corners; we’ll enforce uniform scale in onTransform
                    enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Enforce the tier clamp during rubber-band drawing:
                      const clampedW = clampUserWidthPx(newBox.width);
                      // Keep aspect visually: height follows from image ratio handled by Konva when we set width
                      return { ...newBox, width: clampedW };
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
