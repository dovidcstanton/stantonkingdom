/** The ten stone shapes, drawn.
 *
 *  Hand-authored outlines rather than a stock icon set: a bought pack carries a
 *  licence, and its line weight would never match the hairline rules the rest of
 *  the site is built from. Each shape is the silhouette plus the one internal
 *  line that distinguishes it — a table for the brilliant cuts, the stepped
 *  facet for the emerald family — because at 30px anything more becomes mud.
 *
 *  All ten share a 44×44 box with the stone centred, so a row of them reads as
 *  one set rather than as ten separate drawings at ten different scales.
 *  Stroke colour and width come from CSS (`.sh svg *`), never from here. */

const PATHS: Record<string, React.ReactNode> = {
  Round: (
    <>
      <circle cx="22" cy="22" r="17" />
      <circle cx="22" cy="22" r="9.5" />
    </>
  ),
  Oval: (
    <>
      <ellipse cx="22" cy="22" rx="12.5" ry="18" />
      <ellipse cx="22" cy="22" rx="7" ry="10.5" />
    </>
  ),
  Emerald: (
    <>
      <path d="M15 4 L29 4 L35 10 L35 34 L29 40 L15 40 L9 34 L9 10 Z" />
      <path d="M17.5 9 L26.5 9 L30.5 13 L30.5 31 L26.5 35 L17.5 35 L13.5 31 L13.5 13 Z" />
    </>
  ),
  Pear: (
    <>
      <path d="M22 3 C28 12 34 19 34 27 A12 12 0 0 1 10 27 C10 19 16 12 22 3 Z" />
      <path d="M22 12 C25.5 17.5 28.5 21.5 28.5 26 A6.5 6.5 0 0 1 15.5 26 C15.5 21.5 18.5 17.5 22 12 Z" />
    </>
  ),
  Cushion: (
    <>
      <rect x="6" y="6" width="32" height="32" rx="10.5" />
      <rect x="13" y="13" width="18" height="18" rx="6" />
    </>
  ),
  Radiant: (
    <>
      <path d="M12.5 5 L31.5 5 L37 10.5 L37 33.5 L31.5 39 L12.5 39 L7 33.5 L7 10.5 Z" />
      <path d="M16 11 L28 11 L31.5 14.5 L31.5 29.5 L28 33 L16 33 L12.5 29.5 L12.5 14.5 Z" />
    </>
  ),
  Princess: (
    <>
      <rect x="6.5" y="6.5" width="31" height="31" />
      <rect x="13.5" y="13.5" width="17" height="17" />
      <path d="M6.5 6.5 L13.5 13.5 M37.5 6.5 L30.5 13.5 M6.5 37.5 L13.5 30.5 M37.5 37.5 L30.5 30.5" />
    </>
  ),
  Marquise: (
    <>
      <path d="M22 3 C29 11 33 17 33 22 C33 27 29 33 22 41 C15 33 11 27 11 22 C11 17 15 11 22 3 Z" />
      <path d="M22 11 C26 16 28 19.5 28 22 C28 24.5 26 28 22 33 C18 28 16 24.5 16 22 C16 19.5 18 16 22 11 Z" />
    </>
  ),
  Asscher: (
    <>
      <path d="M13 6 L31 6 L38 13 L38 31 L31 38 L13 38 L6 31 L6 13 Z" />
      <path d="M17 11 L27 11 L33 17 L33 27 L27 33 L17 33 L11 27 L11 17 Z" />
    </>
  ),
  Heart: (
    <>
      <path d="M22 39 C22 39 6 28 6 17 C6 10.5 10.5 6 15.5 6 C18.5 6 20.8 7.8 22 10 C23.2 7.8 25.5 6 28.5 6 C33.5 6 38 10.5 38 17 C38 28 22 39 22 39 Z" />
      <path d="M22 31 C22 31 12 24.5 12 17.5 C12 13.5 14.5 11 17 11 C19 11 21 12.8 22 14.5 C23 12.8 25 11 27 11 C29.5 11 32 13.5 32 17.5 C32 24.5 22 31 22 31 Z" />
    </>
  ),
};

/** The "any shape" mark: a round outline in a dashed line, so it reads as an
 *  unspecified stone rather than as a competing eleventh shape. */
const ANY_MARK = <circle cx="22" cy="22" r="17" strokeDasharray="2.5 2.5" />;

export function ShapeMark({ shape }: { shape: string | null }) {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      {shape === null ? ANY_MARK : (PATHS[shape] ?? ANY_MARK)}
    </svg>
  );
}
