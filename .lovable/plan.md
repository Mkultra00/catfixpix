## LOLCatz.ai — Scoped Build Plan

Trimmed from the spec to fit your constraints (no login, Lovable AI only, TheCatAPI, no TTS).

### What's in
- Single-page meme generator: fetch random cat → generate LOLCatz caption → display.
- Refresh button for a new cat+caption.
- Save favorites to `localStorage`.
- Share via Web Share API (mobile) / copy-link fallback (desktop).
- Download as PNG (Canvas composite: cat image + caption overlay).
- Mobile-first responsive, Impact-font caption with black stroke.

### What's cut from the doc
- ElevenLabs voice / Web Audio / mouth animation
- Supabase / Lovable Cloud, all DB tables, Edge Functions
- Auth, Pro tier, video export, embed widget, Cat of the Day, admin dashboard
- Shareable `/cat/:id` permalinks with OG previews (can't do without persistence)

### Architecture

```
Browser (React/TanStack Start)
   │
   ├── GET https://api.thecatapi.com/v1/images/search  (direct, no key)
   │
   └── POST /api/generate-caption  (TanStack server route)
            │
            └── Lovable AI Gateway (gemini-3-flash-preview)
                 — vision prompt with cat image URL → LOLCatz caption
```

Server route keeps `LOVABLE_API_KEY` server-side. Caption generation is the only server call.

### Files

- `src/routes/index.tsx` — main page with CatCard, ActionBar, Favorites drawer.
- `src/routes/api/generate-caption.ts` — server route calling Lovable AI Gateway with a vision-capable model and the LOLCatz system prompt.
- `src/components/CatCard.tsx` — image + caption overlay (Impact font, white text, black stroke).
- `src/components/ActionBar.tsx` — Refresh, Save, Share, Download buttons.
- `src/lib/favorites.ts` — localStorage helpers.
- `src/lib/export-png.ts` — Canvas composite for PNG download.
- `src/styles.css` — add Impact/Anton font, dark playful theme tokens.
- `src/routes/__root.tsx` — update meta tags (title, description, OG defaults).

### LOLCatz caption prompt (server route)
System prompt instructs Gemini to view the cat image and produce 5–15 words, first-person, intentionally misspelled ("can haz", "iz", "ur"), PG-rated. Returns plain text.

### UX flow
1. Page loads → auto-fetch first cat + caption (loading skeleton).
2. Refresh → spin animation, fetch new pair.
3. Heart → save snapshot `{imageUrl, caption}` to localStorage; toast.
4. Share → Web Share API with image URL + caption, fallback to clipboard.
5. Download → canvas-rendered 1080×1080 PNG.
6. Favorites button → opens Sheet with saved cats grid; tap to re-display.

### Design direction
Playful dark theme, big bold display font for the caption, soft glow on the card, chunky rounded action buttons. Suggest I just build it; if you want palette/typography options first, say the word.

### Cost & risk notes
- TheCatAPI free tier: 10K req/month, no key needed for `/images/search`.
- Each caption ≈ a few cents of Lovable AI credits; no audio means costs stay tiny.
- No persistence = no virality permalinks. If that matters later, enable Lovable Cloud and add a `cats` table + dynamic OG route.

### Open questions
None blocking — ready to build on approval.
