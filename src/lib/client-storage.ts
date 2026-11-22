import { Company, Tour } from '@/types/tour';
import { defaultCompanies, allDefaultTours, defaultTour } from '@/data/default-tour';

const COMPANIES_KEY = 'vtour_companies_v1';
const TOURS_LIST_KEY = 'vtour_all_tours_list_v1';
const TOUR_PREFIX = 'vtour_tour_';
const LAST_ACTIVE_KEY = 'vtour_custom_data_v1';

/**
 * Load all companies merging defaults with local storage additions
 */
export function getLocalCompanies(): Company[] {
  if (typeof window === 'undefined') return defaultCompanies;
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (!raw) return defaultCompanies;
    const custom: Company[] = JSON.parse(raw);
    
    // Merge: custom companies override or prepend
    const map = new Map<string, Company>();
    defaultCompanies.forEach((c) => map.set(c.slug, c));
    custom.forEach((c) => map.set(c.slug, { ...map.get(c.slug), ...c }));
    return Array.from(map.values());
  } catch (e) {
    console.warn('Failed to parse local companies:', e);
    return defaultCompanies;
  }
}

/**
 * Save a new company to local storage
 */
export function saveLocalCompany(company: Company): Company[] {
  if (typeof window === 'undefined') return defaultCompanies;
  try {
    const current = getLocalCompanies();
    const existingIndex = current.findIndex((c) => c.slug === company.slug);
    let updated: Company[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = company;
    } else {
      updated = [company, ...current];
    }
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save local company:', e);
    return defaultCompanies;
  }
}

/**
 * Load all tours summary list
 */
export function getLocalToursList(): Array<{
  id: string;
  slug: string;
  title: string;
  client: string;
  companySlug?: string;
  sceneCount: number;
}> {
  if (typeof window === 'undefined') {
    return allDefaultTours.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      client: t.client,
      companySlug: t.companySlug,
      sceneCount: t.scenes.length,
    }));
  }

  try {
    const raw = localStorage.getItem(TOURS_LIST_KEY);
    const customList: Array<{
      id: string;
      slug: string;
      title: string;
      client: string;
      companySlug?: string;
      sceneCount: number;
    }> = raw ? JSON.parse(raw) : [];

    const map = new Map<string, any>();
    allDefaultTours.forEach((t) =>
      map.set(t.slug, {
        id: t.id,
        slug: t.slug,
        title: t.title,
        client: t.client,
        companySlug: t.companySlug,
        sceneCount: t.scenes.length,
      })
    );
    customList.forEach((t) => map.set(t.slug, t));

    return Array.from(map.values());
  } catch (e) {
    console.warn('Failed to get local tours list:', e);
    return allDefaultTours.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      client: t.client,
      companySlug: t.companySlug,
      sceneCount: t.scenes.length,
    }));
  }
}

/**
 * Get full tour data by slug from localStorage or default dataset
 */
export function getLocalTourBySlug(slug: string): Tour | null {
  if (typeof window === 'undefined') {
    return allDefaultTours.find((t) => t.slug === slug) || null;
  }

  try {
    // 1. Try specific tour slug key
    const raw = localStorage.getItem(`${TOUR_PREFIX}${slug}`);
    if (raw) return JSON.parse(raw);

    // 2. Try last active tour if slugs match
    const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActiveRaw) {
      const parsed = JSON.parse(lastActiveRaw);
      if (parsed.slug === slug) return parsed;
    }

    // 3. Fallback to default tours pool
    const foundDefault = allDefaultTours.find((t) => t.slug === slug);
    if (foundDefault) return foundDefault;
  } catch (e) {
    console.warn('Failed to load local tour:', e);
  }

  return defaultTour;
}

/**
 * Save full tour data to localStorage and update summary list
 */
export function saveLocalTour(tour: Tour): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Save full tour data under its unique slug
    localStorage.setItem(`${TOUR_PREFIX}${tour.slug}`, JSON.stringify(tour));
    // 2. Also save as last active tour
    localStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify(tour));

    // 3. Update summary list
    const list = getLocalToursList();
    const entry = {
      id: tour.id,
      slug: tour.slug,
      title: tour.title,
      client: tour.client,
      companySlug: tour.companySlug,
      sceneCount: tour.scenes.length,
    };

    const existingIndex = list.findIndex((t) => t.slug === tour.slug);
    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = entry;
    } else {
      updatedList = [entry, ...list];
    }
    localStorage.setItem(TOURS_LIST_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.warn('Failed to save tour locally:', e);
  }
}

/**
 * Delete a custom tour from local storage
 */
export function deleteLocalTour(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${TOUR_PREFIX}${slug}`);
    const list = getLocalToursList().filter((t) => t.slug !== slug);
    localStorage.setItem(TOURS_LIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to delete local tour:', e);
  }
}
