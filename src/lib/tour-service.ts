import { Tour, Scene, Hotspot } from '@/types/tour';
import { defaultTour } from '@/data/default-tour';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fetch a tour by slug (for /tour/[slug] and /embed/[slug])
 */
export async function getTourBySlug(slug: string): Promise<Tour | null> {
  if (!isSupabaseConfigured || !supabase) {
    if (slug === defaultTour.slug || slug === 'demo' || slug === 'art-gallery') {
      return defaultTour;
    }
    return defaultTour;
  }

  try {
    // 1. Fetch tour
    const { data: tourData, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tourError || !tourData) {
      console.warn('Tour not found in Supabase, falling back to default:', tourError?.message);
      return slug === defaultTour.slug ? defaultTour : null;
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
        slug: tourData.slug,
        title: tourData.title,
        client: tourData.client,
        description: tourData.description,
        startSceneId: tourData.start_scene_id,
        settings: tourData.settings || {},
        scenes: [],
      };
    }

    // 3. Fetch hotspots for all scenes in this tour
    const sceneIds = scenesData.map((s: any) => s.id);
    const { data: hotspotsData, error: hotspotsError } = await supabase
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
      slug: tourData.slug,
      title: tourData.title,
      client: tourData.client,
      description: tourData.description,
      startSceneId: tourData.start_scene_id || scenes[0]?.id || '',
      settings: tourData.settings || defaultTour.settings,
      scenes,
    };
  } catch (err) {
    console.error('Error fetching tour by slug:', err);
    return defaultTour;
  }
}

/**
 * Fetch all tours for the studio dashboard
 */
export async function getAllTours(): Promise<Array<{ id: string; slug: string; title: string; client: string; sceneCount: number; updatedAt: string }>> {
  if (!isSupabaseConfigured || !supabase) {
    return [
      {
        id: defaultTour.id,
        slug: defaultTour.slug,
        title: defaultTour.title,
        client: defaultTour.client,
        sceneCount: defaultTour.scenes.length,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('tours')
      .select('id, slug, title, client, updated_at, scenes(id)')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((t: any) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      client: t.client,
      sceneCount: Array.isArray(t.scenes) ? t.scenes.length : 0,
      updatedAt: t.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error listing tours:', err);
    return [];
  }
}

/**
 * Save full tour (upsert tour, scenes, and hotspots)
 */
export async function saveTour(tour: Tour): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured yet' };
  }

  try {
    // 1. Upsert tour header
    const { error: tourError } = await supabase
      .from('tours')
      .upsert({
        id: tour.id,
        slug: tour.slug,
        title: tour.title,
        client: tour.client,
        description: tour.description || '',
        start_scene_id: tour.startSceneId,
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
