'use client';

import React from 'react';
import { Scene } from '@/types/tour';
import { Compass, Eye } from 'lucide-react';

interface SceneNavProps {
  scenes: Scene[];
  currentSceneId: string;
  onSelectScene: (sceneId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SceneNav({
  scenes,
  currentSceneId,
  onSelectScene,
  isOpen,
  onToggle,
}: SceneNavProps) {
  return (
    <div className="relative z-30">
      {/* Floating Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest/80 hover:bg-forest text-paper backdrop-blur-md border border-line/20 shadow-xl transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm font-display font-bold"
      >
        <Compass className="w-4 h-4 text-saffron animate-spin-slow" />
        <span>Scenes ({scenes.length})</span>
      </button>

      {/* Drawer / Thumbnail Carousel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-16 sm:bottom-20 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-full max-w-4xl p-3 bg-forest/95 backdrop-blur-xl border border-line/20 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line/15 text-xs text-muted font-display font-bold px-1">
              <span>EXPLORE SCENES</span>
              <button
                onClick={onToggle}
                className="hover:text-paper transition-colors"
              >
                Hide
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-forest">
              {scenes.map((scene) => {
                const isActive = scene.id === currentSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => {
                      onSelectScene(scene.id);
                      onToggle();
                    }}
                    className={`flex-shrink-0 group relative w-36 sm:w-44 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      isActive
                        ? 'border-saffron ring-2 ring-saffron/40 scale-102'
                        : 'border-line/15 hover:border-line/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scene.thumbnailUrl || scene.imageUrl}
                      alt={scene.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <p className="text-xs font-semibold text-white truncate">
                        {scene.name}
                      </p>
                      {scene.floor && (
                        <p className="text-[10px] text-zinc-400 truncate">
                          {scene.floor}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-saffron text-ink">
                        <Eye className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
