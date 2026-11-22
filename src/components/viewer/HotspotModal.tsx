'use client';

import React from 'react';
import { HotspotInfo } from '@/types/tour';
import { X, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';

interface HotspotModalProps {
  info: HotspotInfo | null;
  onClose: () => void;
}

export function HotspotModal({ info, onClose }: HotspotModalProps) {
  if (!info) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md md:max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media header */}
        {info.mediaUrl && (
          <div className="relative w-full h-52 sm:h-64 bg-zinc-950 overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={info.mediaUrl}
              alt={info.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30" />
            
            {info.badge && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-display font-bold tracking-wide text-saffron bg-ink/90 border border-saffron/40 rounded-full backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-saffron" />
                {info.badge}
              </span>
            )}

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black text-zinc-300 hover:text-white transition-colors backdrop-blur-md border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal content body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              {info.category && (
                <p className="text-xs uppercase tracking-wider font-display font-bold text-saffron mb-1">
                  {info.category}
                </p>
              )}
              <h3 className="text-xl font-display font-extrabold text-paper tracking-tight leading-snug">
                {info.title}
              </h3>
            </div>
            {!info.mediaUrl && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-full bg-forest-light hover:bg-forest text-muted hover:text-paper transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-sm text-mist leading-relaxed pt-1">
            {info.description}
          </p>

          {/* Action link */}
          {info.linkUrl && (
            <div className="pt-3">
              <a
                href={info.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-display font-extrabold text-ink bg-saffron hover:bg-saffron-hover active:scale-98 rounded-xl transition-all shadow-lg shadow-saffron/20"
              >
                <span>{info.linkLabel || 'Learn More'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
