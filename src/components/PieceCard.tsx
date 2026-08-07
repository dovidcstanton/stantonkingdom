/** One piece, presented the catalogue's way: a portrait photograph with a
 *  floating glass capsule crossing its lower edge.
 *
 *  The capsule is a separate pane of glass, not a caption block — it spans
 *  most of the image's width, overlaps the photograph's bottom edge and
 *  continues below it onto the white page, carrying the name and the quiet
 *  price line. The photograph and the capsule are both doorways to the
 *  piece's page; the only other control is the word "Inquire", set small in
 *  the photograph's upper corner with a tap target far larger than the word.
 *
 *  Shared by the collection grid and the product page's related rail so the
 *  card can never fork into two dialects. */

import { Link } from "@tanstack/react-router";

import { money, type SkProduct } from "@/lib/catalog";

export function PieceCard({
  piece,
  wide,
  onInquire,
}: {
  piece: SkProduct;
  wide?: boolean;
  onInquire: (piece: SkProduct) => void;
}) {
  const cover = piece.images[0];

  return (
    <article className={"cat-card" + (wide ? " cc-wide" : "")}>
      <div className="cc-frame">
        <Link
          to="/piece/$handle"
          params={{ handle: piece.handle }}
          className="cc-photo"
          style={cover ? { backgroundImage: `url('${cover.url}')` } : undefined}
          aria-label={piece.name}
        />
        {piece.soldOut ? <span className="p-flag">Acquired</span> : null}
        <button
          className="cc-inq"
          onClick={() => onInquire(piece)}
          aria-label={`Inquire about ${piece.name}`}
        >
          Inquire
        </button>
        <Link to="/piece/$handle" params={{ handle: piece.handle }} className="cc-cap">
          <h3>{piece.name}</h3>
          {/* The bullet belongs to "Customizable": when the line wraps on a
              narrow card it breaks BEFORE the pair, never after a stray dot. */}
          <p>
            From {money(piece.price, piece.currency)}{" "}
            <span className="nb">
              <span aria-hidden="true">•</span> Customizable
            </span>
          </p>
        </Link>
      </div>
    </article>
  );
}
