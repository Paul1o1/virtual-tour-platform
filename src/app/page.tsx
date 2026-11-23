'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { defaultTour } from '@/data/default-tour';
import { Tour, Scene, Hotspot, HotspotPosition, HotspotStyle } from '@/types/tour';
import { AddHotspotModal } from '@/components/editor/AddHotspotModal';
import { AddSceneModal } from '@/components/editor/AddSceneModal';
import { NewTourModal } from '@/components/editor/NewTourModal';
import { CloudSyncModal } from '@/components/editor/CloudSyncModal';
import { getSupabaseClient } from '@/lib/supabase';
import { getLocalTourBySlug, saveLocalTour, getLocalToursList } from '@/lib/client-storage';
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
      <div className="w-10 h-10 border-4 border-saffron/20 border-t-saffron rounded-full animate-spin" />
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
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [focusPosition, setFocusPosition] = useState<HotspotPosition | null>(null);
  const [isAddSceneOpen, setIsAddSceneOpen] = useState(false);
  const [isNewTourOpen, setIsNewTourOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [newTourDefaultCompany, setNewTourDefaultCompany] = useState<string | undefined>(undefined);
  const [isTourDropdownOpen, setIsTourDropdownOpen] = useState(false);
  const [allTours, setAllTours] = useState<Array<{ id: string; slug: string; title: string; client: string; sceneCount: number }>>(() => {
    if (typeof window !== 'undefined') {
      return getLocalToursList();
    }
    return [];
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'local'>('local');

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [origin, setOrigin] = useState('');

  // Fetch list of tours from API and merge with local
  const fetchToursList = async () => {
    const localList = getLocalToursList();
    setAllTours(localList);
    try {
      const res = await fetch('/api/tours');
      if (res.ok) {
        const data = await res.json();
        if (data.tours && data.tours.length > 0) {
          setAllTours((prev) => {
            const map = new Map<string, any>();
            prev.forEach((t) => map.set(t.slug, t));
            data.tours.forEach((t: any) => map.set(t.slug, t));
            return Array.from(map.values());
          });
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
    const isNew = searchParams.get('newTour');
    const compSlug = searchParams.get('companySlug');

    if (isNew === 'true') {
      if (compSlug) setNewTourDefaultCompany(compSlug);
      setIsNewTourOpen(true);
    }

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

    // 1. Instant local persistence (both slug key and active key)
    try {
      saveLocalTour(updatedTour);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTour));
    } catch (e) {
      console.warn('Could not save tour to localStorage', e);
    }

    // 2. Direct client-side Supabase sync if credentials exist
    let clientSynced = false;
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('tours').upsert({
          id: updatedTour.id,
          company_id: updatedTour.companyId || null,
          company_slug: updatedTour.companySlug || null,
          slug: updatedTour.slug,
          title: updatedTour.title,
          client: updatedTour.client,
          description: updatedTour.description || '',
          start_scene_id: updatedTour.startSceneId,
          status: updatedTour.status || 'published',
          settings: updatedTour.settings,
          updated_at: new Date().toISOString(),
        });

        for (let i = 0; i < updatedTour.scenes.length; i++) {
          const s = updatedTour.scenes[i];
          await client.from('scenes').upsert({
            id: s.id,
            tour_id: updatedTour.id,
            name: s.name,
            description: s.description || '',
            image_url: s.imageUrl,
            thumbnail_url: s.thumbnailUrl || s.imageUrl,
            floor: String(s.floor || 'Floor 1'),
            order_index: i,
            initial_view: s.initialView || { yaw: 0, pitch: 0, zoom: 50 },
          });

          await client.from('hotspots').delete().eq('scene_id', s.id);
          if (s.hotspots && s.hotspots.length > 0) {
            const payload = s.hotspots.map((h) => ({
              id: h.id,
              scene_id: s.id,
              type: h.type,
              position: h.position,
              target_scene_id: h.targetSceneId || null,
              target_heading: h.targetHeading || null,
              label: h.label || null,
              info: h.info || null,
            }));
            await client.from('hotspots').insert(payload);
          }
        }
        clientSynced = true;
      } catch (err) {
        console.warn('Direct client Supabase sync:', err);
      }
    }

    // 3. Background server database sync
    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTour),
      });

      if (res.ok || clientSynced) {
        setSyncStatus('synced');
        fetchToursList();
      } else {
        setSyncStatus('local');
      }
    } catch (_) {
      setSyncStatus(clientSynced ? 'synced' : 'local');
    }
  };

  // Switch active tour
  const handleSelectTour = async (selectedSlug: string) => {
    setIsTourDropdownOpen(false);

    // 1. Instant local load
    const local = getLocalTourBySlug(selectedSlug);
    if (local) {
      setTour(local);
      setActiveSceneId(local.startSceneId || local.scenes[0]?.id || '');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      } catch (_) {}
    }

    // 2. Fetch from API
    try {
      const res = await fetch(`/api/tours/${selectedSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tour) {
          setTour(data.tour);
          setActiveSceneId(data.tour.startSceneId || data.tour.scenes[0]?.id || '');
          saveLocalTour(data.tour);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tour));
          } catch (_) {}
          return;
        }
      }
    } catch (_) {}

    if (selectedSlug === defaultTour.slug && !local) {
      setTour(defaultTour);
      setActiveSceneId(defaultTour.startSceneId || defaultTour.scenes[0].id);
    }
  };

  // Create new client tour
  const handleCreateNewTour = (newTour: Tour) => {
    setTour(newTour);
    setActiveSceneId(newTour.startSceneId);
    saveTour(newTour);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/?tour=${newTour.slug}`);
    }
    fetchToursList();
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

  // Add or update hotspot — use functional setTour to avoid stale closure
  const handleAddHotspot = (newHotspot: Hotspot) => {
    const updatedScenes = tour.scenes.map((scene) => {
      if (scene.id === activeSceneId) {
        const exists = scene.hotspots.some((h) => h.id === newHotspot.id);
        const updatedHotspots = exists
          ? scene.hotspots.map((h) => (h.id === newHotspot.id ? newHotspot : h))
          : [...scene.hotspots, newHotspot];
        return { ...scene, hotspots: updatedHotspots };
      }
      return scene;
    });
    const updatedTour = { ...tour, scenes: updatedScenes };
    saveTour(updatedTour);
    setEditingHotspot(null);
  };

  // Update default hotspot/arrow design for the tour
  const handleSetDefaultHotspotStyle = (newStyle: HotspotStyle) => {
    const updatedTour: Tour = {
      ...tour,
      settings: {
        ...tour.settings,
        defaultHotspotStyle: newStyle,
      },
    };
    saveTour(updatedTour);
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

  // Update existing scene (rename or change 360 photo)
  const handleUpdateScene = (updatedScene: Scene) => {
    const updatedScenes = tour.scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s));
    const updatedTour = {
      ...tour,
      scenes: updatedScenes,
    };
    saveTour(updatedTour);
    setEditingScene(null);
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

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewTourDefaultCompany(tour.companySlug);
                  setIsNewTourOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-saffron hover:bg-saffron-hover text-ink text-xs font-display font-extrabold shadow-md transition-all active:scale-95"
                title="Create a new virtual tour from scratch"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Tour</span>
              </button>

              <Link
                href="/companies"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ink hover:bg-forest-light text-mist hover:text-paper border border-line/30 text-xs font-display font-bold transition-colors"
                title="Agency Client Directory & Portals"
              >
                <Building2 className="w-3.5 h-3.5 text-teal" />
                <span>Companies</span>
              </Link>

              {/* Cloud Sync Status Button */}
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ink/90 hover:bg-forest-light border border-line/30 text-[11px] font-display font-bold text-mist hover:text-paper transition-all shadow-sm group"
                title="Supabase Cloud Database Sync"
              >
                <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'saving' ? 'animate-pulse text-saffron' : syncStatus === 'synced' ? 'text-teal' : 'text-saffron'}`} />
                <span>{syncStatus === 'saving' ? 'Syncing...' : syncStatus === 'synced' ? 'Cloud Synced' : 'Cloud Sync'}</span>
              </button>
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-forest/70 to-ink border border-teal/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-extrabold text-paper flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-saffron" />
                    Interactive Hotspot Placement
                  </span>
                  <span className="text-[10px] text-saffron font-display font-bold bg-ink/80 px-2 py-0.5 rounded-full border border-saffron/30">
                    Room: {activeScene.name}
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  Click the button below, then click anywhere on the 360 photo to place a link marker to another room or an info card popup!
                </p>

                <button
                  onClick={() => setIsPlacementMode(!isPlacementMode)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-display font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isPlacementMode
                      ? 'bg-saffron text-ink shadow-saffron/25 ring-4 ring-saffron/40 animate-pulse'
                      : 'bg-saffron hover:bg-saffron-hover active:scale-98 text-ink shadow-lg'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isPlacementMode
                      ? '🎯 Click on 360 Photo to Place (Click to Cancel)'
                      : '+ Click Anywhere on 360 Photo to Place Hotspot'}
                  </span>
                </button>

                {/* Hotspot & Arrow Design Picker */}
                <div className="pt-2 border-t border-line/15 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-display font-bold text-paper flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-saffron" />
                      Marker Design:
                    </span>
                    <span className="text-[10px] text-saffron font-display font-bold">
                      {tour.settings.defaultHotspotStyle === 'modern-chevron'
                        ? 'Direction Arrow'
                        : tour.settings.defaultHotspotStyle === 'matterport-tag'
                        ? 'Matterport Tag'
                        : tour.settings.defaultHotspotStyle === 'glowing-beacon'
                        ? 'Beacon'
                        : tour.settings.defaultHotspotStyle === 'minimal-ring'
                        ? 'Minimal Ring'
                        : 'Matterport Ring'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'matterport-ring', label: 'Matterport Ring', icon: '🔘' },
                      { id: 'modern-chevron', label: 'Arrow', icon: '⬆️' },
                      { id: 'matterport-tag', label: 'Tag Pin', icon: '🎯' },
                    ].map((opt) => {
                      const isSelected =
                        (tour.settings.defaultHotspotStyle || 'matterport-ring') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSetDefaultHotspotStyle(opt.id as HotspotStyle)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-display font-bold flex items-center justify-center gap-1 border transition-all ${
                            isSelected
                              ? 'bg-saffron text-ink border-saffron shadow-md'
                              : 'bg-ink/70 border-line/20 text-muted hover:text-paper hover:border-line/40'
                          }`}
                          title={`Set default design to ${opt.label}`}
                        >
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Room Scene Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-display font-bold uppercase tracking-wider text-muted">
                    Rooms / Scenes ({tour.scenes.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingScene(null);
                      setIsAddSceneOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal hover:bg-teal-light text-paper text-[11px] font-display font-bold shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Room</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {tour.scenes.map((scene) => {
                    const isActive = scene.id === activeSceneId;
                    return (
                      <div
                        key={scene.id}
                        className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all ${
                          isActive
                            ? 'border-saffron ring-2 ring-saffron/40 shadow-lg'
                            : 'border-line/20 hover:border-line/40 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSceneId(scene.id);
                            setIsPlacementMode(false);
                          }}
                          className="w-full text-left"
                        >
                          <div className="relative h-16 bg-ink">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={scene.thumbnailUrl || scene.imageUrl}
                              alt={scene.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                            {isActive && (
                              <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-saffron text-ink">
                                <Eye className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-ink/90">
                            <p className="text-xs font-display font-bold text-paper truncate">
                              {scene.name}
                            </p>
                            <p className="text-[10px] text-muted truncate">
                              {scene.hotspots.length} hotspots placed
                            </p>
                          </div>
                        </button>

                        {/* Quick Scene Controls: Edit & Delete */}
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingScene(scene);
                              setIsAddSceneOpen(true);
                            }}
                            className="p-1 rounded-md bg-forest/90 hover:bg-forest text-saffron hover:text-saffron-light border border-line/30 shadow-md transition-colors"
                            title="Edit room details or change photo"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {tour.scenes.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScene(scene.id);
                              }}
                              className="p-1 rounded-md bg-red-950/90 hover:bg-red-900 text-red-300 hover:text-red-100 border border-red-800/40 shadow-md transition-colors"
                              title="Delete room"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Placed Hotspots in Current Room */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-display font-bold uppercase tracking-wider text-muted">
                    Hotspots in {activeScene.name} ({activeScene.hotspots.length})
                  </label>
                  {activeScene.hotspots.length > 0 && (
                    <span className="text-[10px] text-muted">
                      Click target to look at marker
                    </span>
                  )}
                </div>

                {activeScene.hotspots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-forest/40 border border-line/15 text-center space-y-1">
                    <p className="text-xs font-semibold text-muted">
                      No hotspots placed in this room yet
                    </p>
                    <p className="text-[11px] text-muted/80">
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
                          className="flex items-center justify-between p-3 rounded-xl bg-forest/60 border border-line/15 hover:border-line/30 transition-all group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Visual Thumbnail or Icon */}
                            {isLink ? (
                              targetScene ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-teal/40 flex-shrink-0 bg-ink relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={targetScene.thumbnailUrl || targetScene.imageUrl}
                                    alt={targetScene.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-teal/20" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg flex-shrink-0 bg-teal/20 text-teal border border-teal/30">
                                  <Compass className="w-4 h-4" />
                                </div>
                              )
                            ) : hotspot.info?.mediaUrl ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-saffron/40 flex-shrink-0 bg-ink relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={hotspot.info.mediaUrl}
                                  alt={hotspot.info.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg flex-shrink-0 bg-saffron/20 text-saffron border border-saffron/30">
                                <Info className="w-4 h-4" />
                              </div>
                            )}

                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-paper truncate">
                                {isLink
                                  ? hotspot.label || `Walk to ${targetScene?.name}`
                                  : hotspot.info?.title || hotspot.label}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-muted">
                                <span className="font-mono text-muted/80">
                                  {String(hotspot.position.yaw)}, {String(hotspot.position.pitch)}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-ink/90 border border-line/20 text-muted/90 font-display font-medium">
                                  {hotspot.style === 'matterport-ring'
                                    ? 'Matterport Ring'
                                    : hotspot.style === 'modern-chevron'
                                    ? 'Arrow'
                                    : hotspot.style === 'matterport-tag'
                                    ? 'Tag Pin'
                                    : hotspot.style === 'glowing-beacon'
                                    ? 'Beacon'
                                    : hotspot.style === 'minimal-ring'
                                    ? 'Minimal Ring'
                                    : (isLink ? 'Matterport Ring' : 'Matterport Tag')}
                                </span>
                                {isLink && targetScene && (
                                  <span className="text-teal font-medium truncate">
                                    → {targetScene.name}
                                  </span>
                                )}
                                {!isLink && hotspot.info?.category && (
                                  <span className="text-saffron font-medium truncate">
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
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-forest/80 hover:bg-forest border border-line/20 text-paper text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-saffron" />
                    <span>Download JSON</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-forest/80 hover:bg-forest border border-line/20 text-paper text-xs font-semibold transition-colors"
                  >
                    {copiedJson ? (
                      <Check className="w-3.5 h-3.5 text-teal" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-saffron" />
                    )}
                    <span>{copiedJson ? 'Copied!' : 'Copy Tour JSON'}</span>
                  </button>
                </div>

                <button
                  onClick={handleResetTour}
                  className="w-full py-2 text-[11px] font-semibold text-muted hover:text-paper flex items-center justify-center gap-1 transition-colors"
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
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Test &amp; Share Routes
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/tour/${tour.slug}`}
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl bg-forest/60 hover:bg-forest border border-line/20 hover:border-saffron/50 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-paper flex items-center gap-1.5">
                        <span>Full-Page Tour View</span>
                        <ExternalLink className="w-3 h-3 text-muted group-hover:text-saffron transition-colors" />
                      </div>
                      <p className="text-[11px] text-muted">
                        /tour/{tour.slug} (Client shareable link)
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-paper transition-colors" />
                  </Link>

                  <Link
                    href={`/embed/${tour.slug}`}
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl bg-forest/60 hover:bg-forest border border-line/20 hover:border-saffron/50 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-paper flex items-center gap-1.5">
                        <span>Chromeless Embed View</span>
                        <Code2 className="w-3 h-3 text-muted group-hover:text-saffron transition-colors" />
                      </div>
                      <p className="text-[11px] text-muted">
                        /embed/{tour.slug} (For iframes in Wix/WP)
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-paper transition-colors" />
                  </Link>
                </div>
              </div>

              {/* 1-Click Embed Snippet */}
              <div className="p-4 bg-forest/70 rounded-2xl border border-line/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-paper flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-saffron" />
                    Embed Code Snippet
                  </span>
                  <button
                    onClick={copyEmbed}
                    className="text-[11px] font-semibold text-saffron hover:text-saffron-light transition-colors flex items-center gap-1"
                  >
                    {copiedEmbed ? (
                      <>
                        <Check className="w-3 h-3 text-teal" />
                        <span className="text-teal">Copied!</span>
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
              <div className="p-4 rounded-2xl bg-forest/50 border border-line/20 space-y-2">
                <h4 className="text-xs font-display font-bold text-saffron flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  Using Your Own Photos
                </h4>
                <p className="text-[11px] text-muted leading-relaxed">
                  Drop your stitched 2:1 JPG panoramas into the <code className="text-saffron bg-ink px-1 py-0.5 rounded border border-line/20">public/</code> folder, then link them in your scene configurations or upload directly through the editor!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line/20 bg-forest/60 flex items-center justify-between">
          <button
            onClick={copyShareLink}
            className="flex-1 mr-2 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-display font-extrabold rounded-xl bg-saffron hover:bg-saffron-hover text-ink transition-all shadow-lg"
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
        onClose={() => {
          setIsAddSceneOpen(false);
          setEditingScene(null);
        }}
        onAddScene={handleAddScene}
        onUpdateScene={handleUpdateScene}
        editingScene={editingScene}
        existingCount={tour.scenes.length}
      />

      {/* Create New Client Tour Modal */}
      <NewTourModal
        isOpen={isNewTourOpen}
        onClose={() => {
          setIsNewTourOpen(false);
          setNewTourDefaultCompany(undefined);
        }}
        onCreateTour={handleCreateNewTour}
        defaultCompanySlug={newTourDefaultCompany}
      />

      {/* Cloud Database Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        tour={tour}
        onSyncComplete={() => {
          setSyncStatus('synced');
          fetchToursList();
        }}
      />
    </div>
  );
}
