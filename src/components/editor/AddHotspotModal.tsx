'use client';

import React, { useState, useRef } from 'react';
import { Scene, Hotspot, HotspotPosition } from '@/types/tour';
import {
  X,
  Compass,
  ArrowRight,
  Info,
  Sparkles,
  Image as ImageIcon,
  Link2,
  Check,
  Upload,
  Globe,
  Palette,
  Eye,
} from 'lucide-react';

// Preset sample artwork & detail images for rapid 1-click selection
const PRESET_ARTWORKS = [
  {
    title: 'Chromawave No. 7',
    category: 'Oil on Canvas',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
  },
  {
    title: 'Solitude in Bronze',
    category: 'Cast Bronze & Teak',
    url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=900&auto=format&fit=crop&q=80',
  },
  {
    title: 'Terra Incognita Vessels',
    category: 'Wood-Fired Ceramic',
    url: 'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=900&auto=format&fit=crop&q=80',
  },
  {
    title: 'Vaulted Atrium Skylight',
    category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80',
  },
  {
    title: 'Aeolian Sound Installation',
    category: 'Sound Sculpture',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
  },
  {
    title: 'Geometric Symmetry in Marble',
    category: 'Sculpture',
    url: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=900&auto=format&fit=crop&q=80',
  },
];

interface AddHotspotModalProps {
  position: HotspotPosition;
  currentSceneId: string;
  scenes: Scene[];
  isOpen: boolean;
  onClose: () => void;
  onAddHotspot: (hotspot: Hotspot) => void;
  editingHotspot?: Hotspot | null;
}

