'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tour, Company, Scene } from '@/types/tour';
import { defaultCompanies } from '@/data/default-tour';
import { getLocalCompanies, saveLocalCompany } from '@/lib/client-storage';
import { Plus, X, Sparkles, Building2, Globe2, Upload, Palette, Image as ImageIcon, Check } from 'lucide-react';

const STARTER_PANORAMAS = [
  {
    name: 'Modern Sunlit Villa',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-1.jpg',
  },
  {
    name: 'Contemporary Grand Hall',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-2.jpg',
  },
  {
    name: 'Terrace & Pool Deck',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-3.jpg',
  },
  {
    name: 'Ocean Coastal Overlook',
    url: 'https://photo-sphere-viewer-data.netlify.app/assets/tour/key-biscayne-4.jpg',
  },
];

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');
  
  // Tour Details
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  // Initial Scene Details (Start from scratch)
  const [sceneName, setSceneName] = useState('Main Foyer / Living Room');
  const [sceneFloor, setSceneFloor] = useState('Ground Floor');
  const [sceneTab, setSceneTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [sceneImageUrl, setSceneImageUrl] = useState(STARTER_PANORAMAS[0].url);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load companies merging local storage and defaults
    const local = getLocalCompanies();
    setCompanies(local);

    const initialSlug = defaultCompanySlug || local[0]?.slug || '';
    setSelectedCompanySlug(initialSlug);

    // Also background fetch from API
    async function loadCompaniesApi() {
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          if (data.companies && data.companies.length > 0) {
            setCompanies(data.companies);
          }
        }
      } catch (_) {}
    }
    loadCompaniesApi();
  }, [defaultCompanySlug, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setSceneImageUrl(data.url);
          setIsUploading(false);
          return;
        }
      }
    } catch (_) {}

    // Fallback: local FileReader for instant offline preview & usage
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSceneImageUrl(reader.result);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
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

      // Persist the new custom company immediately
      const newComp: Company = {
        id: `comp_${Date.now()}`,
        slug: compSlug,
        name: clientName,
        tagline: 'Client Portfolio',
        primaryColor: '#F0B429',
        toursCount: 1,
      };
      saveLocalCompany(newComp);
      fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComp),
      }).catch(() => {});
    } else {
      const found = companies.find((c) => c.slug === selectedCompanySlug);
      clientName = found ? found.name : 'Client Company';
    }

    if (!title.trim() || !clientName || !slug.trim()) return;

    const initialSceneId = `scene_${Date.now()}`;
    const startingScene: Scene = {
      id: initialSceneId,
      name: sceneName.trim() || 'Starting Room',
      description: 'Starting viewpoint',
      imageUrl: sceneImageUrl,
      thumbnailUrl: sceneImageUrl,
      floor: sceneFloor.trim() || 'Floor 1',
      initialView: { yaw: '0deg', pitch: '0deg', zoom: 50 },
      hotspots: [],
    };

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
        primaryColor: '#F0B429',
        showSceneList: true,
        showGyroscope: true,
        allowFullscreen: true,
      },
      scenes: [startingScene],
    };

    onCreateTour(newTour);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-forest/95 border border-line/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-line/20 flex items-center justify-between bg-ink/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-extrabold text-paper">Create New 360 Tour</h3>
              <p className="text-xs text-muted">Create a custom virtual tour from scratch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-paper hover:bg-forest-light transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Company Assignment */}
          <div className="p-3.5 rounded-xl bg-ink/60 border border-line/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-saffron">
                Client Company / Brand *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCompany(!isCustomCompany)}
                className="text-[11px] text-saffron hover:text-saffron-light font-display font-bold underline"
              >
                {isCustomCompany ? 'Select Existing Company' : '+ New Company'}
              </button>
            </div>

            {isCustomCompany ? (
              <input
                type="text"
                required
                placeholder="e.g. Apex Luxury Real Estate"
                value={customCompanyName}
                onChange={(e) => setCustomCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ink border border-line/40 rounded-xl text-sm text-paper placeholder:text-muted focus:outline-none focus:border-saffron"
              />
            ) : (
              <select
                value={selectedCompanySlug}
                onChange={(e) => setSelectedCompanySlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ink border border-line/40 rounded-xl text-sm text-paper focus:outline-none focus:border-saffron"
              >
                {companies.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} (/c/{c.slug})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tour Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mist mb-1">
                Tour Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bole Sunlit Villa 360"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ink border border-line/30 rounded-xl text-sm text-paper placeholder:text-muted focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-mist mb-1">
                Custom URL Slug *
              </label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-3 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. bole-sunlit-villa"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 bg-ink border border-line/30 rounded-xl text-sm text-paper font-mono placeholder:text-muted focus:outline-none focus:border-saffron"
                />
              </div>
            </div>
          </div>

          {/* Tour Description */}
          <div>
            <label className="block text-xs font-semibold text-mist mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Exclusive walkthrough of modern penthouse featuring 360 panoramas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-ink border border-line/30 rounded-xl text-sm text-paper placeholder:text-muted focus:outline-none focus:border-saffron"
            />
          </div>

          {/* Starting Scene Configuration (Build from scratch) */}
          <div className="p-3.5 rounded-xl bg-ink/70 border border-line/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                First 360 Room / Scene (Starting Point)
              </span>
              <span className="text-[10px] text-muted">You can add more rooms later</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-mist mb-1 block">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  placeholder="e.g. Main Entrance"
                  className="w-full px-3 py-1.5 bg-ink border border-line/40 rounded-xl text-xs text-paper focus:outline-none focus:border-saffron"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-mist mb-1 block">
                  Floor / Wing
                </label>
                <input
                  type="text"
                  value={sceneFloor}
                  onChange={(e) => setSceneFloor(e.target.value)}
                  placeholder="e.g. Ground Floor"
                  className="w-full px-3 py-1.5 bg-ink border border-line/40 rounded-xl text-xs text-paper focus:outline-none focus:border-saffron"
                />
              </div>
            </div>

            {/* 360 Image Selector */}
            <div className="space-y-2 pt-1">
              {/* Selector Tabs */}
              <div className="flex items-center p-1 bg-forest-light rounded-xl border border-line/30 text-[11px] font-display font-bold">
                <button
                  type="button"
                  onClick={() => setSceneTab('upload')}
                  className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                    sceneTab === 'upload'
                      ? 'bg-saffron text-ink shadow-sm'
                      : 'text-mist hover:text-paper'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload 360 File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSceneTab('preset')}
                  className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                    sceneTab === 'preset'
                      ? 'bg-saffron text-ink shadow-sm'
                      : 'text-mist hover:text-paper'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  <span>Sample Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSceneTab('url')}
                  className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                    sceneTab === 'url'
                      ? 'bg-saffron text-ink shadow-sm'
                      : 'text-mist hover:text-paper'
                  }`}
                >
                  <Globe2 className="w-3 h-3" />
                  <span>Image URL</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {sceneTab === 'upload' && (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed rounded-xl bg-forest/30 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer hover:border-saffron transition-all ${
                    isUploading ? 'opacity-70 cursor-wait' : ''
                  }`}
                >
                  <Upload className="w-5 h-5 text-saffron" />
                  <p className="text-xs font-semibold text-paper">
                    {isUploading ? 'Uploading photo...' : 'Click to select 360° photo (Insta360 JPG)'}
                  </p>
                  <p className="text-[10px] text-muted">
                    Equirectangular 2:1 ratio stitched panorama
                  </p>
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
              {sceneTab === 'preset' && (
                <div className="grid grid-cols-2 gap-2">
                  {STARTER_PANORAMAS.map((preset, idx) => {
                    const isSelected = sceneImageUrl === preset.url;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSceneImageUrl(preset.url)}
                        className={`group relative h-16 rounded-xl overflow-hidden border-2 text-left transition-all ${
                          isSelected ? 'border-saffron ring-2 ring-saffron/40' : 'border-line/30'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-1.5 flex items-end justify-between">
                          <p className="text-[10px] font-semibold text-paper truncate">{preset.name}</p>
                          {isSelected && <Check className="w-3 h-3 text-saffron" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* URL Input */}
              {sceneTab === 'url' && (
                <input
                  type="url"
                  value={sceneImageUrl}
                  onChange={(e) => setSceneImageUrl(e.target.value)}
                  placeholder="https://... or /panoramas/room.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-ink border border-line/40 text-paper text-xs placeholder:text-muted focus:outline-none focus:border-saffron"
                />
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-line/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-line/30 text-xs font-semibold text-mist hover:text-paper hover:bg-forest-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !slug.trim() || !sceneImageUrl}
              className="px-5 py-2.5 rounded-xl bg-saffron hover:bg-saffron-hover active:scale-95 text-xs font-display font-extrabold text-ink shadow-lg shadow-saffron/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tour &amp; Open Studio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
