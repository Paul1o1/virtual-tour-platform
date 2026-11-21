'use client';

import React, { useState, useRef } from 'react';
import { Scene } from '@/types/tour';
import {
  X,
  Plus,
  Upload,
  Globe,
  Palette,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from 'lucide-react';

const SAMPLE_PANORAMAS = [
  {
    name: 'Sunlit Courtyard',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-2.jpg',
  },
  {
    name: 'Modern Salon & Lounge',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-3.jpg',
  },
  {
    name: 'Coastal Pavilion',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-4.jpg',
  },
  {
    name: 'Grand Sphere Hall',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg',
  },
];

interface AddSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScene: (newScene: Scene) => void;
  existingCount: number;
}

export function AddSceneModal({
  isOpen,
  onClose,
  onAddScene,
  existingCount,
}: AddSceneModalProps) {
  const [name, setName] = useState('');
  const [floor, setFloor] = useState(`Floor ${existingCount + 1}`);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceTab, setSourceTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          if (!name) {
            // Suggest clean name from file name
            const clean = file.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            setName(clean);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please upload or provide a 360 panorama image.');
      return;
    }

    const sceneId = `scene-${Date.now()}`;
    const newScene: Scene = {
      id: sceneId,
      name: name.trim() || `Room ${existingCount + 1}`,
      floor: floor.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
      thumbnailUrl: imageUrl.trim(),
      initialView: {
        yaw: '0deg',
        pitch: '0deg',
        zoom: 50,
      },
      hotspots: [],
    };

    onAddScene(newScene);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Add New 360 Room / Scene
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add a new panorama location to walk through
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Room Name & Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                Room / Scene Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master Suite / Terrace"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                Floor / Wing Label
              </label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. Floor 1 / Garden"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 block">
              Room Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Featuring ocean views and floor-to-ceiling glass..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* 360 Panorama Image Picker */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                360 Equirectangular Photo *
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Photo
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-blue-500/40 bg-zinc-950 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="360 Panorama Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <p className="text-xs font-semibold text-white truncate">
                    Ready to load as 360 sphere
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Tabs */}
                <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setSourceTab('upload')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      sourceTab === 'upload'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload 360 File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('presets')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      sourceTab === 'presets'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                    <span>Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('url')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      sourceTab === 'url'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Image URL</span>
                  </button>
                </div>

                {/* Upload File */}
                {sourceTab === 'upload' && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-xl bg-zinc-900/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                  >
                    <Upload className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Click to select 360° photo from your computer
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Insta360 equirectangular 2:1 JPG (e.g. 6080x3040)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Presets Grid */}
                {sourceTab === 'presets' && (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {SAMPLE_PANORAMAS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setImageUrl(preset.url);
                          if (!name) setName(preset.name);
                        }}
                        className="group relative h-20 rounded-xl overflow-hidden border border-zinc-800 hover:border-blue-500 text-left transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2 flex flex-col justify-end">
                          <p className="text-[11px] font-semibold text-white truncate">
                            {preset.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* URL Input */}
                {sourceTab === 'url' && (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or /panoramas/room.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!imageUrl}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                imageUrl
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Add Room to Tour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
