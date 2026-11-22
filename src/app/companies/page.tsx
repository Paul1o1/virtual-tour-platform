'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Company } from '@/types/tour';
import { defaultCompanies } from '@/data/default-tour';
import {
  Building2,
  Plus,
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  X,
  Globe,
  Mail,
  Palette,
  ShieldCheck,
} from 'lucide-react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(defaultCompanies);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Company Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [website, setWebsite] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          if (data.companies && data.companies.length > 0) {
            setCompanies(data.companies);
          }
        }
      } catch (err) {
        console.warn('API error, using default companies:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCompanies();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    const newCompany: Company = {
      id: `comp_${Date.now()}`,
      slug: slug.trim().toLowerCase(),
      name: name.trim(),
      tagline: tagline.trim(),
      website: website.trim() || undefined,
      primaryColor,
      toursCount: 0,
    };

    try {
      await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      });
    } catch (_) {}

    setCompanies([...companies, newCompany]);
    setIsAddModalOpen(false);
    setName('');
    setSlug('');
    setTagline('');
    setWebsite('');
  };

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
            <span className="text-xs font-semibold text-white">Client Companies</span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Company</span>
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Agency Client Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Client Companies &amp; Portals
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
              Each company has its own branded dashboard showing all their 360° virtual tours, embed codes, and links.
            </p>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center min-w-[120px] self-start md:self-auto">
            <span className="block text-2xl font-extrabold text-white">{companies.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Active Clients
            </span>
          </div>
        </div>
      </section>

      {/* Main Companies Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => {
            const brandColor = c.primaryColor || '#3b82f6';
            return (
              <div
                key={c.slug}
                className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all p-5 flex flex-col justify-between shadow-xl space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow border border-white/10"
                      style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                    >
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                      {c.toursCount ?? 1} {c.toursCount === 1 ? 'Tour' : 'Tours'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-500">/c/{c.slug}</p>
                    {c.tagline && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {c.tagline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <Link
                    href={`/c/${c.slug}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all"
                  >
                    <span>Open Company Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Add New Client Company
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Modern Architecture"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Company Portal Slug <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. apex-architecture"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  Portal URL: /c/{slug || 'company-slug'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architectural renderings and virtual walkthroughs"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-zinc-800 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-400">{primaryColor}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !slug.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