export function AddHotspotModal({
  position,
  currentSceneId,
  scenes,
  isOpen,
  onClose,
  onAddHotspot,
  editingHotspot,
}: AddHotspotModalProps) {
  const [type, setType] = useState<'link' | 'info'>(
    editingHotspot?.type || 'link'
  );

  // Link Hotspot state
  const otherScenes = scenes.filter((s) => s.id !== currentSceneId);
  const defaultTarget =
    editingHotspot?.targetSceneId || otherScenes[0]?.id || scenes[0]?.id || '';
  const [targetSceneId, setTargetSceneId] = useState<string>(defaultTarget);
  const [linkLabel, setLinkLabel] = useState<string>(editingHotspot?.label || '');

  // Info Hotspot state
  const [infoTitle, setInfoTitle] = useState<string>(
    editingHotspot?.info?.title || editingHotspot?.label || ''
  );
  const [infoCategory, setInfoCategory] = useState<string>(
    editingHotspot?.info?.category || 'Exhibit'
  );
  const [infoBadge, setInfoBadge] = useState<string>(
    editingHotspot?.info?.badge || 'Featured'
  );
  const [infoDescription, setInfoDescription] = useState<string>(
    editingHotspot?.info?.description || ''
  );
  const [infoMediaUrl, setInfoMediaUrl] = useState<string>(
    editingHotspot?.info?.mediaUrl || ''
  );
  const [infoLinkUrl, setInfoLinkUrl] = useState<string>(
    editingHotspot?.info?.linkUrl || ''
  );
  const [infoLinkLabel, setInfoLinkLabel] = useState<string>(
    editingHotspot?.info?.linkLabel || 'Learn More'
  );

  // Image source mode: 'upload' | 'presets' | 'url'
  const [imageSourceTab, setImageSourceTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetScene = scenes.find((s) => s.id === targetSceneId);

  // Handle local file upload (converts to base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setInfoMediaUrl(reader.result);
          if (!infoTitle) {
            setInfoTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'link') {
      const finalLabel =
        linkLabel.trim() || `Walk to ${targetScene?.name || 'Scene'}`;
      const newHotspot: Hotspot = {
        id: editingHotspot?.id || `link-${Date.now()}`,
        type: 'link',
        position: editingHotspot?.position || position,
        targetSceneId,
        label: finalLabel,
      };
      onAddHotspot(newHotspot);
    } else {
      const newHotspot: Hotspot = {
        id: editingHotspot?.id || `info-${Date.now()}`,
        type: 'info',
        position: editingHotspot?.position || position,
        label: infoTitle.trim() || 'Info Point',
        info: {
          title: infoTitle.trim() || 'Untitled Hotspot',
          category: infoCategory.trim() || undefined,
          badge: infoBadge.trim() || undefined,
          description:
            infoDescription.trim() || 'Details about this location or item.',
          mediaUrl: infoMediaUrl.trim() || undefined,
          mediaType: 'image',
          linkUrl: infoLinkUrl.trim() || undefined,
          linkLabel: infoLinkLabel.trim() || undefined,
        },
      };
      onAddHotspot(newHotspot);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {editingHotspot ? 'Edit Hotspot' : 'Place New Hotspot'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Coordinates:{' '}
              <span className="text-blue-300 font-semibold">{String(position.yaw)}</span>,{' '}
              <span className="text-blue-300 font-semibold">{String(position.pitch)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hotspot Type Switcher */}
        <div className="p-4 sm:p-5 pb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
            Select Hotspot Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('link')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                type === 'link'
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  type === 'link' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Walk to Scene</p>
                <p className="text-[11px] text-zinc-400">Jumps to another 360 photo</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('info')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                type === 'info'
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  type === 'info' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <Info className="w-4 h-4 font-bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Info Popup</p>
                <p className="text-[11px] text-zinc-400">Artwork detail, image & text</p>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5 space-y-4">
          {type === 'link' ? (
            /* LINK TO DESTINATION IMAGE SCENE */
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
                  Choose Destination 360 Image / Scene
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {scenes.map((scene) => {
                    const isSelected = scene.id === targetSceneId;
                    const isSelf = scene.id === currentSceneId;
                    return (
                      <button
                        type="button"
                        key={scene.id}
                        onClick={() => {
                          setTargetSceneId(scene.id);
                          if (!linkLabel || linkLabel.startsWith('Walk to')) {
                            setLinkLabel(`Walk to ${scene.name}`);
                          }
                        }}
                        className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                            : 'border-zinc-800 hover:border-zinc-600 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="relative h-20 bg-zinc-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={scene.thumbnailUrl || scene.imageUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-blue-500 text-white shadow-md">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          {isSelf && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-800/90 text-zinc-300">
                              Current Room
                            </span>
                          )}
                        </div>
                        <div className="p-2 bg-zinc-900">
                          <p className="text-xs font-semibold text-white truncate">
                            {scene.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {scene.floor || 'Scene'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                  Marker Label
                </label>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder={`e.g. Walk to ${targetScene?.name || 'Next Room'}`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            /* INFO HOTSPOT: VISUAL IMAGE CHOOSER & DETAILS */
            <div className="space-y-4 pt-1">
              {/* IMAGE CHOOSER SECTION */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Choose Hotspot Image
                  </label>
                  {infoMediaUrl && (
                    <button
                      type="button"
                      onClick={() => setInfoMediaUrl('')}
                      className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                {/* Selected Image Preview */}
                {infoMediaUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-amber-500/40 bg-zinc-950 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={infoMediaUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <p className="text-xs font-medium text-white truncate">
                        Selected Image
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Image Source Tabs */
                  <div className="space-y-2.5">
                    <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('presets')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          imageSourceTab === 'presets'
                            ? 'bg-amber-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Palette className="w-3 h-3" />
                        <span>Artwork Presets</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('upload')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          imageSourceTab === 'upload'
                            ? 'bg-amber-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('url')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          imageSourceTab === 'url'
                            ? 'bg-amber-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Image URL</span>
                      </button>
                    </div>

                    {/* Presets Grid */}
                    {imageSourceTab === 'presets' && (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                        {PRESET_ARTWORKS.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => {
                              setInfoMediaUrl(preset.url);
                              if (!infoTitle) setInfoTitle(preset.title);
                              if (!infoCategory) setInfoCategory(preset.category);
                            }}
                            className="group relative h-20 rounded-xl overflow-hidden border border-zinc-800 hover:border-amber-500 text-left transition-all"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preset.url}
                              alt={preset.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                              <p className="text-[10px] font-bold text-white truncate">
                                {preset.title}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* File Upload Trigger */}
                    {imageSourceTab === 'upload' && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl bg-zinc-900/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                      >
                        <Upload className="w-6 h-6 text-amber-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Click to upload image from your computer
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Supports PNG, JPG, WebP, GIF
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

                    {/* URL Input */}
                    {imageSourceTab === 'url' && (
                      <input
                        type="url"
                        value={infoMediaUrl}
                        onChange={(e) => setInfoMediaUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or /images/art.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Hotspot Title *
                </label>
                <input
                  type="text"
                  required
                  value={infoTitle}
                  onChange={(e) => setInfoTitle(e.target.value)}
                  placeholder="e.g. Chromawave No. 7 / Architectural Sculpture"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                    Category Subtitle
                  </label>
                  <input
                    type="text"
                    value={infoCategory}
                    onChange={(e) => setInfoCategory(e.target.value)}
                    placeholder="e.g. Oil on Canvas (2024)"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={infoBadge}
                    onChange={(e) => setInfoBadge(e.target.value)}
                    placeholder="e.g. Featured / For Sale"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Description Text
                </label>
                <textarea
                  rows={2}
                  value={infoDescription}
                  onChange={(e) => setInfoDescription(e.target.value)}
                  placeholder="Describe the painting, sculpture, architectural detail, or room feature..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              {/* Link / Inquire URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                    External Link URL
                  </label>
                  <input
                    type="url"
                    value={infoLinkUrl}
                    onChange={(e) => setInfoLinkUrl(e.target.value)}
                    placeholder="https://example.com/art/buy"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={infoLinkLabel}
                    onChange={(e) => setInfoLinkLabel(e.target.value)}
                    placeholder="e.g. Inquire / Buy"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

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
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                type === 'link'
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30'
                  : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 shadow-amber-500/30'
              }`}
            >
              {editingHotspot ? 'Save Hotspot Changes' : 'Add Hotspot to Scene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
