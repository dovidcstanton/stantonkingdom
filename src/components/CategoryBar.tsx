/** The collection navigation, directly beneath the site header.
 *
 *  Four categories — Rings, Necklaces, Bracelets, Earrings — and nothing
 *  else: "All Pieces" is the route you land on, not a fifth peer in this row.
 *  The active category is marked with a fine gold underline rather than a
 *  colour block.
 *
 *  On a phone the row scrolls sideways, and when a category page loads its
 *  own label is brought fully into view — a visitor arriving on Earrings must
 *  never find the word clipped off the right edge.
 *
 *  Desktop keeps the hover drop of each category's types: opening is CSS
 *  `:hover`, not React state, so the panel is already moving before any
 *  JavaScript has run. Touch devices have no hover, so the whole row is also
 *  a set of real links — tapping "Rings" navigates to all Rings rather than
 *  trapping the client in a menu that will not open. */

import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";

import { COLLECTION_TREE, collectionPath } from "@/lib/catalog";

export function CategoryBar({ category, type }: { category: string | null; type: string | null }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Bring the active label fully into view on arrival. Manual arithmetic
  // rather than scrollIntoView, which would also scroll the PAGE to the bar.
  useEffect(() => {
    const row = rowRef.current;
    const active = activeRef.current;
    if (!row || !active) return;
    const target = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target) });
  }, [category]);

  return (
    <nav className="catbar" aria-label="Collections">
      <div className="wrap catrow" ref={rowRef}>
        {COLLECTION_TREE.map((c) => {
          const active = category === c.name;
          return (
            <div
              key={c.name}
              className={"cat" + (active ? " sel" : "")}
              ref={active ? activeRef : undefined}
            >
              <Link to={collectionPath(c.name)}>{c.name}</Link>

              <div className="drop">
                <Link className="drop-all" to={collectionPath(c.name)}>
                  View all {c.name}
                </Link>
                {c.types.map((t) => (
                  <Link
                    key={t}
                    to={collectionPath(c.name, t)}
                    className={active && type === t ? "on" : undefined}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
