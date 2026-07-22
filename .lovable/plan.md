## Plan

Restructure the homepage section order and apply the styling changes below. Copy, links, and button destinations stay exactly as-is unless explicitly listed.

## 1. Section reorder (`src/routes/index.tsx`)

New top-to-bottom order:

1. Hero
2. Our Illustrious Heritage
3. Philosophy of the Founder
4. The David C. Stanton Collection
5. Conversation to Creation (Bespoke Artistry)
6. Questions Answered Before You Ask
7. Chat / Call / Meet
8. Footer

Move JSX blocks only — no scroll choreography, hero pan, or existing anchor IDs change. Adjacent-section dividers/handoffs get re-paired so the color transitions still flow.

## 2. Our Illustrious Heritage — cream gallery wall

- Remove the "— David C. Stanton, Founder" signature line under the portrait copy. All other text unchanged.
- Remove the heavy border/frame around the portrait.
- Section background: rich warm cream (approx `#efe7d8`) with a very subtle vertical gradient for wall depth.
- Portrait gets a realistic gallery drop shadow: soft, diffused, directional (light from upper-left), no ring/border. Layered box-shadow:
  - close contact: `0 4px 10px -4px rgba(20,15,10,0.30)`
  - ambient mid: `0 22px 40px -18px rgba(20,15,10,0.28)`
  - wide falloff: `0 60px 90px -40px rgba(20,15,10,0.22)`
- Text: shift body copy to warm dark ink (`#2a2118`) and eyebrow/heading to existing navy so both stay legible on cream.

## 3. The David C. Stanton Collection — heading fit

- Force the heading onto one line (reduce clamp max, `white-space: nowrap` on desktop, allow shrink on mobile so "Collection" no longer drops).
- Reduce heading `font-size` (approx down ~15–20%).
- Reduce the sub-line ("A style for everyone…") proportionally so the pair feels balanced.
- Carousel, cards, dots, dropdowns, shadows — unchanged.

## 4. Conversation to Creation — navy fade

- "Bespoke Artistry" eyebrow color → dark navy blue (site `--ink` navy).
- Section background becomes a vertical navy gradient that lightens ~18% toward the bottom of the 4-step block — top stays current deep navy, final step sits on a subtly lighter navy so it reads as light-at-end-of-tunnel. Achieved with a single `linear-gradient` on the section; text/step markers keep current colors.

## 5. Questions Answered Before You Ask

- Tighten the vertical gap between the section heading and the accordion/dropdown box (reduce heading `margin-bottom` and/or section `padding-top` on the box). No content changes.

## 6. Chat / Call / Meet — cream

- Background → same warm cream family as Heritage (slightly lighter, e.g. `#f5efe1`) so it reads as welcoming.
- Retune text/label colors and input borders to the darker warm ink for legibility. Buttons keep their existing gold/navy styling.

## 7. Footer — navy, trimmed, unified socials (`src/components/SiteFooter.tsx`)

- Background: navy (site `--ink`).
- Text + link color: warm off-white; brand mark stays gold; hover accents in gold.
- Strip all product sub-lines. Keep only section-anchor header links:
  - Discover the Kingdom → `#top`
  - Our Heritage → `#heritage`
  - Bespoke Artistry → `#journey`
  - The David C. Stanton Collection → `#collections`
  - Get Acquainted → `#begin`
- Social icons: install the 5 uploaded PNGs as Lovable Assets (WhatsApp, Instagram, TikTok, LinkedIn, X). Render them at a uniform 22×22 in a single row, all-white treatment via `filter: brightness(0) invert(1)` so weight/size read identically across platforms. Preserve existing href targets.

## 8. Bottom tagline

- "Every piece begins with a story. Ours begins with yours." wording unchanged.
- Restyle: clean regular serif (existing `--serif`), normal weight, italic off, sized to match surrounding footer meta text (approx `0.95rem`), gold or warm off-white — no oversized display treatment.

## Files touched

- `src/routes/index.tsx` — section reorder, Heritage signature removal, Collection heading markup tweak, small class hooks for new backgrounds.
- `src/components/SiteFooter.tsx` — trimmed link list, new social icon imports, tagline restyle.
- `src/styles.css` — Heritage cream + portrait shadow, Collection heading sizes, Bespoke Artistry gradient + eyebrow color, FAQ spacing, Chat/Call/Meet cream, footer navy + link/social styles, tagline styles.
- `src/assets/social-*.png.asset.json` — 5 new asset pointers for uploaded social icons.

## Verification

- Mobile 411×738 and desktop:
  - Sections appear in the new order with smooth color transitions.
  - Heritage: no signature line, no frame, cream wall, realistic drop shadow on portrait, copy readable.
  - Collection heading fits on one line, visibly smaller; sub-line proportionate.
  - Bespoke Artistry eyebrow is navy; navy background clearly lightens toward the last step.
  - FAQ heading sits close to the dropdown.
  - Chat/Call/Meet reads as warm cream, all text legible.
  - Footer is navy with white/gold text; only the 5 header links present; 5 uniform white social icons; tagline in clean serif at matching size.
