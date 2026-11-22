'use client';

import React, { useState, useEffect } from 'react';
import { Scene } from '@/types/tour';
import { MapPin, Info, ChevronDown, ChevronUp, ArrowRight, Layers } from 'lucide-react';

interface RoomInfoCardProps {
  scene: Scene | undefined;
  allScenes: Scene[];
  onSelectScene: (sceneId: string) => void;
  hidden?: boolean;
}

export function RoomInfoCard({ scene, allScenes, onSelectScene, hidden = false }: RoomInfoCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [prevSceneId, setPrevSceneId] = useState(scene?.id);

  // Auto-expand briefly when scene changes, then collapse back if user had it collapsed
  useEffect(() => {
    if (scene?.id !== prevSceneId) {
      setPrevSceneId(scene?.id);
      setExpanded(true);
    }
  }, [scene?.id, prevSceneId]);

  if (hidden || !scene) return null;

  const linkHotspots = scene.hotspots.filter((h) => h.type === 'link');
  const infoHotspots = scene.hotspots.filter((h) => h.type === 'info');
  const sceneIndex = allScenes.findIndex((s) => s.id === scene.id);

  return (
    <div className="select-none pointer-events-auto">
      {/* Collapsed pill */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-forest/90 hover:bg-forest backdrop-blur-md border border-line/25 shadow-2xl transition-all group"
        >
          <span className="w-2 h-2 rounded-full bg-saffron animate-ping" />
          <span className="text-xs font-display font-bold text-paper truncate max-w-[140px]">
            {scene.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted group-hover:text-paper transition-colors" />
        </button>
      )}

      {/* Expanded card */}
      {expanded && (
        <div className="w-64 sm:w-72 rounded-2xl bg-forest/95 backdrop-blur-xl border border-line/25 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">

          {/* Header: scene name + collapse */}
          <div className="px-4 py-3 bg-ink/60 border-b border-line/15 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-ping flex-shrink-0" />
                <span className="text-[10px] text-muted font-display font-bold uppercase tracking-wider">
                  {sceneIndex >= 0 ? `Room ${sceneIndex + 1} of ${allScenes.length}` : 'Current Room'}
                </span>
              </div>
              <h2 className="text-sm font-display font-extrabold text-paper leading-tight truncate">
                {scene.name}
              </h2>
              {scene.floor && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Layers className="w-3 h-3 text-teal flex-shrink-0" />
                  <span className="text-[10px] text-muted">Floor {scene.floor}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="flex-shrink-0 p-1 rounded-lg text-muted hover:text-paper transition-colors mt-0.5"
              title="Collapse"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description */}
          {scene.description && (
            <div className="px-4 py-2.5 border-b border-line/10">
              <p className="text-[11px] text-muted leading-relaxed line-clamp-3">
                {scene.description}
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="px-4 py-2.5 flex items-center gap-3 border-b border-line/10">
            {infoHotspots.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-display font-bold text-paper">{infoHotspots.length}</p>
                  <p className="text-[9px] text-muted leading-none">Info Point{infoHotspots.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
            {linkHotspots.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-teal/20 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-teal" />
                </div>
                <div>
                  <p className="text-[11px] font-display font-bold text-paper">{linkHotspots.length}</p>
                  <p className="text-[9px] text-muted leading-none">Exit{linkHotspots.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
            {scene.hotspots.length === 0 && (
              <p className="text-[10px] text-muted italic">No hotspots in this room</p>
            )}
          </div>

          {/* Linked rooms — click to jump */}
          {linkHotspots.length > 0 && (
            <div className="px-4 py-2.5">
              <p className="text-[9px] text-muted font-display font-bold uppercase tracking-wider mb-1.5">Go to</p>
              <div className="space-y-1">
                {linkHotspots.map((h) => {
                  const target = allScenes.find((s) => s.id === h.targetSceneId);
                  if (!target) return null;
                  return (
                    <button
                      key={h.id}
                      onClick={() => onSelectScene(target.id)}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-ink/50 hover:bg-teal/20 border border-line/10 hover:border-teal/40 transition-all group text-left"
                    >
                      <span className="text-[11px] font-display font-semibold text-paper/80 group-hover:text-paper truncate">
                        {h.label || target.name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted group-hover:text-saffron flex-shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
