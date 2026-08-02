/** The collection navigation, directly beneath the site header.
 *
 *  This replaces the editorial band a collection page would otherwise open
 *  with: the client came to look at jewellery, so the categories and their
 *  breakdowns are the first thing under the header and the grid starts
 *  immediately after.
 *
 *  Opening is CSS `:hover`, not React state, so the panel is already moving
 *  before any JavaScript has run. Touch devices have no hover, so the whole
 *  row is also a set of real links — tapping "Rings" navigates to all Rings
 *  rather than trapping the client in a menu that will not open. */

import { Link } from "@tanstack/react-router";

import { COLLECTION_TREE, collectionPath } from "@/lib/catalog";

export function CategoryBar({
  category,
  type,
}: {
  category: string | null;
  type: string | null;
}) {
  return (
    <nav className="catbar" aria-label="Collections">
      <div className="wrap catrow">
        <div className={"cat" + (category === null ? " sel" : "")}>
          <Link to="/collection">All Pieces</Link>
        </div>

        {COLLECTION_TREE.map((c) => (
          <div key={c.name} className={"cat" + (category === c.name ? " sel" : "")}>
            <Link to={collectionPath(c.name)}>{c.name}</Link>

            <div className="drop">
              <Link className="drop-all" to={collectionPath(c.name)}>
                View all {c.name}
              </Link>
              {c.types.map((t) => (
                <Link
                  key={t}
                  to={collectionPath(c.name, t)}
                  className={category === c.name && type === t ? "on" : undefined}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
