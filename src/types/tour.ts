export interface HotspotInfo {
  title: string;
  category?: string;
  description: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'embed';
  linkUrl?: string;
  linkLabel?: string;
  badge?: string;
  audioUrl?: string;
}

export interface HotspotPosition {
  yaw: number | string;   // horizontal angle (radians or degrees e.g. "45deg" or 0.785)
  pitch: number | string; // vertical angle (radians or degrees e.g. "-15deg" or -0.26)
}

export type HotspotStyle =
  | 'matterport-ring'
  | 'matterport-tag'
  | 'modern-chevron'
  | 'glowing-beacon'
  | 'minimal-ring';

export interface Hotspot {
  id: string;
  type: 'link' | 'info';
  style?: HotspotStyle;
  position: HotspotPosition;
  // For 'link' hotspots (moving between scenes)
  targetSceneId?: string;
  targetHeading?: number; // target facing direction in radians
  label?: string;
  // For 'info' hotspots (popups / modal / bottom sheet)
  info?: HotspotInfo;
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  floor?: string | number;
  initialView?: {
    yaw: number | string;
    pitch: number | string;
    zoom?: number;
  };
  hotspots: Hotspot[];
}

export interface TourSettings {
  autoRotate?: boolean;
  autoRotateSpeed?: string; // e.g. "0.5rpm"
  autoRotateDelay?: number; // ms
  defaultHotspotStyle?: HotspotStyle;
  logoUrl?: string;
  brandName?: string;
  primaryColor?: string;
  showSceneList?: boolean;
  showGyroscope?: boolean;
  allowFullscreen?: boolean;
}

export interface Tour {
  id: string;
  companyId?: string;
  companySlug?: string;
  slug: string;
  title: string;
  client: string; // company / client name
  description?: string;
  startSceneId: string;
  settings: TourSettings;
  scenes: Scene[];
  status?: 'published' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  slug: string; // URL-safe slug e.g. "skyline-realty"
  name: string; // e.g. "Skyline Luxury Realty"
  tagline?: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryColor?: string;
  toursCount?: number;
  createdAt?: string;
}
