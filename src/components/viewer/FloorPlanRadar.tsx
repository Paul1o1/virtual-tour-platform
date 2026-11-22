'use client';

import React, { useState } from 'react';
import { Scene } from '@/types/tour';
import { Map, X, Maximize2, Minimize2, Compass, Layers } from 'lucide-react';

interface FloorPlanRadarProps {
  scenes: Scene[];
  currentSceneId: string;
  currentYawDeg: number; // 0 to 360 degrees
  onSelectScene: (sceneId: string) => void;
  brandColor?: string;
}

// Visual layout coordinates for rooms on the 2D mini-map (normalized 0-100%)
const DEFAULT_ROOM_COORDINATES: Record<string, { x: number; y: number; label: string }> = {
  'scene-entrance': { x: 50, y: 55, label: 'Grand Hall' },
  'scene-veranda': { x: 75, y: 30, label: 'Courtyard' },
  'scene-lounge': { x: 25, y: 35, label: 'Lounge' },
  'scene-overlook': { x: 80, y: 75, label: 'Terrace' },
  'sky-living': { x: 45, y: 50, label: 'Grand Salon' },
  'sky-dining': { x: 70, y: 40, label: 'Dining Suite' },
};

export function FloorPlanRadar({
  scenes,
  currentSceneId,
  currentYawDeg,
  onSelectScene,
}: FloorPlanRadarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback room coordinate calculation if room isn't in presets
  const getCoordinates = (sceneId: string, index: number, total: number) => {
    if (DEFAULT_ROOM_COORDINATES[sceneId]) {
      return DEFAULT_ROOM_COORDINATES[sceneId];
    }
    // Distribute nicely along an architectural circle/grid
    const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
    const x = Math.round(50 + 35 * Math.cos(angle));
    const y = Math.round(50 + 35 * Math.sin(angle));
    const scene = scenes.find((s) => s.id === sceneId);
    return { x, y, label: scene?.name || `Room ${index + 1}` };
  };

  const activeIndex = scenes.findIndex((s) => s.id === currentSceneId);
  const activeCoord = getCoordinates(
    currentSceneId,
    activeIndex >= 0 ? activeIndex : 0,
    scenes.length
  );

  return (
    <div className="select-none">
      {/* Minimized Toggle Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-forest/90 hover:bg-forest text-paper border border-line/30 backdrop-blur-md shadow-2xl transition-all group pointer-events-auto"
          title="Open Interactive Floor Plan"
        >
          <div className="w-5 h-5 rounded-lg bg-saffron text-ink flex items-center justify-center font-bold text-[10px]">
            <Map className="w-3 h-3" />
          </div>
          <span className="text-xs font-display font-bold tracking-wide">Floor Plan</span>
        </button>
      )}

      {/* Interactive Floor Plan Card */}
      {isOpen && (
        <div
          className={`rounded-2xl bg-forest/95 backdrop-blur-xl border border-line/25 shadow-2xl transition-all pointer-events-auto overflow-hidden flex flex-col ${
            isExpanded ? 'w-80 h-80 sm:w-96 sm:h-96' : 'w-56 h-56 sm:w-64 sm:h-64'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-ink/70 border-b border-line/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-saffron animate-ping" />
              <span className="text-xs font-display font-bold text-paper tracking-wide flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-saffron" />
                Floor Plan &amp; Radar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-muted hover:text-paper rounded-lg transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted hover:text-paper rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2D Architectural Layout Canvas */}
          <div className="relative flex-1 bg-[#0A2621]/90 p-3 overflow-hidden">
            {/* Architectural Grid Lines */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #D5E0DA 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Floor Boundary Walls Outline (SVG) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none p-3"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Exterior wall lines */}
              <polygon
                points="15,20 85,20 90,85 10,85"
                fill="none"
                stroke="#2F7F79"
                strokeWidth="1.5"
                strokeDasharray="2 1"
                opacity="0.4"
              />
              {/* Interior partitions */}
              <line x1="50" y1="20" x2="50" y2="85" stroke="#2F7F79" strokeWidth="1" opacity="0.3" />
              <line x1="15" y1="50" x2="85" y2="50" stroke="#2F7F79" strokeWidth="1" opacity="0.3" />

              {/* Connecting walk pathways between scenes */}
              {scenes.length > 1 &&
                scenes.map((s, idx) => {
                  if (idx === 0) return null;
                  const prev = getCoordinates(scenes[idx - 1].id, idx - 1, scenes.length);
                  const curr = getCoordinates(s.id, idx, scenes.length);
                  return (
                    <line
                      key={`path-${s.id}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={curr.x}
                      y2={curr.y}
                      stroke="#F0B429"
                      strokeWidth="0.8"
                      strokeDasharray="1.5 1.5"
                      opacity="0.35"
                    />
                  );
                })}
            </svg>

            {/* Interactive Room Spots & Active Radar Beam */}
            {scenes.map((scene, idx) => {
              const coords = getCoordinates(scene.id, idx, scenes.length);
              const isActive = scene.id === currentSceneId;

              return (
                <div
                  key={scene.id}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
                >
                  {/* Rotating Radar Vision Cone on Active Room */}
                  {isActive && (
                    <div
                      className="absolute -inset-10 pointer-events-none transition-transform duration-75 ease-out"
                      style={{
                        transform: `rotate(${currentYawDeg}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      {/* Radar Cone Gradient */}
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                          <radialGradient id="radarBeam" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#F0B429" stopOpacity="0.85" />
                            <stop offset="40%" stopColor="#2F7F79" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#0E3B34" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        {/* 65-degree FOV camera vision sector */}
                        <path
                          d="M 50 50 L 25 5 A 50 50 0 0 1 75 5 Z"
                          fill="url(#radarBeam)"
                        />
                        {/* Center focus ray */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="5"
                          stroke="#F0B429"
                          strokeWidth="1.5"
                          strokeDasharray="2 1"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Room Clickable Pin */}
                  <button
                    onClick={() => onSelectScene(scene.id)}
                    className={`relative z-30 transition-all flex items-center justify-center rounded-full shadow-lg ${
                      isActive
                        ? 'w-5 h-5 bg-saffron text-ink ring-4 ring-saffron/30 scale-110 font-extrabold text-[10px]'
                        : 'w-3.5 h-3.5 bg-paper/80 hover:bg-saffron hover:scale-125 border border-forest font-semibold'
                    }`}
                    title={`Teleport to ${scene.name}`}
                  >
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-ink" />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-forest" />
                    )}
                  </button>

                  {/* Room Label Tooltip */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[9px] font-display font-semibold whitespace-nowrap pointer-events-none shadow transition-opacity ${
                      isActive
                        ? 'bg-ink text-saffron border border-saffron/40 opacity-100 z-30'
                        : 'bg-forest/90 text-paper/80 opacity-0 group-hover:opacity-100 z-20'
                    }`}
                  >
                    {coords.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls: Room Buttons */}
          <div className="p-1.5 bg-ink/90 border-t border-line/10 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {scenes.map((s, idx) => {
              const isActive = s.id === currentSceneId;
              const coords = getCoordinates(s.id, idx, scenes.length);
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectScene(s.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-display font-bold truncate transition-all shrink-0 ${
                    isActive
                      ? 'bg-saffron text-ink shadow-sm'
                      : 'bg-forest/60 text-muted hover:text-paper hover:bg-forest'
                  }`}
                >
                  {coords.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
