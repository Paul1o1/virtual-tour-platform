'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tour, Scene, Hotspot, HotspotInfo } from '@/types/tour';
import { HotspotModal } from './HotspotModal';
import { SceneNav } from './SceneNav';
import { FloorPlanRadar } from './FloorPlanRadar';
import { LeadCaptureModal } from './LeadCaptureModal';
import {
  Maximize,
  Minimize,
  Compass,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Info,
  Smartphone,
  Share2,
  Code2,
  Crosshair,
  Calendar,
} from 'lucide-react';

interface TourViewerProps {
  tour: Tour;
  embedMode?: boolean;
  activeSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  isPlacementMode?: boolean;
  onPanoramaClick?: (coords: { yaw: string; pitch: string }) => void;
  focusPosition?: { yaw: string | number; pitch: string | number } | null;
}

export default function TourViewer({
  tour,
  embedMode = false,
  activeSceneId,
  onSceneChange,
  isPlacementMode = false,
  onPanoramaClick,
  focusPosition,
}: TourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const virtualTourPluginRef = useRef<any>(null);
  const markersPluginRef = useRef<any>(null);
  const autorotatePluginRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  const onPanoramaClickRef = useRef(onPanoramaClick);
  useEffect(() => {
    onPanoramaClickRef.current = onPanoramaClick;
  }, [onPanoramaClick]);

  const isPlacementModeRef = useRef(isPlacementMode);
  useEffect(() => {
    isPlacementModeRef.current = isPlacementMode;
  }, [isPlacementMode]);

  const [currentSceneId, setCurrentSceneId] = useState<string>(
    activeSceneId || tour.startSceneId || tour.scenes[0]?.id
  );
  const [activeInfo, setActiveInfo] = useState<HotspotInfo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(tour.settings.autoRotate ?? true);
  const [showSceneDrawer, setShowSceneDrawer] = useState(false);
  const [showCoordsHelper, setShowCoordsHelper] = useState(false);
  const [lastClickedCoords, setLastClickedCoords] = useState<{ yaw: string; pitch: string } | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [currentYawDeg, setCurrentYawDeg] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const currentScene =
    tour.scenes.find((s) => s.id === currentSceneId) || tour.scenes[0];

  // SVG for Link hotspot (walk to next panorama floor icon) - Addis 360 Forest + Saffron
  const createLinkMarkerSvg = (label: string) => `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;" class="psv-custom-link-marker group cursor-pointer pointer-events-auto">
      <div class="w-11 h-11 rounded-full bg-[#0E3B34]/90 border-2 border-[#F0B429] shadow-2xl flex items-center justify-center animate-marker-pulse text-[#F0B429] group-hover:scale-110 group-hover:bg-[#16534A] transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>
      <div class="mt-1 px-2.5 py-1 rounded-md bg-[#0E3B34]/95 backdrop-blur-md border border-[#F0B429]/40 text-[#FBFCFA] text-[11px] font-display font-bold whitespace-nowrap shadow-xl">
        ${label}
      </div>
    </div>
  `;

  // SVG for Info hotspot (painting / detail popup icon) - Addis 360 Saffron + Ink
  const createInfoMarkerSvg = (title: string) => `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;" class="psv-custom-info-marker group cursor-pointer pointer-events-auto">
      <div class="w-9 h-9 rounded-full bg-[#F0B429] border-2 border-[#0E3B34] shadow-2xl flex items-center justify-center text-[#14201D] font-bold group-hover:scale-110 group-hover:bg-[#F7CB65] transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      <div class="mt-1 px-2.5 py-1 rounded-md bg-[#14201D]/90 backdrop-blur-md border border-[#F0B429]/40 text-[#F0B429] text-[11px] font-display font-bold whitespace-nowrap shadow-xl">
        ${title}
      </div>
    </div>
  `;

  // Build nodes configuration for VirtualTourPlugin
  const buildNodes = useCallback(
    (tourData: Tour) => {
      return tourData.scenes.map((scene) => ({
        id: scene.id,
        panorama: scene.imageUrl,
        thumbnail: scene.thumbnailUrl || scene.imageUrl,
        name: scene.name,
        caption: scene.name,
        defaultYaw: scene.initialView?.yaw || 0,
        defaultPitch: scene.initialView?.pitch || 0,
        defaultZoomLvl: scene.initialView?.zoom || 50,
        links: scene.hotspots
          .filter((h) => h.type === 'link' && h.targetSceneId)
          .map((h) => ({
            nodeId: h.targetSceneId!,
            position: h.position,
            marker: {
              html: createLinkMarkerSvg(h.label || 'Walk forward'),
              tooltip: h.label || 'Enter room',
              size: { width: 140, height: 76 },
              anchor: 'bottom center',
            },
          })),
        markers: scene.hotspots
          .filter((h) => h.type === 'info')
          .map((h) => ({
            id: h.id,
            position: h.position,
            html: createInfoMarkerSvg(h.info?.title || h.label || 'Information'),
            tooltip: h.info?.title || h.label,
            size: { width: 140, height: 65 },
            anchor: 'center center',
            data: h.info,
          })),
      }));
    },
    []
  );

  // Initialize Photo Sphere Viewer dynamically
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    async function initPSV() {
      const { Viewer } = await import('@photo-sphere-viewer/core');
      const { VirtualTourPlugin } = await import('@photo-sphere-viewer/virtual-tour-plugin');
      const { MarkersPlugin } = await import('@photo-sphere-viewer/markers-plugin');
      const { AutorotatePlugin } = await import('@photo-sphere-viewer/autorotate-plugin');

      if (!isMounted || !containerRef.current) return;

      // Clean up existing instance if any
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
      }

      const nodes = buildNodes(tour);

      const viewer = new Viewer({
        container: containerRef.current,
        loadingTxt: '',
        navbar: false, // Sleek custom UI
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        plugins: [
          [VirtualTourPlugin, {
            positionMode: 'manual',
            renderMode: '2d',
            transitionOptions: {
              showLoader: false,
              effect: 'fade',
              speed: '20rpm',
              rotation: false,
            },
          }],
          [MarkersPlugin, {}],
          [AutorotatePlugin, {
            autostartDelay: tour.settings.autoRotateDelay || 3500,
            autorotateSpeed: tour.settings.autoRotateSpeed || '0.4rpm',
          }],
        ],
      });

      viewerInstanceRef.current = viewer;

      const virtualTour = viewer.getPlugin(VirtualTourPlugin) as any;
      virtualTourPluginRef.current = virtualTour;

      const markersPlugin = viewer.getPlugin(MarkersPlugin) as any;
      markersPluginRef.current = markersPlugin;

      const autorotatePlugin = viewer.getPlugin(AutorotatePlugin) as any;
      autorotatePluginRef.current = autorotatePlugin;

      // Load nodes into virtual tour
      const initialNode = activeSceneId || tour.startSceneId || tour.scenes[0]?.id;
      virtualTour.setNodes(nodes, initialNode);
      isInitializedRef.current = true;

      // Listen for scene change
      virtualTour.addEventListener('node-changed', (e: any) => {
        if (!isMounted) return;
        setCurrentSceneId(e.node.id);
        if (onSceneChange) {
          onSceneChange(e.node.id);
        }
      });

      // Listen for marker clicks (info popups)
      markersPlugin.addEventListener('select-marker', (e: any) => {
        if (!isMounted) return;
        if (e.marker.data) {
          setActiveInfo(e.marker.data as HotspotInfo);
        }
      });

      // Listen for camera rotation to feed live radar cone on 2D floor plan
      viewer.addEventListener('position-updated', (e: any) => {
        if (!isMounted) return;
        if (e.position && e.position.yaw !== undefined) {
          const deg = Math.round(((e.position.yaw * 180) / Math.PI) % 360);
          setCurrentYawDeg(deg < 0 ? deg + 360 : deg);
        }
      });

      // Click listener for coordinate inspection & hotspot placement
      viewer.addEventListener('click', (e: any) => {
        if (e.data && e.data.yaw !== undefined) {
          const yawDeg = ((e.data.yaw * 180) / Math.PI).toFixed(1) + 'deg';
          const pitchDeg = ((e.data.pitch * 180) / Math.PI).toFixed(1) + 'deg';
          setLastClickedCoords({ yaw: yawDeg, pitch: pitchDeg });
          if (onPanoramaClickRef.current) {
            onPanoramaClickRef.current({ yaw: yawDeg, pitch: pitchDeg });
          }
        }
      });

      if (!tour.settings.autoRotate) {
        autorotatePlugin.stop();
      }
    }

    initPSV();

    return () => {
      isMounted = false;
      isInitializedRef.current = false;
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
        viewerInstanceRef.current = null;
      }
    };
  }, []); // Run on mount

  const prevTourRef = useRef(tour);

  // When tour data changes (hotspots added/edited), refresh markers on the
  // CURRENT scene only — never call setNodes again after init, as that aborts
  // any in-progress panorama load and causes the stuck loader.
  useEffect(() => {
    if (
      !virtualTourPluginRef.current ||
      !markersPluginRef.current ||
      !isInitializedRef.current ||
      prevTourRef.current === tour
    ) return;

    prevTourRef.current = tour;

    // Only update the markers for the currently visible scene
    const currentNodeId =
      virtualTourPluginRef.current.state?.currentNode?.id || currentSceneId;
    const scene = tour.scenes.find((s) => s.id === currentNodeId);
    if (!scene) return;

    // Replace all markers on this scene without touching other nodes
    try {
      markersPluginRef.current.clearMarkers();
      scene.hotspots
        .filter((h) => h.type === 'info')
        .forEach((h) => {
          markersPluginRef.current.addMarker({
            id: h.id,
            position: h.position,
            html: createInfoMarkerSvg(h.info?.title || h.label || 'Information'),
            tooltip: h.info?.title || h.label,
            size: { width: 140, height: 65 },
            anchor: 'center center',
            data: h.info,
          });
        });
    } catch (_) {
      // Viewer may not be ready yet — safe to ignore
    }
  }, [tour, buildNodes, currentSceneId]);

  // Sync external activeSceneId changes without duplicate calls
  useEffect(() => {
    if (
      activeSceneId &&
      virtualTourPluginRef.current &&
      isInitializedRef.current &&
      virtualTourPluginRef.current.state.currentNode?.id !== activeSceneId
    ) {
      virtualTourPluginRef.current.setCurrentNode(activeSceneId).catch(() => {});
    }
  }, [activeSceneId]);

  // Focus / animate camera towards a specific hotspot
  useEffect(() => {
    if (focusPosition && viewerInstanceRef.current) {
      viewerInstanceRef.current.animate({
        yaw: focusPosition.yaw,
        pitch: focusPosition.pitch,
        speed: '3rpm',
      });
    }
  }, [focusPosition]);

  // Scene navigation jump
  const handleSelectScene = useCallback((sceneId: string) => {
    if (virtualTourPluginRef.current) {
      virtualTourPluginRef.current.setCurrentNode(sceneId).catch(() => {});
    }
  }, []);

  // Controls actions
  const toggleAutoRotate = () => {
    if (!autorotatePluginRef.current) return;
    if (isAutoRotating) {
      autorotatePluginRef.current.stop();
      setIsAutoRotating(false);
    } else {
      autorotatePluginRef.current.start();
      setIsAutoRotating(true);
    }
  };

  const handleZoomIn = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.zoom(viewerInstanceRef.current.getZoomLevel() + 15);
    }
  };

  const handleZoomOut = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.zoom(viewerInstanceRef.current.getZoomLevel() - 15);
    }
  };

  const toggleFullscreen = () => {
    const elem = containerRef.current?.parentElement || containerRef.current;
    if (!document.fullscreenElement) {
      elem?.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const handlePlaceAtCenter = () => {
    if (viewerInstanceRef.current && onPanoramaClickRef.current) {
      const pos = viewerInstanceRef.current.getPosition();
      const yawDeg = ((pos.yaw * 180) / Math.PI).toFixed(1) + 'deg';
      const pitchDeg = ((pos.pitch * 180) / Math.PI).toFixed(1) + 'deg';
      onPanoramaClickRef.current({ yaw: yawDeg, pitch: pitchDeg });
    }
  };

  // Generate iframe embed code
  const embedUrl = origin ? `${origin}/embed/${tour.slug}` : `/embed/${tour.slug}`;
  const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allow="fullscreen; gyroscope; accelerometer" allowfullscreen></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden bg-black ${
        isPlacementMode ? 'cursor-crosshair' : ''
      }`}
    >
      {/* 360 WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Placement Mode Active Indicator Banner */}
      {isPlacementMode && (
        <div className="absolute top-4 inset-x-4 z-30 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2.5 rounded-2xl bg-forest/95 text-paper font-display font-bold text-xs tracking-wide shadow-2xl backdrop-blur-md border border-saffron/40 flex flex-wrap items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-saffron animate-ping" />
              <span>Click on the 360 photo, or:</span>
            </div>
            <button
              onClick={handlePlaceAtCenter}
              className="px-3 py-1 rounded-xl bg-saffron hover:bg-saffron-hover text-ink font-display font-extrabold active:scale-95 shadow transition-all text-xs"
            >
              Place at Center of View
            </button>
          </div>
        </div>
      )}

      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Tour & Current Scene Info Badge */}
        {!isPlacementMode && (
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="px-3.5 py-2 rounded-2xl bg-forest/90 backdrop-blur-md border border-line/25 shadow-2xl">
              <h1 className="text-sm font-display font-extrabold text-paper tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-saffron animate-ping inline-block" />
                {currentScene?.name}
              </h1>
              {!embedMode && (
                <p className="text-[11px] text-muted font-medium">
                  {tour.title}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 pointer-events-auto ml-auto">
          {/* Schedule a Tour Button */}
          <button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-saffron hover:bg-saffron-hover text-ink font-display font-extrabold text-xs shadow-xl transition-all"
            title="Schedule a Private In-Person Viewing"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Tour</span>
          </button>

          {/* Coordinates Inspector Toggle */}
          <button
            onClick={() => setShowCoordsHelper(!showCoordsHelper)}
            title="Inspect Coordinates"
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              showCoordsHelper
                ? 'bg-teal text-paper border-saffron shadow-lg'
                : 'bg-forest/75 hover:bg-forest text-muted hover:text-paper border-line/20'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {!embedMode && (
            <button
              onClick={() => setShowEmbedModal(true)}
              title="Get Embed Code"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest/75 hover:bg-forest text-paper backdrop-blur-md border border-line/20 text-xs font-display font-bold shadow-lg transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-saffron" />
              <span className="hidden sm:inline">Embed</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Interactive Floor Plan & Radar in Bottom-Left */}
      <div className="absolute bottom-20 left-4 z-20 pointer-events-none">
        <FloorPlanRadar
          scenes={tour.scenes}
          currentScene={tour.scenes.find((s) => s.id === currentSceneId)}
          currentSceneId={currentSceneId}
          currentYawDeg={currentYawDeg}
          onSelectScene={handleSelectScene}
        />
      </div>

      {/* Coordinate Tooltip */}
      {showCoordsHelper && lastClickedCoords && (
        <div className="absolute top-18 right-4 z-30 px-3 py-2 rounded-xl bg-forest/95 border border-teal/40 text-xs text-paper backdrop-blur-md shadow-2xl space-y-1 animate-in fade-in">
          <p className="font-semibold text-saffron">Target Coordinates:</p>
          <div className="font-mono text-[11px] text-muted">
            yaw: <span className="text-paper font-bold">{lastClickedCoords.yaw}</span>
            <br />
            pitch: <span className="text-paper font-bold">{lastClickedCoords.pitch}</span>
          </div>
          <p className="text-[10px] text-muted/80 pt-1 border-t border-line/15">
            Click anywhere on the panorama to measure position
          </p>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Scene Navigation Trigger */}
        <div className="pointer-events-auto">
          <SceneNav
            scenes={tour.scenes}
            currentSceneId={currentSceneId}
            onSelectScene={handleSelectScene}
            isOpen={showSceneDrawer}
            onToggle={() => setShowSceneDrawer(!showSceneDrawer)}
          />
        </div>

        {/* Viewport Control Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto">
          {/* Auto Rotate Toggle */}
          <button
            onClick={toggleAutoRotate}
            title={isAutoRotating ? 'Pause rotation' : 'Start auto-rotation'}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Info Hotspot Modal */}
      <HotspotModal info={activeInfo} onClose={() => setActiveInfo(null)} />

      {/* In-Tour Lead Capture / Schedule a Tour Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        tour={tour}
        currentSceneName={currentScene?.name}
      />

      {/* Embed Modal */}
      {showEmbedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowEmbedModal(false)}
        >
          <div
            className="w-full max-w-lg bg-forest border border-line/25 rounded-3xl p-6 shadow-2xl space-y-4 text-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-extrabold text-paper flex items-center gap-2">
                <Code2 className="w-5 h-5 text-saffron" />
                Embed This 360 Tour
              </h3>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="text-muted hover:text-paper"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Copy and paste this snippet into WordPress, Wix, Squarespace, Webflow, or any custom website. Includes full gyroscope and mobile support.
            </p>
            <div className="p-3 bg-ink/90 rounded-2xl border border-line/20 font-mono text-xs text-muted break-all select-all">
              {iframeSnippet}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={copyEmbedCode}
                className="px-5 py-2.5 bg-saffron hover:bg-saffron-hover text-ink text-xs font-display font-extrabold rounded-full shadow-lg transition-all"
              >
                {copiedCode ? '✓ Copied to Clipboard!' : 'Copy Embed Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
