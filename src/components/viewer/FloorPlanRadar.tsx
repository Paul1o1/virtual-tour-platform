'use client';

import React, { useState } from 'react';
import { Scene } from '@/types/tour';
import { Map, X, Maximize2, Minimize2 } from 'lucide-react';

interface FloorPlanRadarProps {
  scenes: Scene[];
  currentScene: Scene | undefined;
  currentSceneId: string;
  currentYawDeg: number; // 0–360 degrees
  onSelectScene: (sceneId: string) => void;
  brandColor?: string;
}

/** Distribute scenes evenly around an ellipse if no presets match */
function getAutoLayout(
  scenes: Scene[]
): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};
  const n = scenes.length;
  scenes.forEach((s, i) => {
    const angle = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2;
    layout[s.id] = {
      x: Math.round(50 + 36 * Math.cos(angle)),
      y: Math.round(50 + 36 * Math.sin(angle)),
    };
  });
  return layout;
}

export function FloorPlanRadar({
  scenes,
  currentScene,
  currentSceneId,
  currentYawDeg,
  onSelectScene,
}: FloorPlanRadarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Build coordinate map once per render (scenes rarely change length)
  const layout = getAutoLayout(scenes);

  const getCoords = (sceneId: string) =>
    layout[sceneId] ?? { x: 50, y: 50 };

  const activeCoord = getCoords(currentSceneId);

  // --- Link-hotspot connections for the CURRENT scene only ---
  // We draw a line from the active dot to each scene reachable by a link hotspot.
  const linkConnections: Array<{ targetId: string }> = (
    currentScene?.hotspots ?? []
  )
    .filter((h) => h.type === 'link' && h.linkedSceneId)
    .map((h) => ({ targetId: h.linkedSceneId as string }));

  // All link hotspot target ids across the whole tour (for persistent grey lines)
  const allConnections: Array<{ fromId: string; toId: string }> = [];
  scenes.forEach((scene) => {
    (scene.hotspots ?? [])
      .filter((h) => h.type === 'link' && h.linkedSceneId)
      .forEach((h) => {
        allConnections.push({ fromId: scene.id, toId: h.linkedSceneId as string });
      });
  });

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

          {/* 2D Map Canvas */}
          <div className="relative flex-1 bg-[#0A2621]/90 p-3 overflow-hidden">
            {/* Dot grid background */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(circle, #D5E0DA 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* SVG: wall outline + connection lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none p-3"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Faint boundary box */}
              <polygon
                points="15,20 85,20 90,85 10,85"
                fill="none"
                stroke="#2F7F79"
                strokeWidth="1.5"
                strokeDasharray="2 1"
                opacity="0.4"
              />
              <line x1="50" y1="20" x2="50" y2="85" stroke="#2F7F79" strokeWidth="1" opacity="0.3" />
              <line x1="15" y1="50" x2="85" y2="50" stroke="#2F7F79" strokeWidth="1" opacity="0.3" />

              {/* All link-hotspot connections across the tour (dim grey) */}
              {allConnections.map(({ fromId, toId }, i) => {
                const from = getCoords(fromId);
                const to = getCoords(toId);
                // Don't double-draw active connections below
                const isActive =
                  fromId === currentSceneId || toId === currentSceneId;
                if (isActive) return null;
                return (
                  <line
                    key={`all-${i}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#D5E0DA"
                    strokeWidth="0.6"
                    strokeDasharray="1.5 2"
                    opacity="0.2"
                  />
                );
              })}

              {/* Active scene link-hotspot connections (highlighted saffron) */}
              {linkConnections.map(({ targetId }, i) => {
                const to = getCoords(targetId);
                return (
                  <line
                    key={`link-${i}`}
                    x1={activeCoord.x}
                    y1={activeCoord.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#F0B429"
                    strokeWidth="1"
                    strokeDasharray="2 1.5"
                    opacity="0.75"
                  />
                );
              })}
            </svg>

            {/* Scene dots */}
            {scenes.map((scene, idx) => {
              const coords = getCoords(scene.id);
              const isActive = scene.id === currentSceneId;
              // Is this scene reachable by a link from the current scene?
              const isLinked = linkConnections.some((c) => c.targetId === scene.id);

              return (
                <div
                  key={scene.id}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
                >
                  {/* Radar vision cone on active room */}
                  {isActive && (
                    <div
                      className="absolute -inset-10 pointer-events-none transition-transform duration-75 ease-out"
                      style={{
                        transform: `rotate(${currentYawDeg}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                          <radialGradient id="radarBeam" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#F0B429" stopOpacity="0.85" />
                            <stop offset="40%" stopColor="#2F7F79" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#0E3B34" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        {/* 65° FOV camera sector */}
                        <path d="M 50 50 L 25 5 A 50 50 0 0 1 75 5 Z" fill="url(#radarBeam)" />
                        <line x1="50" y1="50" x2="50" y2="5" stroke="#F0B429" strokeWidth="1.5" strokeDasharray="2 1" />
                      </svg>
                    </div>
                  )}

                  {/* Room pin button */}
                  <button
                    onClick={() => onSelectScene(scene.id)}
                    className={`relative z-30 transition-all flex items-center justify-center rounded-full shadow-lg ${
                      isActive
                        ? 'w-5 h-5 bg-saffron text-ink ring-4 ring-saffron/30 scale-110 font-extrabold text-[10px]'
                        : isLinked
                        ? 'w-4 h-4 bg-teal/90 hover:bg-saffron hover:scale-125 border border-saffron/60 shadow-teal/30'
                        : 'w-3.5 h-3.5 bg-paper/60 hover:bg-saffron hover:scale-125 border border-forest font-semibold'
                    }`}
                    title={`Go to ${scene.name}`}
                  >
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-ink" />
                    ) : isLinked ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-saffron/80" />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-forest" />
                    )}
                  </button>

                  {/* Room label */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[9px] font-display font-semibold whitespace-nowrap pointer-events-none shadow transition-opacity ${
                      isActive
                        ? 'bg-ink text-saffron border border-saffron/40 opacity-100 z-30'
                        : 'bg-forest/90 text-paper/80 opacity-0 group-hover:opacity-100 z-20'
                    }`}
                  >
                    {scene.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer: scene quick-nav pills */}
          <div className="p-1.5 bg-ink/90 border-t border-line/10 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {scenes.map((s) => {
              const isActive = s.id === currentSceneId;
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
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
