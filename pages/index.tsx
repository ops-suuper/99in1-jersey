import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import Uploader from '../components/Uploader'; // <- exact case matches components/Uploader.tsx
import { Size } from '../lib/schema';

const JerseyCanvas = dynamic(() => import('../components/JerseyCanvas'), { ssr: false });
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Home() {
  const [side, setSide] = useState<'front'|'back'>('front');
  const [size, setSize] = useState<Size>('small');
  const [uploaded, setUploaded] = useState<{url:string; public_id:string} | null>(null);
  const [pos, setPos] = useState({ x: 0.4, y: 0.4 });
  const [userW, setUserW] = useState<number | null>(null);
  const [userRotation, setUserRotation] = useState<number>(0);
  const [containerW, setContainerW] = useState(900);
  const [busy, setBusy] = useState(false);

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
    if (userW == null) { alert('Resize/confirm your logo once'); return; }
    if (busy) return;
    setBusy(true);

    try {
      // 1) Create a pending placement so we have an Airtable record + z-index
      const createRes = await fetch('/api/create-placement', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          side, size,
          x: pos.x, y: pos.y,
          w: userW, rotation: userRotation,
          image_url: uploaded.url,
          public_id: uploaded.public_id
        })
      });
      const create = await createRes.json();
      if (!createRes.ok || !create?.placement_id) {
        alert(`Create placement failed: ${create?.error || createRes.statusText}`);
        return;
      }

      // 2) Start Stripe Checkout (mode: 'payment')
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ placement_id: create.placement_id, size })
      });
      const checkout = await checkoutRes.json();
      if (!checkoutRes.ok || !checkout?.url) {
        alert(`Checkout failed: ${checkout?.error || checkoutRes.statusText}`);
        return;
      }

      window.location.href = checkout.url;
    } catch (err: any) {
      console.error(err);
      alert(`Something went wrong: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <nav className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border grid place-items-center">
            <span className="font-black">99</span>
          </div>
          <div>
            <div className="font-semibold tracking-wide leading-tight">99in1</div>
            <div className="text-xs opacity-60 -mt-0.5">Counter-Strike 2</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a className="px-3 py-1.5 rounded-full border text-sm" href="#how">How it works</a>
          <a className="px-3 py-1.5 rounded-full border text-sm" href="#team">Team</a>
          <a className="px-3 py-1.5 rounded-full border text-sm" href="#faq">FAQ</a>
          <a className="px-4 py-2 rounded-xl border text-sm font-semibold" href="#jersey">Place your logo</a>
        </div>
      </nav>

      <header className="mx-auto max-w-6xl px-4 pt-2 pb-8">
        <div className="p-6 border rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
                Fill the Jersey — <span>99 spots each side</span>
              </h1>
              <p className="mt-3 opacity-75">
                Drop your logo anywhere. Resize/rotate within your tier and it goes live instantly after payment.
                We’ll freeze the design before our November 2025 LAN and print the jersey we wear on stage.
              </p>
              <div className="mt-4 flex gap-2">
                <a href="#jersey" className="px-4 py-2 rounded-xl border font-semibold">Place your logo</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-full border text-sm ${side==='front' ? 'font-semibold' : ''}`} onClick={()=>setSide('front')}>Front</button>
              <button className={`px-3 py-1.5 rounded-full border text-sm ${side==='back' ? 'font-semibold' : ''}`} onClick={()=>setSide('back')}>Back</button>
            </div>
          </div>
        </div>
      </header>

      <section id="jersey" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid md:grid-cols-[1.2fr_.8fr] gap-6 items-start">
          <div className="p-4 border rounded-2xl">
            <div ref={wrapRef}>
              <JerseyCanvas
                side={side}
                size={size}
                uploaded={uploaded ? { url: uploaded.url } : null}
                position={pos}
                onPosition={(x,y)=> setPos({ x, y })}
                onUserTransform={(w, rot)=> { setUserW(w); setUserRotation(rot); }}
                placements={placements}
                width={containerW}
              />
            </div>
          </div>

          <div className="p-6 border rounded-2xl space-y-6">
            <div>
              <div className="text-lg font-semibold">Choose your tier</div>
              <p className="text-sm opacity-70 mt-1">Higher tiers allow larger logos.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={()=>setSize('small')}
                        className={`px-4 py-2 rounded-xl border text-sm ${size==='small' ? 'font-semibold' : ''}`}>$5 • Small</button>
                <button onClick={()=>setSize('medium')}
                        className={`px-4 py-2 rounded-xl border text-sm ${size==='medium' ? 'font-semibold' : ''}`}>$10 • Medium</button>
                <button onClick={()=>setSize('large')}
                        className={`px-4 py-2 rounded-xl border text-sm ${size==='large' ? 'font-semibold' : ''}`}>$20 • Large</button>
              </div>
            </div>

            <div>
              <div className="text-lg font-semibold">Upload your logo</div>
              <p className="text-sm opacity-70 mt-1">PNG or SVG up to 1MB. Drag anywhere on the jersey. Use handles to resize/rotate.</p>
              <div className="mt-3">
                <Uploader onUploaded={(r)=> setUploaded(r)} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={startCheckout}
                disabled={busy || !uploaded || userW == null}
                className={`px-4 py-2 rounded-xl border font-semibold w-full ${busy ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {busy ? 'Working…' : 'Confirm & Pay'}
              </button>
              <button
                onClick={() => { setUploaded(null); setUserW(null); setUserRotation(0); }}
                className="px-4 py-2 rounded-xl border"
              >
                Reset
              </button>
            </div>

            <div className="text-xs opacity-70">
              By placing your logo you agree it’s safe-for-work and you have rights to use it.
              We reserve the right to remove offensive imagery.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
