import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import Uploader from '../components/Uploader';
import { Size } from '../lib/schema';

const JerseyCanvas = dynamic(() => import('../components/JerseyCanvas'), { ssr: false });
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Home() {
  const [side, setSide] = useState<'front'|'back'>('front');
  const [size, setSize] = useState<Size>('small');
  const [uploaded, setUploaded] = useState<{url:string; public_id:string} | null>(null);
  const [pos, setPos] = useState({ x: 0.4, y: 0.4 }); // normalized
  const [containerW, setContainerW] = useState(900);

  const { data } = useSWR(`/api/placements?side=${side}`, fetcher, { refreshInterval: 3000 });
  const placements = data?.items || [];

  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onResize() {
      if (wrapRef.current) setContainerW(wrapRef.current.clientWidth);
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function startCheckout() {
    if (!uploaded) { alert('Upload a logo first'); return; }

    const create = await fetch('/api/create-placement', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        side,
        size,
        x: pos.x,
        y: pos.y,
        image_url: uploaded.url,
        public_id: uploaded.public_id
      })
    }).then(r => r.json());

    if (!create.placement_id) {
      alert('Could not create placement'); return;
    }

    const checkout = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ placement_id: create.placement_id, size })
    }).then(r => r.json());

    if (checkout.url) window.location.href = checkout.url;
    else alert('Checkout failed');
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#F2C94C', background:'#1E152B', minHeight:'100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <header style={{ display:'flex', alignItems:'center', gap:16, marginBottom: 16 }}>
          <h1 style={{ margin:0 }}>99in1 — Fill the Jersey</h1>
        </header>

        <p style={{ color:'#EADDA6' }}>
          Drop your logo anywhere on our kit. Choose a size ($5 / $10 / $20), pay, and it goes live instantly.
          We’ll freeze the design before our November 2025 LAN and print the jersey we wear on stage.
        </p>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', margin:'12px 0' }}>
          <button onClick={()=>setSide('front')} style={btn(side==='front')}>Front</button>
          <button onClick={()=>setSide('back')} style={btn(side==='back')}>Back</button>

          <span style={{ marginLeft: 8 }}>Size:</span>
          <button onClick={()=>setSize('small')} style={btn(size==='small')}>$5 — Small</button>
          <button onClick={()=>setSize('medium')} style={btn(size==='medium')}>$10 — Medium</button>
          <button onClick={()=>setSize('large')} style={btn(size==='large')}>$20 — Large</button>

          <Uploader onUploaded={(r)=> setUploaded(r)} />
          <button onClick={startCheckout} style={{ ...btn(false), background:'#F2C94C', color:'#2E2142' }}>
            Confirm & Pay
          </button>
        </div>

        <div ref={wrapRef}>
          <JerseyCanvas
            side={side}
            size={size}
            uploaded={uploaded ? { url: uploaded.url } : null}
            position={pos}
            onPosition={(x,y)=> setPos({ x, y })}
            placements={placements}
            width={containerW}
          />
        </div>

        <section style={{ marginTop: 30, color:'#EADDA6' }}>
          <h3 style={{ color:'#F2C94C' }}>How it works</h3>
          <ol>
            <li>Upload your logo (PNG or SVG)</li>
            <li>Pick front or back, choose a size, and drag to place</li>
            <li>Pay securely with Stripe — your logo appears live immediately 🎉</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

function btn(active:boolean) {
  return {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #4b3a66',
    background: active ? '#2E2142' : 'transparent',
    color: '#F2C94C',
    cursor: 'pointer'
  } as React.CSSProperties;
}
