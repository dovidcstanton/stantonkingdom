/** Cart state for the whole site.
 *
 *  Shopify owns the cart; this holds only the cart's id and a cached copy of
 *  what Shopify last told us it contained. The id lives in localStorage so a
 *  client can close the tab mid-decision — which, on a piece costing as much as
 *  a car, they will — and come back to it. Everything else is derived. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { addToCart, fetchCart, setCartLineQuantity } from "./shopify.functions";
import type { SkCart } from "./catalog";

const STORAGE_KEY = "sk_cart_id";

type CartContextValue = {
  cart: SkCart | null;
  /** A mutation is in flight. Drives button spinners and disables quantity
   *  controls so a fast double-click cannot desync the drawer from Shopify. */
  busy: boolean;
  open: boolean;
  /** Set when Shopify could not be reached, so the drawer can say so rather
   *  than silently doing nothing. */
  error: string | null;
  count: number;
  openCart: () => void;
  closeCart: () => void;
  add: (variantId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const readStoredId = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Safari in private mode throws on localStorage access. A cart that does
    // not survive a reload is worth more than a page that will not render.
    return null;
  }
};

const writeStoredId = (id: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* see readStoredId */
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<SkCart | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate on mount. A stored id that Shopify no longer recognises — carts
  // expire — is dropped quietly; the next add simply creates a fresh cart.
  useEffect(() => {
    const stored = readStoredId();
    if (!stored) return;
    let cancelled = false;
    fetchCart({ data: stored })
      .then((c) => {
        if (cancelled) return;
        if (c) setCart(c);
        else writeStoredId(null);
      })
      .catch(() => writeStoredId(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const add = useCallback(async (variantId: string, quantity = 1) => {
    setBusy(true);
    setError(null);
    try {
      const next = await addToCart({
        data: { cartId: readStoredId(), variantId, quantity },
      });
      if (!next) {
        setError("We couldn't reach the atelier's stock room. Please try again.");
        return false;
      }
      setCart(next);
      writeStoredId(next.id);
      setOpen(true);
      return true;
    } catch {
      setError("We couldn't reach the atelier's stock room. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      const id = cart?.id ?? readStoredId();
      if (!id) return;
      setBusy(true);
      setError(null);
      try {
        const next = await setCartLineQuantity({ data: { cartId: id, lineId, quantity } });
        if (next) {
          setCart(next);
          writeStoredId(next.id);
        } else {
          setError("That change didn't save. Please try again.");
        }
      } catch {
        setError("That change didn't save. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [cart?.id],
  );

  // Close on Escape, matching the rest of the site's overlays.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hold the page still behind the drawer. Compensating for the scrollbar's
  // width prevents the layout jumping sideways as it disappears.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      busy,
      open,
      error,
      count: cart?.totalQuantity ?? 0,
      openCart,
      closeCart,
      add,
      setQuantity,
    }),
    [cart, busy, open, error, openCart, closeCart, add, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
