/** The cart, as a drawer off the right edge.
 *
 *  Deliberately quiet: no badges, no "2 items in your bag!" urgency. At these
 *  prices the cart is a holding place for a decision already made, so it shows
 *  the pieces, the total, and one way forward — Shopify's hosted checkout,
 *  which is where card details are handled and where they should stay. */

import { Link } from "@tanstack/react-router";

import { useCart } from "@/lib/cart";
import { money } from "@/lib/catalog";

/** The way back to the cart, once there is one.
 *
 *  Absent until something is in it — a persistent empty bag icon on a bespoke
 *  jeweller's site is retail furniture, and this house doesn't want it. Sits
 *  bottom-left so it never fights the concierge in the opposite corner. */
export function CartLauncher() {
  const { count, openCart, open } = useCart();
  if (count === 0 || open) return null;

  return (
    <button className="cart-launch" onClick={openCart}>
      <span className="cart-launch-label">Your Selection</span>
      <span className="cart-launch-count">{count}</span>
    </button>
  );
}

export function CartDrawer() {
  const { cart, open, closeCart, busy, error, setQuantity } = useCart();
  const lines = cart?.lines ?? [];

  return (
    <>
      <div
        className={"cart-scrim" + (open ? " show" : "")}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className={"cart-drawer" + (open ? " open" : "")}
        role="dialog"
        aria-modal="true"
        aria-label="Your selection"
        aria-hidden={!open}
      >
        <header className="cart-head">
          <div>
            <span className="eyebrow">Stanton Kingdom</span>
            <h2 className="serif">Your Selection</h2>
          </div>
          <button className="cart-x" onClick={closeCart} aria-label="Close your selection">
            ×
          </button>
        </header>

        {error ? <p className="cart-error">{error}</p> : null}

        {lines.length === 0 ? (
          <div className="cart-empty">
            <p className="serif">Nothing chosen yet.</p>
            <p>Every piece in the house is made to be worn for a lifetime. Take your time.</p>
          </div>
        ) : (
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.id} className="cart-line">
                <Link to="/piece/$handle" params={{ handle: l.handle }} onClick={closeCart}>
                  <div
                    className="cl-img"
                    style={l.image ? { backgroundImage: `url('${l.image}')` } : undefined}
                  />
                </Link>
                <div className="cl-body">
                  <Link
                    to="/piece/$handle"
                    params={{ handle: l.handle }}
                    className="cl-title serif"
                    onClick={closeCart}
                  >
                    {l.productTitle}
                  </Link>
                  {/* Shopify names the lone variant of a single-variant product
                      "Default Title", which is an implementation detail and not
                      something a client should ever read. */}
                  {l.variantTitle && l.variantTitle !== "Default Title" ? (
                    <div className="cl-variant">{l.variantTitle}</div>
                  ) : null}
                  <div className="cl-foot">
                    <div className="cl-qty">
                      <button
                        onClick={() => setQuantity(l.id, l.quantity - 1)}
                        disabled={busy}
                        aria-label={`Reduce quantity of ${l.productTitle}`}
                      >
                        −
                      </button>
                      <span aria-live="polite">{l.quantity}</span>
                      <button
                        onClick={() => setQuantity(l.id, l.quantity + 1)}
                        disabled={busy}
                        aria-label={`Increase quantity of ${l.productTitle}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="cl-price">{money(l.price * l.quantity, l.currency)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && cart ? (
          <footer className="cart-foot">
            <div className="cart-sub">
              <span>Subtotal</span>
              <span className="cart-sub-val">{money(cart.subtotal, cart.currency)}</span>
            </div>
            <p className="cart-note">
              Shipping, insurance and any duties are calculated at checkout.
            </p>
            <a className="btn btn-gold cart-go" href={cart.checkoutUrl}>
              Proceed to Secure Checkout
            </a>
            <p className="cart-trust">
              Payment is handled by Shopify. We never see your card details.
            </p>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
