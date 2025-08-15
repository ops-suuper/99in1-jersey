// components/ImageUploader.tsx
import React, { useState } from 'react';
import { Size, getScaledDimensions } from '../lib/schema';

interface Placement {
  imageUrl: string;
  width: number;
  height: number;
  scale: number;
  x: number;
  y: number;
}

interface Props {
  onPlacementChange: (placement: Placement) => void;
}

export default function ImageUploader({ onPlacementChange }: Props) {
  const [selectedSize, setSelectedSize] = useState<Size>(Size.Medium);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const { width, height, scale } = getScaledDimensions(
        img.naturalWidth,
        img.naturalHeight,
        selectedSize
      );

      setPreviewUrl(imageUrl);
      onPlacementChange({
        imageUrl,
        width,
        height,
        scale,
        x: 0,
        y: 0,
      });
    };
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFiles(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFiles(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex justify-center gap-2 mb-4">
        {Object.values(Size).map((size) => (
          <button
            key={size}
            className={`px-4 py-2 rounded-lg font-semibold border transition ${
              selectedSize === size
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedSize(size)}
          >
            {size.charAt(0).toUpperCase() + size.slice(1)}
          </button>
        ))}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
          dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="file-upload"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <p className="text-gray-600">Drag & drop your image here, or click to browse</p>
          <p className="text-sm text-gray-400">Accepted formats: PNG, JPG, GIF</p>
        </label>
      </div>

      {previewUrl && (
        <div className="mt-4 flex justify-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="shadow-md border rounded-lg"
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      )}
    </div>
  );
}
