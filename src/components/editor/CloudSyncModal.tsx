'use client';

import React, { useState, useEffect } from 'react';
import { Tour } from '@/types/tour';
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient } from '@/lib/supabase';
import {
  Cloud,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  X,
  Database,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  onSyncComplete?: () => void;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  tour,
  onSyncComplete,
}: CloudSyncModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.url) setUrl(config.url);
    if (config.anonKey) setAnonKey(config.anonKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;

    setIsTesting(true);
    setSyncStatus('idle');
    setStatusMessage('Connecting to Supabase cloud...');

    try {
      // 1. Save config to local storage
      saveSupabaseConfig(url.trim(), anonKey.trim());

      // 2. Test connection with Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(url.trim(), anonKey.trim());

      // Try upserting the current tour
      const { error: tourError } = await testClient.from('tours').upsert({
        id: tour.id,
        company_id: tour.companyId || null,
        company_slug: tour.companySlug || null,
        slug: tour.slug,
        title: tour.title,
        client: tour.client,
        description: tour.description || '',
        start_scene_id: tour.startSceneId,
        status: tour.status || 'published',
        settings: tour.settings,
        updated_at: new Date().toISOString(),
      });

      if (tourError) {
        throw new Error(`Database error: ${tourError.message}. Make sure you ran the SQL schema in Supabase!`);
      }

      // Upsert scenes and hotspots
      for (let i = 0; i < tour.scenes.length; i++) {
        const s = tour.scenes[i];
        await testClient.from('scenes').upsert({
          id: s.id,
          tour_id: tour.id,
          name: s.name,
          description: s.description || '',
          image_url: s.imageUrl,
          thumbnail_url: s.thumbnailUrl || s.imageUrl,
          floor: String(s.floor || 'Floor 1'),
          order_index: i,
          initial_view: s.initialView || { yaw: 0, pitch: 0, zoom: 50 },
        });

        // Re-sync hotspots
        await testClient.from('hotspots').delete().eq('scene_id', s.id);
        if (s.hotspots && s.hotspots.length > 0) {
          const payload = s.hotspots.map((h) => ({
            id: h.id,
            scene_id: s.id,
            type: h.type,
            position: h.position,
            target_scene_id: h.targetSceneId || null,
            target_heading: h.targetHeading || null,
            label: h.label || null,
            info: h.info || null,
          }));
          await testClient.from('hotspots').insert(payload);
        }
      }

      setSyncStatus('success');
      setStatusMessage('Connected successfully! Tour and all hotspots are synced to the cloud.');
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      console.error('Cloud connection test failed:', err);
      setSyncStatus('error');
      setStatusMessage(err.message || 'Connection failed. Please check your URL and anon key.');
    } finally {
      setIsTesting(false);
    }
  };

  const copySqlSchema = () => {
    const sql = `-- Run this in Supabase SQL Editor
create extension if not exists "uuid-ossp";

create table if not exists public.companies (
  id text primary key default ('comp_' || replace(uuid_generate_v4()::text, '-', '')),
  slug text unique not null,
  name text not null,
  tagline text default '',
  logo_url text,
  website text,
  primary_color text default '#F0B429',
  created_at timestamptz default now()
);

create table if not exists public.tours (
  id text primary key default ('tour_' || replace(uuid_generate_v4()::text, '-', '')),
  company_id text references public.companies(id) on delete set null,
  company_slug text,
  slug text unique not null,
  title text not null,
  client text not null,
  description text default '',
  start_scene_id text,
  status text default 'published',
  settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.scenes (
  id text primary key default ('scene_' || replace(uuid_generate_v4()::text, '-', '')),
  tour_id text references public.tours(id) on delete cascade not null,
  name text not null,
  description text default '',
  image_url text not null,
  thumbnail_url text,
  floor text default 'Floor 1',
  order_index int default 0,
  initial_view jsonb default '{"yaw": 0, "pitch": 0, "zoom": 50}'::jsonb
);

create table if not exists public.hotspots (
  id text primary key,
  scene_id text references public.scenes(id) on delete cascade not null,
  type text not null,
  position jsonb not null,
  target_scene_id text,
  target_heading numeric,
  label text,
  info jsonb
);

alter table public.companies enable row level security;
alter table public.tours enable row level security;
alter table public.scenes enable row level security;
alter table public.hotspots enable row level security;

create policy "Public read tours" on public.tours for select using (true);
create policy "Public write tours" on public.tours for all using (true);
create policy "Public read scenes" on public.scenes for select using (true);
create policy "Public write scenes" on public.scenes for all using (true);
create policy "Public read hotspots" on public.hotspots for select using (true);
create policy "Public write hotspots" on public.hotspots for all using (true);
create policy "Public read companies" on public.companies for select using (true);
create policy "Public write companies" on public.companies for all using (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-forest/95 border border-line/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line/20 bg-ink/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-extrabold text-paper">
                Supabase Cloud Database Sync
              </h3>
              <p className="text-xs text-muted">
                Automatic real-time sync for tours, scenes, and hotspots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-paper hover:bg-forest-light transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConnectAndSync} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Box */}
          <div className="p-3.5 rounded-xl bg-ink/80 border border-line/30 flex items-start gap-3">
            <Database className="w-5 h-5 text-saffron shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-paper">
                  Tour: {tour.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal/20 text-teal-light border border-teal/30">
                  {tour.scenes.reduce((sum, s) => sum + s.hotspots.length, 0)} Hotspots Ready
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Every time you place, move, or edit a hotspot, the platform immediately pushes the changes to your Supabase cloud database.
              </p>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-mist mb-1 block">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3.5 py-2.5 bg-ink border border-line/40 rounded-xl text-xs text-paper font-mono placeholder:text-muted focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mist mb-1 block">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3.5 py-2.5 bg-ink border border-line/40 rounded-xl text-xs text-paper font-mono placeholder:text-muted focus:outline-none focus:border-saffron"
              />
            </div>
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                syncStatus === 'success'
                  ? 'bg-teal/20 text-teal-light border border-teal/40'
                  : syncStatus === 'error'
                  ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                  : 'bg-ink text-muted'
              }`}
            >
              {syncStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {syncStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line/20">
            <button
              type="button"
              onClick={copySqlSchema}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-forest-light hover:bg-forest text-mist hover:text-paper border border-line/30 text-xs font-display font-bold transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5 text-saffron" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy Database SQL Setup'}</span>
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-line/30 text-xs font-semibold text-mist hover:text-paper hover:bg-forest-light transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isTesting || !url || !anonKey}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-ink text-xs font-display font-extrabold shadow-lg transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Connect &amp; Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
