import { useState } from 'react';

type UploadResult = { url: string; public_id: string };

export default function Uploader({ onUploaded }: { onUploaded: (r: UploadResult) => void }) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Put your Cloudinary details here (or make them envs later)
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '<YOUR_CLOUD_NAME>';
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || '99in1_unsigned';

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setErrMsg(null);

    if (!['image/png', 'image/svg+xml'].includes(f.type)) {
      setErrMsg('Please upload a PNG or SVG file.');
      return;
    }
    if (f.size > 1_000_000) { // 1MB
      setErrMsg('Max file size is 1 MB.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', f);
      form.append('upload_preset', UPLOAD_PRESET);
      // Optional: enforce folder client-side too (preset already does it)
      form.append('folder', '99in1-logos');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: form
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        console.error('Cloudinary error:', json);
        setErrMsg(json?.error?.message || 'Upload failed. Check preset name & cloud name.');
        setLoading(false);
        return;
      }

      onUploaded({ url: json.secure_url, public_id: json.public_id });
    } catch (err: any) {
      console.error(err);
      setErrMsg('Upload failed. See console for details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
      <label style={labelStyle as any}>
        <input type="file" accept="image/png,image/svg+xml" onChange={handle} disabled={loading}/>
        <span>{loading ? 'Uploading…' : 'Upload logo (PNG/SVG, ≤1MB)'}</span>
      </label>
      {errMsg && <span style={{ color:'#ffb4b4' }}>{errMsg}</span>}
    </div>
  );
}

const labelStyle = {
  display: 'inline-block',
  padding: '10px 14px',
  border: '1px solid #444',
  borderRadius: 8,
  cursor: 'pointer',
  userSelect: 'none',
  background: '#2E2142',
  color: '#F2C94C',
  fontWeight: 600
};
