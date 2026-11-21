Build Plan: Your Own 360 Tour Platform
Recommended stack
Layer	Choice	Why
Viewer	Photo Sphere Viewer (with Markers + Virtual Tour plugins)	Free, open source, built for exactly this: scene linking, markers, popups, mobile gyro
App framework	Next.js (or plain Vite + React)	One codebase for the viewer, embed pages, and admin editor
Database	Supabase (Postgres + login)	Free tier is enough to start, handles client accounts later
File storage	Cloudflare R2	Cheap, no bandwidth fees, good for big panoramas
Hosting	Vercel or Cloudflare Pages	Free or nearly free, gives you HTTPS and a custom domain
Image processing	Sharp (Node) or libvips	Resizes and creates tiles automatically on upload

Expected running cost: roughly $0-10/month plus a domain.

Data model

Keep it simple. Three things:

Tour: id, title, client, slug, start scene, settings (auto-rotate, logo, colors)
Scene: id, tour id, name, image URL(s), initial view angle, optional floor/order
Hotspot: id, scene id, type (link or info), position (yaw/pitch), and either a target scene or content (title, text, image, video/link)

Everything the viewer needs can be served as one JSON per tour. This is also what makes the early phases possible without a database.

Phase 0: Prep (1-2 days)
Export your Insta360 stitched photos as equirectangular JPGs (2:1 ratio, e.g. 6080x3040 or 11968x5984).
Pick 1 existing tour as your test project, ideally the art gallery, since it needs both hotspot types.
Set up GitHub, Vercel, and Cloudflare accounts.
Decide on a name and buy a domain (clients will see it in the embed).
Phase 1: Single panorama viewer (1-2 days)
Create the project and install Photo Sphere Viewer.
Load one panorama full screen.
Test on your phone: drag, pinch zoom, gyroscope.

Done when: one of your photos looks good on desktop and phone.

Phase 2: Walk between scenes (3-4 days)
Add the Virtual Tour plugin with 3-5 scenes defined in a hardcoded JSON file.
Add link hotspots (arrows or circles on the floor/doorways) that jump to the next scene.
Add a fade transition and make the next scene open facing the direction of travel.
Add a scene list or small menu so visitors can jump anywhere.

Done when: you can walk through a real tour end to end.

Phase 3: Info hotspots (2-3 days)
Add a second marker type (an "i" icon) that opens a popup or side panel.
Popup content: title, description text, optional image, optional link or YouTube/Vimeo embed.
Make it work well on mobile (bottom sheet instead of tiny tooltip).

Done when: clicking a painting shows its title, artist, and description.

Phase 4: Embeddable and sharable (2 days)
Create a route like /embed/[tour-slug] with no site chrome, just the viewer.
Create a full page version at /tour/[tour-slug] with a title and share button.
Add a "Copy embed code" box that outputs the iframe snippet, with allow="fullscreen; gyroscope; accelerometer".
Allow responsive embedding (percentage width, 16:9 or custom height).
Test by pasting the iframe into a plain HTML page, a WordPress page, and Wix/Squarespace if your clients use them.

Done when: a client's site shows the tour inside an iframe on desktop and mobile. At this point you have a sellable product.

Phase 5: Storage and performance (3-4 days)
Move files to Cloudflare R2.
On upload, auto-generate: a tiny blurred preview (loads instantly), a 4K version for mobile, and a full-size version for desktop. Tiling for 8K+ images is optional.
Preload the scenes linked from the current one, so jumps feel instant.
Aim for the first view appearing in under 2 seconds on a phone.
Phase 6: Admin editor (1-2 weeks, the biggest phase)

Build a private /admin area:

Login (Supabase auth, just you at first).
Create tour: name, slug, upload multiple panoramas at once with progress bars.
Scene manager: reorder, rename, set the starting direction by dragging the view and clicking "set as start."
Hotspot placement: open a scene, click "Add link" or "Add info," click on the image where it should go, then pick the target scene or type the description. Drag to reposition, delete to remove.
Preview button that opens the real viewer.
Publish toggle and a copy-link/copy-embed panel.

Tip: reuse the same viewer component in the editor, with an "edit mode" that lets you click to get yaw/pitch coordinates.

Phase 7: Business features (optional, add as needed)
Branding: your logo watermark, or the client's logo, plus custom colors.
Client access: separate logins so clients can edit their own descriptions.
Floor plan / mini map with a position dot.
Analytics: views per tour (useful to show clients).
Password-protected or unlisted tours.
Domain restriction: only allow a tour to be embedded on the client's domain (stops people copying embeds).
Background audio, auto-rotate, VR mode (Cardboard-style).
Import your existing tours (see the migration section below).
Contact/book-now button inside tours for galleries, hotels, real estate.
Migrating existing tours
Download the original panoramas from your Kuula/other account.
Hotspot positions won't transfer automatically, so plan to rebuild them. For a small number of tours that's an afternoon each once the editor works.
Keep old subscriptions running until each tour is rebuilt and tested, then cancel.
Testing checklist
iPhone Safari and Android Chrome (most client traffic)
Embedded inside an iframe on WordPress, Wix, Squarespace
Slow connection (throttle to 4G in browser dev tools)
Fullscreen button works inside iframes
Gyroscope permission prompt on iOS
Large tours (30+ scenes) still load smoothly
Timeline
Goal	Time (part-time, with Claude's help)
Working viewer with hotspots + embed (Phases 1-4)	1-2 weeks
Fast and hosted properly (Phase 5)	+1 week
Full admin editor (Phase 6)	+2 weeks
Business extras (Phase 7)	ongoing
Risks and how to handle them
Large files slow loading: handle with Phase 5 resizing, don't skip it.
Editor complexity: build the viewer first and use a JSON file; the editor can come later.
Client support: you are now the support team; a simple status check and backups of your R2 bucket cover most problems.
iOS quirks with gyroscope and fullscreen in iframes: test early, not at the end.
Scope creep: don't build Matterport-style dollhouse views or floor-plan auto-generation; they need depth cameras.
What I'd do first

Start with Phases 1-4 using a hardcoded JSON file and one real tour. You can show a client a working embed within days, and every later phase improves something already working.

If you'd like, I can build that first working version for you now: a viewer with hotspots between scenes, info popups, and an embed page. If you send me 3-5 panorama photos (or tell me to use placeholders), I'll set it up so you only have to swap in your own images. I can also put this plan in an editable doc if you'd rather keep it.