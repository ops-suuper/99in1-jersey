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
          <div className
