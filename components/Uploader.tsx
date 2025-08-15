import { useCallback, useRef, useState } from 'react';

type UploadResult = { url: string; public_id: string };

export default function Uploader({ onUploaded }: { onUploaded: (r: UploadResult) => void }) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '<YOUR_CLOUD_NAME>';
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || '99in1_unsigned';

  const onFile = useCallback(async (f: File | null) => {
    if (!f) return;
    setErrMsg(null);

    if (!['image/png', 'image/svg+xml'].includes(f.type)) {
      setErrMsg('Please upload a PNG or SVG file.');
      return;
    }
    if (f.size > 1_000_000) {
      setErrMsg('Max file size is 1 MB.');
      return;
    }

    // Local preview
    setLocalPreview(URL.createObjectURL(f));

    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', f);
      form.append('upload_preset', UPLOAD_PRESET);
      form.append('folder', '99in1-logos'); // preset should also enforce this

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: form
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setErrMsg(json?.error?.message || 'Upload failed. Check preset & cloud name.');
        setLoading(false);
        return;
      }
      onUploaded({ url: json.secure_url, public_id: json.public_id });
    } catch (e: any) {
      console.error(e);
      setErrMsg('Upload failed. See console for details.');
    } finally {
      setLoading(false);
    }
  }, [CLOUD_NAME, UPLOAD_PRESET, onUploaded]);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onFile(e.target.files?.[0] || null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] || null;
    onFile(f);
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        style={dropStyle(localPreview != null, loading)}
        role="button"
        aria-label="Upload logo"
      >
        {localPreview
          ? <img src={localPreview} alt="preview" style={{ maxWidth:'100%', maxHeight: '100%', objectFit:'contain', borderRadius:8 }} />
          : <span style={{ opacity: 0.9 }}>
              {loading ? 'Uploading…' : 'Click or drop logo (PNG/SVG ≤1MB)'}
            </span>
        }
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml"
          onChange={onInputChange}
          disabled={loading}
          style={{ display:'none' }}
        />
      </div>

      {localPreview && (
        <button
          onClick={(e) => { e.stopPropagation(); setLocalPreview(null); inputRef.current!.value = ''; }}
          style={ghostBtn}
        >
          Replace
        </button>
      )}

      {errMsg && <span style={{ color:'#ffb4b4' }}>{errMsg}</span>}
    </div>
  );
}

function dropStyle(hasPreview: boolean, loading: boolean): React.CSSProperties {
  return {
    width: 220,
    height: 80,
    display: 'grid',
    placeItems: 'center',
    padding: 10,
    borderRadius: 12,
    border: '1px dashed #6b5a87',
    background: hasPreview ? '#241a36' : '#2E2142',
    color: '#F2C94C',
    cursor: loading ? 'wait' : 'pointer',
    userSelect: 'none',
    overflow: 'hidden'
  };
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #4b3a66',
  background: 'transparent',
  color: '#F2C94C',
  cursor: 'pointer'
};
