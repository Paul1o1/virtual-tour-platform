'use client';

import React, { useState } from 'react';
import { Tour } from '@/types/tour';
import { Plus, X, Sparkles, Building2, User, Globe2 } from 'lucide-react';

interface NewTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTour: (tour: Tour) => void;
}

export function NewTourModal({ isOpen, onClose, onCreateTour }: NewTourModalProps) {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate clean slug from title if slug hasn't been manually set
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !client.trim() || !slug.trim()) return;

    const initialSceneId = `scene_${Date.now()}`;
    const newTour: Tour = {
      id: `tour_${Date.now()}`,
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      client: client.trim(),
      description: description.trim(),
      startSceneId: initialSceneId,
      settings: {
        autoRotate: true,
        autoRotateSpeed: '0.4rpm',
        autoRotateDelay: 3500,
        brandName: client.trim(),
        primaryColor: '#3b82f6',
        showSceneList: true,
        showGyroscope: true,
        allowFullscreen: true,
      },
      scenes: [
        {
          id: initialSceneId,
          name: 'Main Entrance / Starting Room',
          description: 'Initial 360 viewpoint',
          imageUrl: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-1.jpg',
          thumbnailUrl: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-1.jpg',
          floor: 'Floor 1',
          initialView: { yaw: '0deg', pitch: '0deg', zoom: 50 },
          hotspots: [],
        },
      ],
    };

    onCreateTour(newTour);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Client Tour</h3>
              <p className="text-xs text-zinc-400">Create a dedicated 360° walkthrough for a new client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Client / Business Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="e.g. Skyline Luxury Realty"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Tour Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 742 Evergreen Penthouse"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Custom URL Slug <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Globe2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="e.g. 742-evergreen-penthouse"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Tour link: /tour/{slug || 'your-slug'} &nbsp;•&nbsp; Embed: /embed/{slug || 'your-slug'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Private 4-bedroom penthouse with panoramic ocean views..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !client.trim() || !slug.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Client Tour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
