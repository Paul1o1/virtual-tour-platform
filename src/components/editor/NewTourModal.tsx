'use client';

import React, { useState, useEffect } from 'react';
import { Tour, Company } from '@/types/tour';
import { defaultCompanies } from '@/data/default-tour';
import { Plus, X, Sparkles, Building2, User, Globe2 } from 'lucide-react';

interface NewTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTour: (tour: Tour) => void;
  defaultCompanySlug?: string;
}

export function NewTourModal({
  isOpen,
  onClose,
  onCreateTour,
  defaultCompanySlug,
}: NewTourModalProps) {
  const [companies, setCompanies] = useState<Company[]>(defaultCompanies);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>(
    defaultCompanySlug || defaultCompanies[0]?.slug || ''
  );
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          if (data.companies && data.companies.length > 0) {
            setCompanies(data.companies);
            if (!defaultCompanySlug) {
              setSelectedCompanySlug(data.companies[0].slug);
            }
          }
        }
      } catch (_) {}
    }
    loadCompanies();
  }, [defaultCompanySlug]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let compSlug = selectedCompanySlug;
    let clientName = '';

    if (isCustomCompany) {
      if (!customCompanyName.trim()) return;
      clientName = customCompanyName.trim();
      compSlug = customCompanyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else {
      const found = companies.find((c) => c.slug === selectedCompanySlug);
      clientName = found ? found.name : 'Client Company';
    }

    if (!title.trim() || !clientName || !slug.trim()) return;

    const initialSceneId = `scene_${Date.now()}`;
    const newTour: Tour = {
      id: `tour_${Date.now()}`,
      companySlug: compSlug,
      companyId: `comp_${compSlug}`,
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      client: clientName,
      description: description.trim(),
      startSceneId: initialSceneId,
      status: 'published',
      settings: {
        autoRotate: true,
        autoRotateSpeed: '0.4rpm',
        autoRotateDelay: 3500,
        brandName: clientName,
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
              <h3 className="text-base font-bold text-white">Create New 360 Tour</h3>
              <p className="text-xs text-zinc-400">Assign to a company or create a new client account</p>
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
          {/* Company Assignment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Company / Client Account <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCompany(!isCustomCompany)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                {isCustomCompany ? 'Choose Existing Company' : '+ New Company'}
              </button>
            </div>

            {isCustomCompany ? (
              <input
                type="text"
                required
                placeholder="e.g. Apex Modern Architecture"
                value={customCompanyName}
                onChange={(e) => setCustomCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <select
                value={selectedCompanySlug}
                onChange={(e) => setSelectedCompanySlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {companies.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} (/c/{c.slug})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tour Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Tour Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. The Skyview Penthouse 42B"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Custom Slug */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Custom URL Slug <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Globe2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="e.g. skyview-penthouse-42b"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Live link: /tour/{slug || 'tour-slug'} &nbsp;•&nbsp; Embed: /embed/{slug || 'tour-slug'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="High-end penthouse walkthrough featuring bay views..."
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
              disabled={!title.trim() || !slug.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Tour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
