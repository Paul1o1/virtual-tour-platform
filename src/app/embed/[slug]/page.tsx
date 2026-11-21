'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { defaultTour } from '@/data/default-tour';

// Dynamically import TourViewer
const TourViewer = dynamic(() => import('@/components/viewer/TourViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-zinc-400 gap-3">
      <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-[11px] font-mono tracking-wider text-zinc-500">
        LOADING 360 TOUR...
      </span>
    </div>
  ),
});

/**
 * Chromeless Embed View for iframes.
 * Has no page header, no outer chrome, full responsiveness,
 * and passes embedMode={true} to maximize viewer immersion.
 */
export default function EmbedPage() {
  return (
    <main className="w-screen h-screen m-0 p-0 overflow-hidden bg-black">
      <TourViewer tour={defaultTour} embedMode={true} />
    </main>
  );
}
