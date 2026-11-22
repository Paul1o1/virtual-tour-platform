'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { defaultTour } from '@/data/default-tour';
import { Tour, Scene, Hotspot, HotspotPosition } from '@/types/tour';
import { AddHotspotModal } from '@/components/editor/AddHotspotModal';
import { AddSceneModal } from '@/components/editor/AddSceneModal';
import { NewTourModal } from '@/components/editor/NewTourModal';
import {
  Compass,
  Layers,
  Sparkles,
  Share2,
  ExternalLink,
  Code2,
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Eye,
  SlidersHorizontal,
  Plus,
  Trash2,
  Target,
  Download,
  Copy,
  RotateCcw,
  Edit3,
  ImageIcon,
  Info,
  Building2,
  Cloud,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import TourViewer with SSR disabled
const TourViewer = dynamic(() => import('@/components/viewer/TourViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-xs uppercase tracking-widest font-mono text-zinc-500">
        Loading 360° Studio...
      </p>
    </div>
  ),
});

const STORAGE_KEY = 'vtour_custom_data_v1';

export default function HomePage() {
  const [tour, setTour] = useState<Tour>(defaultTour);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    defaultTour.startSceneId || defaultTour.scenes[0].id
  );
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const isPlacementModeRef = useRef(isPlacementMode);
  useEffect(() => {
    isPlacementModeRef.current = isPlacementMode;
  }, [isPlacementMode]);

  const [pendingPlacement, setPendingPlacement] = useState<HotspotPosition | null>(null);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [focusPosition, setFocusPosition] = useState<HotspotPosition | null>(null);
  const [isAddSceneOpen, setIsAddSceneOpen] = useState(false);
  const [isNewTourOpen, setIsNewTourOpen] = useState(false);
  const [isTourDropdownOpen, setIsTourDropdownOpen] = useState(false);
  const [allTours, setAllTours] = useState<Array<{ id: string; slug: string; title: string; client: string; sceneCount: number }>>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'local'>('local');

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [origin, setOrigin] = useState('');

  // Fetch list of tours from API
  const fetchToursList = async () => {
    try {
      const res = await fetch('/api/tours');
      if (res.ok) {
        const data = await res.json();
        if (data.tours && data.tours.length > 0) {
          setAllTours(data.tours);
        }
      }
    } catch (_) {}
  };

  // Load saved tour or URL ?tour= on mount
  useEffect(() => {
    setOrigin(window.location.origin);
    fetchToursList();

    const searchParams = new URLSearchParams(window.location.search);
    const requestedTour = searchParams.get('tour');

    if (requestedTour) {
      handleSelectTour(requestedTour);
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scenes && parsed.scenes.length > 0) {
          setTour(parsed);
          setActiveSceneId(parsed.startSceneId || parsed.scenes[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load stored tour', e);
    }
  }, []);

  // Save tour changes to localStorage AND background sync to database
  const saveTour = async (updatedTour: Tour) => {
    setTour(updatedTour);
    setSyncStatus('saving');

    // 1. Instant local persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTour));
    } catch (e) {
      console.warn('Could not save tour to localStorage', e);
    }

    // 2. Background database sync
    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTour),
      });

      if (res.ok) {
        setSyncStatus('synced');
        fetchToursList();
      } else {
        setSyncStatus('local');
      }
    } catch (_) {
      setSyncStatus('local');
    }
  };

  // Switch active tour
  const handleSelectTour = async (selectedSlug: string) => {
    setIsTourDropdownOpen(false);
    try {
      const res = await fetch(`/api/tours/${selectedSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tour) {
          setTour(data.tour);
          setActiveSceneId(data.tour.startSceneId || data.tour.scenes[0]?.id || '');
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tour));
          } catch (_) {}
          return;
        }
      }
    } catch (_) {}

    if (selectedSlug === defaultTour.slug) {
      setTour(defaultTour);
      setActiveSceneId(defaultTour.startSceneId || defaultTour.scenes[0].id);
    }
  };

  // Create new client tour
  const handleCreateNewTour = (newTour: Tour) => {
    setTour(newTour);
    setActiveSceneId(newTour.startSceneId);
    saveTour(newTour);
  };

  const activeScene =
    tour.scenes.find((s) => s.id === activeSceneId) || tour.scenes[0];

  // Panorama clicked while in placement mode
  const handlePanoramaClick = React.useCallback(
    (coords: { yaw: string; pitch: string }) => {
      if (isPlacementModeRef.current) {
        setPendingPlacement(coords);
        setIsPlacementMode(false); // open dialog and pause placement state
      }
    },
    []
  );

  // Add or update hotspot
  const handleAddHotspot = (newHotspot: Hotspot) => {
    const updatedScenes = tour.scenes.map((scene) => {
      if (scene.id === activeSceneId) {
        const exists = scene.hotspots.some((h) => h.id === newHotspot.id);
        const updatedHotspots = exists
          ? scene.hotspots.map((h) => (h.id === newHotspot.id ? newHotspot : h))
          : [...scene.hotspots, newHotspot];
        return {
          ...scene,
          hotspots: updatedHotspots,
        };
      }
      return scene;
    });

    saveTour({
      ...tour,
      scenes: updatedScenes,
    });
    setEditingHotspot(null);
  };

  // Add new scene
  const handleAddScene = (newScene: Scene) => {
    const updatedTour = {
      ...tour,
      scenes: [...tour.scenes, newScene],
    };
    saveTour(updatedTour);
    setActiveSceneId(newScene.id);
  };

  // Delete scene
  const handleDeleteScene = (sceneId: string) => {
    if (tour.scenes.length <= 1) {
      alert('A tour must have at least one scene.');
      return;
    }
    const sceneToDelete = tour.scenes.find((s) => s.id === sceneId);
    if (!confirm(`Are you sure you want to delete room "${sceneToDelete?.name}"?`)) {
      return;
    }

    const remainingScenes = tour.scenes
      .filter((s) => s.id !== sceneId)
      // also cleanup any link hotspots pointing to this deleted scene
      .map((s) => ({
        ...s,
        hotspots: s.hotspots.filter((h) => h.targetSceneId !== sceneId),
      }));

    const nextActive =
      sceneId === activeSceneId
        ? remainingScenes[0]?.id || ''
        : activeSceneId;

    saveTour({
      ...tour,
      scenes: remainingScenes,
      startSceneId:
        tour.startSceneId === sceneId
          ? remainingScenes[0]?.id || ''
          : tour.startSceneId,
    });
    setActiveSceneId(nextActive);
  };

  // Delete a hotspot
  const handleDeleteHotspot = (hotspotId: string) => {
    const updatedScenes = tour.scenes.map((scene) => {
      if (scene.id === activeSceneId) {
        return {
          ...scene,
          hotspots: scene.hotspots.filter((h) => h.id !== hotspotId),
        };
      }
      return scene;
    });

    saveTour({
      ...tour,
      scenes: updatedScenes,
    });
  };

  // Reset to default tour
  const handleResetTour = () => {
    if (confirm('Reset tour back to default art gallery? All custom hotspots will be reset.')) {
      setTour(defaultTour);
      setActiveSceneId(defaultTour.startSceneId || defaultTour.scenes[0].id);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  };

  // Download Tour JSON
  const handleDownloadJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(tour, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${tour.slug}-tour.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy Tour JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tour, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Embed code
  const embedCode = `<iframe src="${
    origin ? `${origin}/embed/${tour.slug}` : `/embed/${tour.slug}`
  }" width="100%" height="600" frameborder="0" allow="fullscreen; gyroscope; accelerometer" allowfullscreen></iframe>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const copyShareLink = () => {
    const url = `${origin || window.location.origin}/tour/${tour.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative w-full h-screen flex flex-col md:flex-row bg-ink text-paper overflow-hidden font-body selection:bg-saffron selection:text-ink">
      {/* Main 360 Viewer Canvas Area */}
      <div className="relative flex-1 h-[60vh] md:h-full border-b md:border-b-0 md:border-r border-line/20">
        <TourViewer
          tour={tour}
          activeSceneId={activeSceneId}
          onSceneChange={setActiveSceneId}
          isPlacementMode={isPlacementMode}
          onPanoramaClick={handlePanoramaClick}
          focusPosition={focusPosition}
        />
      </div>

      {/* Sidebar Control & Information Studio */}
      <div className="w-full md:w-[440px] lg:w-[480px] h-[40vh] md:h-full flex flex-col bg-ink border-t md:border-t-0 border-line/20 text-paper overflow-hidden">
        {/* Top Studio Header & Mode Tabs */}
        <div className="p-4 border-b border-line/20 bg-forest/80 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* Tour Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTourDropdownOpen(!isTourDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink/90 hover:bg-ink border border-line/30 text-left transition-colors group shadow-md"
              >
                <Building2 className="w-4 h-4 text-saffron shrink-0" />
                <div className="max-w-[170px] sm:max-w-[210px] truncate">
                  <div className="text-[10px] font-display font-bold text-saffron uppercase tracking-wider truncate">
                    {tour.client || 'Client Tour'}
                  </div>
                  <div className="text-xs font-display font-extrabold text-paper truncate">
                    {tour.title}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted group-hover:text-paper transition-colors" />
              </button>

              {/* Dropdown Menu */}
              {isTourDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-forest border border-line/30 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 text-paper">
                  <div className="px-3 py-1.5 text-[10px] font-display font-extrabold text-saffron uppercase tracking-wider">
                    Select Client Tour
                  </div>

                  {/* Tour List */}
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {allTours.map((t) => (
                      <button
                        key={t.slug}
                        onClick={() => handleSelectTour(t.slug)}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between ${
                          t.slug === tour.slug
                            ? 'bg-saffron text-ink font-display font-bold shadow-sm'
                            : 'text-paper hover:bg-forest-light'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="truncate font-semibold">{t.title}</p>
                          <p className="text-[10px] opacity-75 truncate">{t.client}</p>
                        </div>
                        {t.slug === tour.slug && <Check className="w-3.5 h-3.5 text-ink shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Actions & Links */}
                  <div className="pt-1.5 border-t border-line/20 space-y-1">
                    <button
                      onClick={() => {
                        setIsTourDropdownOpen(false);
                        setIsNewTourOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-ink text-xs font-display font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ New Client Tour</span>
                    </button>

                    {tour.companySlug && (
                      <Link
                        href={`/c/${tour.companySlug}`}
                        className="w-full px-3 py-1.5 rounded-xl bg-ink/70 hover:bg-ink text-paper text-[11px] font-semibold flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">Open {tour.client} Portal</span>
                        <ExternalLink className="w-3 h-3 text-saffron shrink-0" />
                      </Link>
                    )}

                    <Link
                      href="/companies"
                      className="w-full px-3 py-1.5 rounded-xl text-muted hover:text-paper text-[11px] font-medium flex items-center justify-between hover:bg-ink/50 transition-colors"
                    >
                      <span>Agency Client Directory</span>
                      <Building2 className="w-3 h-3 text-teal shrink-0" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink/80 border border-line/20 text-[10px] font-medium text-muted">
              <Cloud className={`w-3 h-3 ${syncStatus === 'saving' ? 'animate-pulse text-saffron' : syncStatus === 'synced' ? 'text-teal' : 'text-muted'}`} />
              <span>{syncStatus === 'saving' ? 'Saving...' : syncStatus === 'synced' ? 'Cloud Synced' : 'Saved Locally'}</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-ink/90 rounded-2xl border border-line/20 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('editor');
                setIsPlacementMode(false);
              }}
              className={`flex-1 py-1.5 rounded-xl text-center font-display font-bold transition-all ${
                activeTab === 'editor'
                  ? 'bg-saffron text-ink shadow-md font-extrabold'
                  : 'text-muted hover:text-paper'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => {
                setActiveTab('preview');
                setIsPlacementMode(false);
              }}
              className={`flex-1 py-1.5 rounded-xl text-center font-display font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-saffron text-ink shadow-md font-extrabold'
                  : 'text-muted hover:text-paper'
              }`}
            >
              Embed / Share
            </button>
          </div>
        </div>

        {/* Studio Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'editor' ? (
            /* HOTSPOT & SCENE EDITOR PANEL */
            <div className="space-y-4">
              {/* Placement Action Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-zinc-900 border border-blue-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-400" />
                    Interactive Hotspot Placement
                  </span>
                  <span className="text-[10px] text-blue-300 font-mono bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-800/60">
                    Room: {activeScene.name}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Click the button below, then click anywhere on the 360 photo to place a link marker to another room or an info card popup!
                </p>

                <button
                  onClick={() => setIsPlacementMode(!isPlacementMode)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isPlacementMode
                      ? 'bg-amber-500 text-zinc-950 shadow-amber-500/25 ring-2 ring-white/50 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isPlacementMode
                      ? '🎯 Click on 360 Photo to Place (Click to Cancel)'
                      : '+ Click Anywhere on 360 Photo to Place Hotspot'}
                  </span>
                </button>
              </div>

              {/* Active Room Scene Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Rooms / Scenes ({tour.scenes.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddSceneOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md shadow-blue-600/25 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Room</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {tour.scenes.map((scene) => {
                    const isActive = scene.id === activeSceneId;
                    return (
                      <button
                        key={scene.id}
                        onClick={() => {
                          setActiveSceneId(scene.id);
                          setIsPlacementMode(false);
                        }}
                        className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all ${
                          isActive
                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                            : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="relative h-16 bg-zinc-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={scene.thumbnailUrl || scene.imageUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-blue-500 text-white">
                              <Eye className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-zinc-900/90">
                          <p className="text-xs font-semibold text-white truncate">
                            {scene.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {scene.hotspots.length} hotspots placed
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Placed Hotspots in Current Room */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Hotspots in {activeScene.name} ({activeScene.hotspots.length})
                  </label>
                  {activeScene.hotspots.length > 0 && (
                    <span className="text-[10px] text-zinc-500">
                      Click target to look at marker
                    </span>
                  )}
                </div>

                {activeScene.hotspots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-1">
                    <p className="text-xs font-semibold text-zinc-400">
                      No hotspots placed in this room yet
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Click the &quot;Place Hotspot&quot; button above and pick any spot on the photo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeScene.hotspots.map((hotspot) => {
                      const isLink = hotspot.type === 'link';
                      const targetScene = tour.scenes.find(
                        (s) => s.id === hotspot.targetSceneId
                      );

                      return (
                        <div
                          key={hotspot.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Visual Thumbnail or Icon */}
                            {isLink ? (
                              targetScene ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-blue-500/40 flex-shrink-0 bg-zinc-950 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={targetScene.thumbnailUrl || targetScene.imageUrl}
                                    alt={targetScene.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-blue-900/20" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg flex-shrink-0 bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                  <Compass className="w-4 h-4" />
                                </div>
                              )
                            ) : hotspot.info?.mediaUrl ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-500/40 flex-shrink-0 bg-zinc-950 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={hotspot.info.mediaUrl}
                                  alt={hotspot.info.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg flex-shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <Info className="w-4 h-4" />
                              </div>
                            )}

                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-white truncate">
                                {isLink
                                  ? hotspot.label || `Walk to ${targetScene?.name}`
                                  : hotspot.info?.title || hotspot.label}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                <span className="font-mono text-zinc-500">
                                  {String(hotspot.position.yaw)}, {String(hotspot.position.pitch)}
                                </span>
                                {isLink && targetScene && (
                                  <span className="text-blue-400 font-medium truncate">
                                    → {targetScene.name}
                                  </span>
                                )}
                                {!isLink && hotspot.info?.category && (
                                  <span className="text-amber-400 font-medium truncate">
                                    • {hotspot.info.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Focus / Animate Camera to Hotspot */}
                            <button
                              onClick={() => setFocusPosition(hotspot.position)}
                              title="Turn camera to look at hotspot"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            >
                              <Target className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Hotspot */}
                            <button
                              onClick={() => {
                                setEditingHotspot(hotspot);
                                setPendingPlacement(hotspot.position);
                              }}
                              title="Edit hotspot & change image"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Hotspot */}
                            <button
                              onClick={() => handleDeleteHotspot(hotspot.id)}
                              title="Delete hotspot"
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-900/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tour Data Management */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Export & Save Tour JSON
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download JSON</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    {copiedJson ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>{copiedJson ? 'Copied!' : 'Copy Tour JSON'}</span>
                  </button>
                </div>

                <button
                  onClick={handleResetTour}
                  className="w-full py-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Tour to Default Gallery</span>
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW / EMBED PANEL */
            <div className="space-y-4">
              {/* Direct Route Links */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Test & Share Routes
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/tour/${tour.slug}`}
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Full-Page Tour View</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        /tour/{tour.slug} (Client shareable link)
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href={`/embed/${tour.slug}`}
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Chromeless Embed View</span>
                        <Code2 className="w-3 h-3 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        /embed/{tour.slug} (For iframes in Wix/WP)
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </Link>
                </div>
              </div>

              {/* 1-Click Embed Snippet */}
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    Embed Code Snippet
                  </span>
                  <button
                    onClick={copyEmbed}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    {copiedEmbed ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <span>Copy Code</span>
                    )}
                  </button>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 font-mono text-[10px] text-zinc-400 break-all select-all leading-relaxed">
                  {embedCode}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Includes allow=&quot;fullscreen; gyroscope; accelerometer&quot; for instant mobile orientation.
                </p>
              </div>

              {/* Insta360 Instructions */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2">
                <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Using Your Own Photos
                </h4>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Drop your stitched 2:1 JPG panoramas into the <code className="text-blue-300 bg-blue-900/50 px-1 py-0.5 rounded">public/</code> folder, then link them in your scene configurations or export the tour JSON!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <button
            onClick={copyShareLink}
            className="flex-1 mr-2 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Hotspot Modal Dialog */}
      {pendingPlacement && (
        <AddHotspotModal
          position={pendingPlacement}
          currentSceneId={activeSceneId}
          scenes={tour.scenes}
          isOpen={Boolean(pendingPlacement)}
          onClose={() => {
            setPendingPlacement(null);
            setEditingHotspot(null);
          }}
          onAddHotspot={handleAddHotspot}
          editingHotspot={editingHotspot}
        />
      )}

      {/* Add New Room / Scene Modal */}
      <AddSceneModal
        isOpen={isAddSceneOpen}
        onClose={() => setIsAddSceneOpen(false)}
        onAddScene={handleAddScene}
        existingCount={tour.scenes.length}
      />

      {/* Create New Client Tour Modal */}
      <NewTourModal
        isOpen={isNewTourOpen}
        onClose={() => setIsNewTourOpen(false)}
        onCreateTour={handleCreateNewTour}
      />
    </div>
  );
}
