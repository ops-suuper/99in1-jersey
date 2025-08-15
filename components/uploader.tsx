import { useState } from 'react';

type UploadResult = { url: string; public_id: string };

export default function Uploader({ onUploaded }: { onUploaded: (r: UploadResult) => void }) {
  const [loading, setLoading] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png', 'image/svg+xml'].includes(f.type)) {
      alert('Please upload PNG or SVG');
      return;
    }
    if (f.size > 1_000_000) { // 1MB
      alert('Max 1MB file');
      return;
    }

    setLoading(true);
    try {
      const sig = await fetch('/api/upload-signature').then(r => r.json());
      const form = new FormData();
      form.append('file', f);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', String(sig.timestamp));
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
        method: 'POST',
        body: form
      }).then(r => r.json());

      onUploaded({ url: res.secure_url, public_id: res.public_id });
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <label style={labelStyle as any}>
      <input type="file" accept="image/png,image/svg+xml" onChange={handle} disabled={loading}/>
      <span>{loading ? 'Uploading…' : 'Upload logo (PNG/SVG, ≤1MB)'}</span>
    </label>
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
