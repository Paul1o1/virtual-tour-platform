'use client';

import React, { useRef, useEffect } from 'react';
import { Scene } from '@/types/tour';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

interface SceneStripProps {
  scenes: Scene[];
  currentSceneId: string;
  onSelectScene: (sceneId: string) => void;
  /** Hide in placement mode */
  hidden?: boolean;
}

export function SceneStrip({
  scenes,
  currentSceneId,
  onSelectScene,
  hidden = false,
}: SceneStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep active scene visible
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentSceneId]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (hidden || scenes.length <= 1) return null;

  const activeScene = scenes.find((s) => s.id === currentSceneId);
  const activeIndex = scenes.findIndex((s) => s.id === currentSceneId);

  return (
    <div className="relative w-full pointer-events-auto">
      {/* Strip Container */}
      <div className="relative flex items-center gap-1.5 px-1">

        {/* Left scroll arrow */}
        {scenes.length > 4 && (
          <button
            onClick={() => scroll('left')}
            className="flex-shrink-0 p-1.5 rounded-xl bg-ink/80 hover:bg-ink text-muted hover:text-paper transition-colors backdrop-blur-sm border border-line/15 shadow-lg z-10"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Thumbnail rail */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-none flex-1 py-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {scenes.map((scene, idx) => {
            const isActive = scene.id === currentSceneId;
            const hotspotCount = scene.hotspots?.length ?? 0;

            return (
              <button
                key={scene.id}
                data-active={isActive}
                onClick={() => onSelectScene(scene.id)}
                style={{ scrollSnapAlign: 'start' }}
                className={`flex-shrink-0 group relative rounded-xl overflow-hidden transition-all duration-200 ${
                  isActive
                    ? 'w-36 sm:w-44 border-2 border-saffron ring-2 ring-saffron/30 scale-105 shadow-xl shadow-saffron/20'
                    : 'w-28 sm:w-36 border-2 border-line/20 hover:border-saffron/50 opacity-70 hover:opacity-100 hover:scale-102'
                }`}
                title={`Go to ${scene.name}`}
              >
                {/* Thumbnail image */}
                <div className={`relative bg-ink ${isActive ? 'h-20 sm:h-24' : 'h-16 sm:h-20'} transition-all`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scene.thumbnailUrl || scene.imageUrl}
                    alt={scene.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Active eye indicator */}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-saffron text-ink text-[9px] font-display font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
                      LIVE
                    </div>
                  )}

                  {/* Scene number badge */}
                  {!isActive && (
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-ink/80 text-muted text-[9px] font-bold flex items-center justify-center border border-line/20">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Label bar */}
                <div className={`px-2 py-1 ${isActive ? 'bg-saffron/15 border-t border-saffron/30' : 'bg-ink/90'} transition-colors`}>
                  <p className={`text-left text-[10px] font-display font-bold truncate ${isActive ? 'text-saffron' : 'text-paper/80 group-hover:text-paper'}`}>
                    {scene.name}
                  </p>
                  {hotspotCount > 0 && (
                    <p className="text-left text-[9px] text-muted mt-0.5">
                      {hotspotCount} hotspot{hotspotCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow */}
        {scenes.length > 4 && (
          <button
            onClick={() => scroll('right')}
            className="flex-shrink-0 p-1.5 rounded-xl bg-ink/80 hover:bg-ink text-muted hover:text-paper transition-colors backdrop-blur-sm border border-line/15 shadow-lg z-10"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scene counter pill */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ink/80 backdrop-blur-sm border border-line/15 text-[10px] text-muted font-display font-bold pointer-events-none select-none">
        <Images className="w-3 h-3 text-saffron" />
        <span>{activeIndex + 1} / {scenes.length}</span>
        <span className="text-saffron">·</span>
        <span className="text-paper/60 max-w-[120px] truncate">{activeScene?.name}</span>
      </div>
    </div>
  );
}
