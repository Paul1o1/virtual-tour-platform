'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { defaultTour } from '@/data/default-tour';
import { ArrowLeft, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Dynamically import TourViewer
const TourViewer = dynamic(() => import('@/components/viewer/TourViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-zinc-400 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-xs uppercase tracking-widest font-mono text-zinc-500">
        Opening 360 Space...
      </p>
    </div>
  ),
});

export default function TourPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md text-xs font-medium transition-all shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white tracking-wide">
              {defaultTour.title}
            </p>
            <p className="text-[10px] text-zinc-400">
              Presented by {defaultTour.client}
            </p>
          </div>
        </div>
      </header>

      {/* Main Tour Viewer */}
      <main className="w-full h-full">
        <TourViewer tour={defaultTour} />
      </main>
    </div>
  );
}
