/** The eleven cuts the house works in, drawn as technical sketches.
 *
 *  Hand-authored, not a stock icon set: a bought pack carries a licence and a
 *  line weight that would never match the hairline rules the rest of the site
 *  is built from. Each drawing is the girdle outline, the table, and the
 *  characteristic facet architecture of that cut — the eight-fold wheel of the
 *  brilliants, the concentric step frames of the emerald family, Asscher's
 *  windmill, the princess chevrons — reduced to what stays legible at 30px.
 *
 *  Every stone sits centred in the same 44×44 box with a normalized visual
 *  footprint (brilliants ~34 tall, elongated cuts ~37), so a row reads as one
 *  engraved plate rather than eleven separate drawings. Stroke colour and
 *  width come from CSS, never from here. */

const S: Record<string, React.ReactNode> = {
  Round: (
    <>
      <circle cx="22" cy="22" r="17" />
      {/* table */}
      <path d="M29.4 25.1 25.1 29.4 18.9 29.4 14.6 25.1 14.6 18.9 18.9 14.6 25.1 14.6 29.4 18.9Z" />
      {/* kite mains, table corner to girdle */}
      <path d="M29.4 25.1 37.7 28.5M25.1 29.4 28.5 37.7M18.9 29.4 15.5 37.7M14.6 25.1 6.3 28.5M14.6 18.9 6.3 15.5M18.9 14.6 15.5 6.3M25.1 14.6 28.5 6.3M29.4 18.9 37.7 15.5" />
      {/* star facets from the table's edge midpoints — drawn on the INNER
          half so the rim stays a clean circle rather than growing teeth */}
      <path d="M29.4 22 34.5 22M27.2 27.2 30.8 30.8M22 29.4 22 34.5M16.8 27.2 13.2 30.8M14.6 22 9.5 22M16.8 16.8 13.2 13.2M22 14.6 22 9.5M27.2 16.8 30.8 13.2" />
    </>
  ),
  Oval: (
    <>
      <ellipse cx="22" cy="22" rx="12" ry="17.5" />
      <path d="M27.2 25.1 24.1 29.6 19.9 29.6 16.8 25.1 16.8 18.9 19.9 14.4 24.1 14.4 27.2 18.9Z" />
      <path d="M27.2 25.1 33.1 28.7M24.1 29.6 26.6 38.2M19.9 29.6 17.4 38.2M16.8 25.1 10.9 28.7M16.8 18.9 10.9 15.3M19.9 14.4 17.4 5.8M24.1 14.4 26.6 5.8M27.2 18.9 33.1 15.3" />
      <path d="M27.2 22 31.1 22M25.7 27.3 28.5 31.4M22 29.5 22 35.3M18.3 27.3 15.5 31.4M16.8 22 12.9 22M18.3 16.7 15.5 12.6M22 14.5 22 8.7M25.7 16.7 28.5 12.6" />
    </>
  ),
  Pear: (
    <>
      <path d="M22 3.5C28.5 12 33 18.5 33 26.5A11 11 0 0 1 11 26.5C11 18.5 15.5 12 22 3.5Z" />
      <path d="M22 12.5C25.8 17.5 28 21.5 28 26A6 6 0 0 1 16 26C16 21.5 18.2 17.5 22 12.5Z" />
      {/* mains from the point, the shoulders and the lobe */}
      <path d="M22 3.5 22 12.5M28.6 13.4 25.5 17.5M15.4 13.4 18.5 17.5M33 26.5 28 26M11 26.5 16 26M29.5 33.9 26.2 30.5M14.5 33.9 17.8 30.5M22 37.5 22 32" />
    </>
  ),
  Emerald: (
    <>
      <path d="M15 4 29 4 35 10 35 34 29 40 15 40 9 34 9 10Z" />
      <path d="M17 8.2 27 8.2 31.8 13 31.8 31 27 35.8 17 35.8 12.2 31 12.2 13Z" />
      <path d="M18.8 12.2 25.2 12.2 28.6 15.6 28.6 28.4 25.2 31.8 18.8 31.8 15.4 28.4 15.4 15.6Z" />
      {/* step connectors across the cut corners */}
      <path d="M29 4 25.2 12.2M35 10 28.6 15.6M35 34 28.6 28.4M29 40 25.2 31.8M15 40 18.8 31.8M9 34 15.4 28.4M9 10 15.4 15.6M15 4 18.8 12.2" />
    </>
  ),
  Radiant: (
    <>
      <path d="M14 5 30 5 36 11 36 33 30 39 14 39 8 33 8 11Z" />
      <path d="M17.5 12 26.5 12 30 15.5 30 28.5 26.5 32 17.5 32 14 28.5 14 15.5Z" />
      {/* brilliant-style corner kites and side mains */}
      <path d="M30 5 26.5 12M36 11 30 15.5M36 33 30 28.5M30 39 26.5 32M14 39 17.5 32M8 33 14 28.5M8 11 14 15.5M14 5 17.5 12" />
      <path d="M22 12 22 5M22 32 22 39M14 22 8 22M30 22 36 22" />
    </>
  ),
  "Elongated Radiant": (
    <>
      <path d="M15.5 3.5 28.5 3.5 33.5 8.5 33.5 35.5 28.5 40.5 15.5 40.5 10.5 35.5 10.5 8.5Z" />
      <path d="M18.2 10.5 25.8 10.5 28.6 13.3 28.6 30.7 25.8 33.5 18.2 33.5 15.4 30.7 15.4 13.3Z" />
      <path d="M28.5 3.5 25.8 10.5M33.5 8.5 28.6 13.3M33.5 35.5 28.6 30.7M28.5 40.5 25.8 33.5M15.5 40.5 18.2 33.5M10.5 35.5 15.4 30.7M10.5 8.5 15.4 13.3M15.5 3.5 18.2 10.5" />
      <path d="M22 10.5 22 3.5M22 33.5 22 40.5M15.4 22 10.5 22M28.6 22 33.5 22" />
    </>
  ),
  Cushion: (
    <>
      <rect x="6.5" y="6.5" width="31" height="31" rx="10.5" />
      <rect x="14.5" y="14.5" width="15" height="15" rx="5" />
      {/* pillow mains to the corners, spokes to the sides */}
      <path d="M16.2 16.2 10 10M27.8 16.2 34 10M27.8 27.8 34 34M16.2 27.8 10 34" />
      <path d="M22 14.5 22 6.5M22 29.5 22 37.5M14.5 22 6.5 22M29.5 22 37.5 22" />
    </>
  ),
  Princess: (
    <>
      <rect x="7" y="7" width="30" height="30" />
      <rect x="15" y="15" width="14" height="14" />
      {/* corner mains and the chevron spokes */}
      <path d="M7 7 15 15M37 7 29 15M37 37 29 29M7 37 15 29" />
      <path d="M22 15 22 7M22 29 22 37M15 22 7 22M29 22 37 22" />
    </>
  ),
  Marquise: (
    <>
      <path d="M22 3C28.5 9 32 15 32 22 32 29 28.5 35 22 41 15.5 35 12 29 12 22 12 15 15.5 9 22 3Z" />
      <path d="M22 11C25.5 15 27.5 18.5 27.5 22 27.5 25.5 25.5 29 22 33 18.5 29 16.5 25.5 16.5 22 16.5 18.5 18.5 15 22 11Z" />
      <path d="M22 3 22 11M22 33 22 41M32 22 27.5 22M12 22 16.5 22M29.5 13.5 26 17M14.5 13.5 18 17M29.5 30.5 26 27M14.5 30.5 18 27" />
    </>
  ),
  Asscher: (
    <>
      <path d="M15 6 29 6 38 15 38 29 29 38 15 38 6 29 6 15Z" />
      <path d="M17 10.2 27 10.2 33.8 17 33.8 27 27 33.8 17 33.8 10.2 27 10.2 17Z" />
      <path d="M18.8 14.2 25.2 14.2 29.8 18.8 29.8 25.2 25.2 29.8 18.8 29.8 14.2 25.2 14.2 18.8Z" />
      {/* the windmill */}
      <path d="M15 6 18.8 14.2M29 6 25.2 14.2M38 15 29.8 18.8M38 29 29.8 25.2M29 38 25.2 29.8M15 38 18.8 29.8M6 29 14.2 25.2M6 15 14.2 18.8" />
    </>
  ),
  Heart: (
    <>
      <path d="M22 40C14 33 6 26.5 6 17.5 6 11 10.5 6.5 16 6.5 19 6.5 21 8 22 10.2 23 8 25 6.5 28 6.5 33.5 6.5 38 11 38 17.5 38 26.5 30 33 22 40Z" />
      <path d="M22 33C16.8 28.4 12 24.3 12 18.4 12 14.6 14.6 12 17.8 12 19.7 12 21.2 13 22 14.6 22.8 13 24.3 12 26.2 12 29.4 12 32 14.6 32 18.4 32 24.3 27.2 28.4 22 33Z" />
      {/* the cleft, the point, and the lobe mains */}
      <path d="M22 10.2 22 14.6M22 40 22 33M6 17.5 12 18.4M38 17.5 32 18.4M13.4 28.6 16.6 25.5M30.6 28.6 27.4 25.5M16 6.5 17.8 12M28 6.5 26.2 12" />
    </>
  ),
};

/** One cut, drawn. `shape` must be a canonical SHAPES name; null (the old
 *  "All" tile) draws nothing — All is a word now, not a diagram. */
export function ShapeMark({ shape }: { shape: string | null }) {
  const art = shape ? S[shape] : null;
  if (!art) return null;
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      {art}
    </svg>
  );
}
