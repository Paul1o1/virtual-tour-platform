'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Company, Tour } from '@/types/tour';
import { defaultCompanies, allDefaultTours } from '@/data/default-tour';
import {
  Building2,
  ExternalLink,
  Plus,
  Compass,
  Code2,
  Layers,
  Share2,
  Check,
  Eye,
  ArrowLeft,
  Sparkles,
  Globe,
  Mail,
  Copy,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface CompanyPortalProps {
  params: Promise<{ slug: string }>;
}

export default function CompanyPortalPage({ params }: CompanyPortalProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [company, setCompany] = useState<Company | null>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [embedModalTour, setEmbedModalTour] = useState<{ slug: string; title: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLinkSlug, setCopiedLinkSlug] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);

    async function loadCompanyData() {
      try {
        const res = await fetch(`/api/companies/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.company) {
            setCompany(data.company);
            setTours(data.tours || []);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch company API, using fallback:', err);
      }

      // Fallback to local default data
      const foundComp = defaultCompanies.find((c) => c.slug === slug);
      if (foundComp) {
        setCompany(foundComp);
        const matchingTours = allDefaultTours.filter((t) => t.companySlug === slug);
        setTours(
          matchingTours.map((t) => ({
            id: t.id,
            slug: t.slug,
            title: t.title,
            client: t.client,
            companySlug: t.companySlug,
            sceneCount: t.scenes.length,
            status: t.status || 'published',
            coverImage: t.scenes[0]?.thumbnailUrl || t.scenes[0]?.imageUrl,
            updatedAt: new Date().toISOString(),
          }))
        );
      }
      setIsLoading(false);
    }

    loadCompanyData();
  }, [slug]);

  const copyEmbedSnippet = (tourSlug: string) => {
    const embedUrl = origin ? `${origin}/embed/${tourSlug}` : `/embed/${tourSlug}`;
    const snippet = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allow="fullscreen; gyroscope; accelerometer" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyDirectTourLink = (tourSlug: string) => {
    const tourUrl = `${origin || window.location.origin}/tour/${tourSlug}`;
    navigator.clipboard.writeText(tourUrl);
    setCopiedLinkSlug(tourSlug);
    setTimeout(() => setCopiedLinkSlug(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono text-zinc-500">
          Loading Client Portal...
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <Building2 className="w-12 h-12 text-zinc-600 mb-3" />
        <h2 className="text-xl font-bold">Company Portal Not Found</h2>
        <p className="text-sm text-zinc-400 mt-1 mb-5">No company exists with the link &quot;{slug}&quot;</p>
        <Link
          href="/companies"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
        >
          View All Companies
        </Link>
      </div>
    );
  }

  const brandColor = company.primaryColor || '#3b82f6';
  const totalScenes = tours.reduce((sum, t) => sum + (t.sceneCount || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <Link
              href="/companies"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Client Directory
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Tour</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Company Profile Header */}
      <section className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xl border border-white/10 shrink-0"
              style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
            >
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <Building2 className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Client Portal
                </span>
                <span className="text-[11px] font-mono text-zinc-500">/c/{company.slug}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                {company.name}
              </h1>
              {company.tagline && (
                <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mt-1">
                  {company.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center min-w-[100px]">
              <span className="block text-xl font-extrabold text-white">{tours.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Active Tours
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center min-w-[100px]">
              <span className="block text-xl font-extrabold text-white">{totalScenes}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                360 Scenes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tours Grid Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              Interactive 360° Tours ({tours.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Shareable links and website embed codes for {company.name}&apos;s properties
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Tour</span>
          </Link>
        </div>

        {/* Tour Cards */}
        {tours.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 space-y-3">
            <Compass className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No tours published for this company yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Create the first 360° walkthrough in the studio and assign it to {company.name}.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Tour</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tours.map((t) => (
              <div
                key={t.slug}
                className="group rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-blue-500/50 transition-all overflow-hidden shadow-xl flex flex-col"
              >
                {/* 360 Cover Thumbnail */}
                <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                  {t.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.coverImage}
                      alt={t.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Compass className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-md">
                      Live Tour
                    </span>
                  </div>

                  {/* Scene Count Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 text-white text-[11px] font-semibold backdrop-blur-md">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.sceneCount} 360° {t.sceneCount === 1 ? 'Scene' : 'Scenes'}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      /tour/{t.slug}
                    </p>
                  </div>

                  {/* Actions Grid */}
                  <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* View Tour Button */}
                      <Link
                        href={`/tour/${t.slug}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View 360</span>
                      </Link>

                      {/* Embed Code Button */}
                      <button
                        onClick={() => setEmbedModalTour({ slug: t.slug, title: t.title })}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition-all"
                      >
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Embed</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        onClick={() => copyDirectTourLink(t.slug)}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedLinkSlug === t.slug ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/?tour=${t.slug}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 transition-colors"
                      >
                        <span>Edit Tour</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Embed Code Modal */}
      {embedModalTour && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setEmbedModalTour(null)}
        >
          <div
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                Embed Code: {embedModalTour.title}
              </h3>
              <button
                onClick={() => setEmbedModalTour(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Embed this interactive 360 viewer directly into {company.name}&apos;s website (WordPress, Wix, Webflow, Squarespace, or custom code):
            </p>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 break-all select-all">
              {`<iframe src="${
                origin ? `${origin}/embed/${embedModalTour.slug}` : `/embed/${embedModalTour.slug}`
              }" width="100%" height="600" frameborder="0" allow="fullscreen; gyroscope; accelerometer" allowfullscreen></iframe>`}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => copyEmbedSnippet(embedModalTour.slug)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
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
