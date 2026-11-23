import { HotspotStyle } from '@/types/tour';

export interface HotspotStyleOption {
  id: HotspotStyle;
  name: string;
  badge: string;
  description: string;
  recommendedFor: 'link' | 'info' | 'both';
}

export const HOTSPOT_STYLE_OPTIONS: HotspotStyleOption[] = [
  {
    id: 'matterport-ring',
    name: 'Matterport Ring',
    badge: 'Popular',
    description: 'Iconic translucent floor ring disc with pulsing halo',
    recommendedFor: 'link',
  },
  {
    id: 'matterport-tag',
    name: 'Matterport Tag',
    badge: 'Iconic',
    description: 'Concentric disc wall pin with white core (like Mattertag)',
    recommendedFor: 'info',
  },
  {
    id: 'modern-chevron',
    name: 'Direction Arrow',
    badge: 'Classic',
    description: 'Sleek chevron navigation arrow pointing forward',
    recommendedFor: 'link',
  },
  {
    id: 'glowing-beacon',
    name: 'Glowing Beacon',
    badge: 'Radar',
    description: 'Pulsating radar beacon with radial glow waves',
    recommendedFor: 'both',
  },
  {
    id: 'minimal-ring',
    name: 'Minimal Ring',
    badge: 'Clean',
    description: 'Architectural thin double ring for modern spaces',
    recommendedFor: 'both',
  },
];

/**
 * Generates the HTML string injected into Photo Sphere Viewer for Link & Info hotspots
 */
export function renderHotspotMarkerHtml(
  type: 'link' | 'info',
  label: string,
  style?: HotspotStyle,
  brandColor = '#F0B429'
): string {
  // Default to Matterport styles: Ring for floor navigation, Tag for wall pins
  const effectiveStyle: HotspotStyle =
    style || (type === 'link' ? 'matterport-ring' : 'matterport-tag');

  switch (effectiveStyle) {
    case 'matterport-ring':
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;cursor:pointer;" class="psv-matterport-ring-marker group pointer-events-auto select-none">
          <div style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;">
            <!-- Outer animated radar wave -->
            <div style="position:absolute;inset:-3px;border-radius:9999px;border:2px solid rgba(255,255,255,0.45);animation:mpPulse 2.4s cubic-bezier(0,0.2,0.8,1) infinite;pointer-events:none;"></div>
            <!-- Translucent floor disc ring -->
            <div style="width:46px;height:46px;border-radius:9999px;border:3.5px solid rgba(255,255,255,0.95);background:rgba(255,255,255,0.22);backdrop-filter:blur(4px);box-shadow:0 4px 16px rgba(0,0,0,0.5),inset 0 0 10px rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);" class="mp-inner-ring">
              <!-- Center core circle -->
              <div style="width:14px;height:14px;border-radius:9999px;border:2px solid rgba(255,255,255,0.95);background:rgba(255,255,255,0.7);box-shadow:0 0 8px rgba(255,255,255,0.9);"></div>
            </div>
          </div>
          <!-- Label Pill -->
          <div style="margin-top:5px;padding:3px 10px;border-radius:9999px;background:rgba(14,32,29,0.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.25);color:#FBFCFA;font-family:inherit;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.5);transition:all 0.2s ease;">
            ${label}
          </div>
        </div>
      `;

    case 'matterport-tag':
      const tagColor = type === 'info' ? '#2F7F79' : brandColor;
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;cursor:pointer;" class="psv-matterport-tag-marker group pointer-events-auto select-none">
          <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
            <!-- Halo beacon -->
            <div style="position:absolute;inset:0px;border-radius:9999px;background:${tagColor};opacity:0.45;animation:mpPulse 2s cubic-bezier(0,0.2,0.8,1) infinite;pointer-events:none;"></div>
            <!-- Concentric circular pin -->
            <div style="width:36px;height:36px;border-radius:9999px;background:${tagColor};border:2.5px solid #FFFFFF;box-shadow:0 4px 16px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);">
              <div style="width:13px;height:13px;border-radius:9999px;border:2px solid #FFFFFF;background:#FFFFFF;"></div>
            </div>
          </div>
          <div style="margin-top:4px;padding:3px 9px;border-radius:6px;background:rgba(14,32,29,0.92);backdrop-filter:blur(8px);border:1px solid rgba(240,180,41,0.35);color:#F0B429;font-family:inherit;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
            ${label}
          </div>
        </div>
      `;

    case 'modern-chevron':
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;cursor:pointer;" class="psv-custom-link-marker group pointer-events-auto select-none">
          <div style="width:44px;height:44px;border-radius:9999px;background:rgba(14,59,52,0.92);border:2.5px solid ${brandColor};box-shadow:0 4px 16px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:${brandColor};transition:all 0.2s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>
          <div style="margin-top:5px;padding:3px 9px;border-radius:6px;background:rgba(14,59,52,0.95);backdrop-filter:blur(8px);border:1px solid rgba(240,180,41,0.4);color:#FBFCFA;font-family:inherit;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
            ${label}
          </div>
        </div>
      `;

    case 'glowing-beacon':
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;cursor:pointer;" class="group pointer-events-auto select-none">
          <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:9999px;background:${brandColor};opacity:0.45;animation:mpPulse 1.8s infinite;pointer-events:none;"></div>
            <div style="width:30px;height:30px;border-radius:9999px;background:${brandColor};border:2.5px solid #0E3B34;box-shadow:0 0 16px ${brandColor};display:flex;align-items:center;justify-content:center;color:#0E3B34;">
              <div style="width:8px;height:8px;border-radius:9999px;background:#0E3B34;"></div>
            </div>
          </div>
          <div style="margin-top:4px;padding:2px 8px;border-radius:9999px;background:rgba(20,32,29,0.9);backdrop-filter:blur(6px);border:1px solid rgba(240,180,41,0.4);color:${brandColor};font-size:10px;font-weight:700;white-space:nowrap;">
            ${label}
          </div>
        </div>
      `;

    case 'minimal-ring':
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;cursor:pointer;" class="group pointer-events-auto select-none">
          <div style="width:38px;height:38px;border-radius:9999px;border:2px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,255,255,0.45);transition:transform 0.2s;">
            <div style="width:10px;height:10px;border-radius:9999px;background:rgba(255,255,255,0.95);"></div>
          </div>
          <div style="margin-top:4px;padding:2px 7px;border-radius:4px;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);color:#FFFFFF;font-size:10px;font-weight:600;white-space:nowrap;">
            ${label}
          </div>
        </div>
      `;
  }
}

export function getMarkerSize(style?: HotspotStyle): { width: number; height: number } {
  switch (style) {
    case 'matterport-ring':
      return { width: 140, height: 85 };
    case 'matterport-tag':
      return { width: 140, height: 75 };
    case 'modern-chevron':
      return { width: 140, height: 76 };
    case 'glowing-beacon':
      return { width: 130, height: 68 };
    case 'minimal-ring':
      return { width: 120, height: 64 };
    default:
      return { width: 140, height: 80 };
  }
}
