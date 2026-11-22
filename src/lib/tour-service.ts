import { Tour, Scene, Hotspot, Company } from '@/types/tour';
import { defaultTour, defaultCompanies, allDefaultTours } from '@/data/default-tour';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fetch all registered companies
 */
export async function getAllCompanies(): Promise<Company[]> {
  if (!isSupabaseConfigured || !supabase) {
    return defaultCompanies;
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*, tours:tours(id)')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return defaultCompanies;
    }

    return data.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      logoUrl: c.logo_url,
      website: c.website,
      contactEmail: c.contact_email,
      contactPhone: c.contact_phone,
      primaryColor: c.primary_color || '#3b82f6',
      toursCount: Array.isArray(c.tours) ? c.tours.length : 0,
      createdAt: c.created_at,
    }));
  } catch (err) {
    console.error('Error fetching companies:', err);
    return defaultCompanies;
  }
}

/**
 * Fetch a single company by slug
 */
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  if (!isSupabaseConfigured || !supabase) {
    return defaultCompanies.find((c) => c.slug === slug) || null;
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*, tours:tours(id)')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return defaultCompanies.find((c) => c.slug === slug) || null;
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      logoUrl: data.logo_url,
      website: data.website,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      primaryColor: data.primary_color || '#3b82f6',
      toursCount: Array.isArray(data.tours) ? data.tours.length : 0,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error fetching company by slug:', err);
    return defaultCompanies.find((c) => c.slug === slug) || null;
  }
}

/**
 * Save or create a company
 */
export async function saveCompany(company: Company): Promise<{ success: boolean; company?: Company; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, company };
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .upsert({
        id: company.id,
        slug: company.slug,
        name: company.name,
        tagline: company.tagline || '',
        logo_url: company.logoUrl || null,
        website: company.website || null,
        contact_email: company.contactEmail || null,
        contact_phone: company.contactPhone || null,
        primary_color: company.primaryColor || '#3b82f6',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, company: data };
  } catch (err: any) {
    console.error('Error saving company:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all tours for a specific company or all companies
 */
export async function getAllTours(companySlug?: string): Promise<Array<{
  id: string;
  slug: string;
  title: string;
  client: string;
  companySlug?: string;
  sceneCount: number;
  status: string;
  coverImage?: string;
  updatedAt: string;
}>> {
  if (!isSupabaseConfigured || !supabase) {
    const pool = allDefaultTours.filter((t) => !companySlug || t.companySlug === companySlug);
    return pool.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      client: t.client,
      companySlug: t.companySlug,
      sceneCount: t.scenes.length,
      status: t.status || 'published',
      coverImage: t.scenes[0]?.thumbnailUrl || t.scenes[0]?.imageUrl,
      updatedAt: new Date().toISOString(),
    }));
  }

  try {
    let query = supabase
      .from('tours')
      .select('id, slug, title, client, company_slug, status, updated_at, scenes(id, thumbnail_url, image_url)')
      .order('updated_at', { ascending: false });

    if (companySlug) {
      query = query.eq('company_slug', companySlug);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((t: any) => {
      const scenes = Array.isArray(t.scenes) ? t.scenes : [];
      const cover = scenes[0]?.thumbnail_url || scenes[0]?.image_url;
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        client: t.client,
        companySlug: t.company_slug,
        sceneCount: scenes.length,
        status: t.status || 'published',
        coverImage: cover,
        updatedAt: t.updated_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('Error listing tours:', err);
    return [];
  }
}

/**
 * Fetch a tour by slug (for /tour/[slug] and /embed/[slug])
 */
export async function getTourBySlug(slug: string): Promise<Tour | null> {
  if (!isSupabaseConfigured || !supabase) {
    const found = allDefaultTours.find((t) => t.slug === slug);
    return found || defaultTour;
  }

  try {
    // 1. Fetch tour
    const { data: tourData, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tourError || !tourData) {
      console.warn('Tour not found in Supabase, checking fallback:', tourError?.message);
      const found = allDefaultTours.find((t) => t.slug === slug);
      return found || null;
    }

    // 2. Fetch scenes ordered
    const { data: scenesData, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('tour_id', tourData.id)
      .order('order_index', { ascending: true });

    if (scenesError || !scenesData) {
      return {
        id: tourData.id,
        companyId: tourData.company_id,
        companySlug: tourData.company_slug,
        slug: tourData.slug,
        title: tourData.title,
        client: tourData.client,
        description: tourData.description,
        startSceneId: tourData.start_scene_id,
        status: tourData.status || 'published',
        settings: tourData.settings || {},
        scenes: [],
      };
    }

    // 3. Fetch hotspots for all scenes in this tour
    const sceneIds = scenesData.map((s: any) => s.id);
    const { data: hotspotsData } = await supabase
      .from('hotspots')
      .select('*')
      .in('scene_id', sceneIds);

    const hotspotsByScene = (hotspotsData || []).reduce((acc: Record<string, Hotspot[]>, h: any) => {
      if (!acc[h.scene_id]) acc[h.scene_id] = [];
      acc[h.scene_id].push({
        id: h.id,
        type: h.type,
        position: h.position,
        targetSceneId: h.target_scene_id,
        targetHeading: h.target_heading,
        label: h.label,
        info: h.info,
      });
      return acc;
    }, {});

    const scenes: Scene[] = scenesData.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      imageUrl: s.image_url,
      thumbnailUrl: s.thumbnail_url || s.image_url,
      floor: s.floor,
      initialView: s.initial_view,
      hotspots: hotspotsByScene[s.id] || [],
    }));

    return {
      id: tourData.id,
      companyId: tourData.company_id,
      companySlug: tourData.company_slug,
      slug: tourData.slug,
      title: tourData.title,
      client: tourData.client,
      description: tourData.description,
      startSceneId: tourData.start_scene_id || scenes[0]?.id || '',
      status: tourData.status || 'published',
      settings: tourData.settings || defaultTour.settings,
      scenes,
    };
  } catch (err) {
    console.error('Error fetching tour by slug:', err);
    return defaultTour;
  }
}

/**
 * Save full tour (upsert tour, scenes, and hotspots)
 */
export async function saveTour(tour: Tour): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    // 1. Upsert tour header
    const { error: tourError } = await supabase
      .from('tours')
      .upsert({
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

    if (tourError) throw tourError;

    // 2. Upsert scenes
    for (let i = 0; i < tour.scenes.length; i++) {
      const s = tour.scenes[i];
      const { error: sceneError } = await supabase
        .from('scenes')
        .upsert({
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

      if (sceneError) throw sceneError;

      // 3. Clear existing hotspots for this scene and re-insert
      await supabase.from('hotspots').delete().eq('scene_id', s.id);

      if (s.hotspots && s.hotspots.length > 0) {
        const hotspotsPayload = s.hotspots.map((h) => ({
          id: h.id,
          scene_id: s.id,
          type: h.type,
          position: h.position,
          target_scene_id: h.targetSceneId || null,
          target_heading: h.targetHeading || null,
          label: h.label || null,
          info: h.info || null,
        }));

        const { error: hsError } = await supabase.from('hotspots').insert(hotspotsPayload);
        if (hsError) throw hsError;
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving tour to Supabase:', err);
    return { success: false, error: err.message || 'Failed to save tour' };
  }
}
