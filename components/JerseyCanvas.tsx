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
  width: number; // container width
};

export default function JerseyCanvas(props: P) {
  const { side, size, uploaded, position, onPosition, placements, width } = props;
  const bgSrc = side === 'front' ? '/jersey-front.svg' : '/jersey-back.svg';

  const stageW = Math.min(width, 1000);
  const stageH = stageW * (2400 / 2000); // maintain 2000x2400 aspect

  const bg = useHtmlImage(bgSrc);
  const userImg = useHtmlImage(uploaded?.url ?? null);

  function handleDrag(e: any) {
    const xPx = e.target.x();
    const yPx = e.target.y();
    onPosition(xPx / stageW, yPx / stageH);
  }

  const upW = SIZE_TO_W[size] * stageW;

  return (
    <div style={{ width: '100%' }}>
      <Stage width={stageW} height={stageH}>
        <Layer>
          {bg && <KImage image={bg} x={0} y={0} width={stageW} height={stageH} listening={false} />}
          {[...placements].sort((a,b)=>a.z_index-b.z_index).map((p,i)=>(
            <KImage key={i}
                    image={useHtmlImage(p.image_url)!}
                    x={p.x * stageW}
                    y={p.y * stageH}
                    width={p.w * stageW}
                    listening={false}
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
  );
}
