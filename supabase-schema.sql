-- ==============================================================================
-- 360 VIRTUAL TOUR PLATFORM SCHEMA
-- Run this in Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. TOURS TABLE
create table if not exists public.tours (
  id text primary key default ('tour_' || replace(uuid_generate_v4()::text, '-', '')),
  slug text unique not null,
  title text not null,
  client text not null,
  description text default '',
  start_scene_id text,
  settings jsonb default '{"autoRotate": true, "autoRotateSpeed": "0.4rpm", "autoRotateDelay": 4000, "showSceneList": true, "showGyroscope": true, "allowFullscreen": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index on slug for fast tour resolution
create index if not exists idx_tours_slug on public.tours(slug);

-- 3. SCENES TABLE
create table if not exists public.scenes (
  id text primary key default ('scene_' || replace(uuid_generate_v4()::text, '-', '')),
  tour_id text references public.tours(id) on delete cascade not null,
  name text not null,
  description text default '',
  image_url text not null,
  thumbnail_url text,
  floor text default 'Floor 1',
  order_index int default 0,
  initial_view jsonb default '{"yaw": 0, "pitch": 0, "zoom": 50}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_scenes_tour_id on public.scenes(tour_id);

-- 4. HOTSPOTS TABLE
create table if not exists public.hotspots (
  id text primary key default ('hs_' || replace(uuid_generate_v4()::text, '-', '')),
  scene_id text references public.scenes(id) on delete cascade not null,
  type text not null check (type in ('link', 'info')),
  position jsonb not null, -- { yaw: "...", pitch: "..." }
  target_scene_id text,
  target_heading numeric,
  label text,
  info jsonb, -- { title, category, description, mediaUrl, mediaType, linkUrl, linkLabel, badge }
  created_at timestamptz default now()
);

create index if not exists idx_hotspots_scene_id on public.hotspots(scene_id);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.tours enable row level security;
alter table public.scenes enable row level security;
alter table public.hotspots enable row level security;

-- Public read access so clients & visitors can view live / embedded tours
create policy "Allow public read tours" on public.tours for select using (true);
create policy "Allow public read scenes" on public.scenes for select using (true);
create policy "Allow public read hotspots" on public.hotspots for select using (true);

-- Allow insert/update/delete for tour creator / studio (with anon key or service key)
create policy "Allow all write tours" on public.tours for all using (true) with check (true);
create policy "Allow all write scenes" on public.scenes for all using (true) with check (true);
create policy "Allow all write hotspots" on public.hotspots for all using (true) with check (true);

-- 6. STORAGE BUCKET FOR 360 PANORAMAS & IMAGES
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'panoramas',
  'panoramas',
  true,
  52428800, -- 50MB per 360 equirectangular image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = true;

-- Storage policies: Anyone can view images, anyone can upload
create policy "Public Access Panoramas" on storage.objects for select using (bucket_id = 'panoramas');
create policy "Allow Upload Panoramas" on storage.objects for insert with check (bucket_id = 'panoramas');
create policy "Allow Update Panoramas" on storage.objects for update using (bucket_id = 'panoramas');
