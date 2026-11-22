'use client';

import React, { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { defaultTour } from '@/data/default-tour';
import { Tour } from '@/types/tour';

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

interface EmbedPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Chromeless Embed View for iframes.
 * Has no page header, no outer chrome, full responsiveness,
 * and passes embedMode={true} to maximize viewer immersion.
 */
export default function EmbedPage({ params }: EmbedPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [tour, setTour] = useState<Tour | null>(null);

  useEffect(() => {
    async function loadTour() {
      try {
        const res = await fetch(`/api/tours/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tour) {
            setTour(data.tour);
            return;
          }
        }
      } catch (err) {
        console.warn('API fetch failed, fallback to local storage:', err);
      }

      try {
        const saved = localStorage.getItem('vtour_custom_data_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.slug === slug || slug === 'art-gallery') {
            setTour(parsed);
            return;
          }
        }
      } catch (_) {}

      setTour(defaultTour);
    }

    loadTour();
  }, [slug]);

  if (!tour) {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-black text-zinc-500 text-xs font-mono">
        LOADING 360 TOUR...
      </main>
    );
  }

  return (
    <main className="w-screen h-screen m-0 p-0 overflow-hidden bg-black">
      <TourViewer tour={tour} embedMode={true} />
    </main>
  );
}
