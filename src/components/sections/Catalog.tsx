import { useEffect, useMemo, useRef, useState } from "react";
import { fetchShopifyProducts, type ShopifyProduct } from "@/lib/shopify.functions";

const FALLBACK_PRODUCTS: ShopifyProduct[] = [
  { name: "The Sovereign Solitaire", category: "Rings", type: "Engagement", style: "Classic", shape: "Round", price: 8900, date: "2026-06-20", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/7c23248354327e336479345356485da4.jpg", desc: "2.0ct round brilliant, six-prong platinum" },
  { name: "The Crown Oval", category: "Rings", type: "Engagement", style: "Trendsetting", shape: "Oval", price: 11400, date: "2026-07-01", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/7c23248354327e336479345356485da4.jpg", desc: "2.5ct oval, hidden halo, 18k yellow gold" },
  { name: "The Regency", category: "Rings", type: "Engagement", style: "Vintage", shape: "Asscher", price: 9800, date: "2026-05-11", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/7c23248354327e336479345356485da4.jpg", desc: "Asscher cut, milgrain detail, art deco gallery" },
  { name: "The Eternal Line", category: "Rings", type: "Eternity", style: "Classic", shape: "Round", price: 4200, date: "2026-06-05", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/7c23248354327e336479345356485da4.jpg", desc: "Full eternity, shared prong, platinum" },
  { name: "The Riviera", category: "Necklaces", type: "Riviera & Tennis Necklaces", style: "Classic", shape: "Round", price: 15600, date: "2026-06-28", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Necklace-e1698231277111-768x768.jpg", desc: "Graduated riviera, 12.5ctw, 18k white gold" },
  { name: "The Heirloom Pendant", category: "Necklaces", type: "Pendants", style: "Vintage", shape: "Pear", price: 5400, date: "2026-04-18", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Necklace-e1698231277111-768x768.jpg", desc: "1.5ct pear drop, halo, rose gold" },
  { name: "The Kingdom Tennis", category: "Bracelets", type: "Tennis", style: "Classic", shape: "Round", price: 7800, date: "2026-07-03", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/shutterstock_1788848870-scaled-e1697638089202-768x548.jpg", desc: "5.0ctw four-prong line, 14k white gold" },
  { name: "The Duchess Studs", category: "Earrings", type: "Studs & Clusters", style: "Classic", shape: "Round", price: 3600, date: "2026-06-12", img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Earrings-e1698231240846-768x768.jpg", desc: "2.0ctw martini setting, screw backs" },
];

const SHAPES = ["all", "Round", "Oval", "Emerald", "Pear", "Cushion", "Radiant", "Princess", "Marquise", "Asscher", "Heart"];
const SORTS = [
  { v: "new", label: "Newest Arrivals" },
  { v: "lo", label: "Price ↓" },
  { v: "hi", label: "Price ↑" },
];

export type CatalogSelection = { category: string; type: string; style: string } | null;

const money = (n: number) => "$" + n.toLocaleString();

export function Catalog({
  selection,
  onClose,
}: {
  selection: CatalogSelection;
  onClose: () => void;
}) {
  const [live, setLive] = useState<ShopifyProduct[] | null>(null);
  const [shape, setShape] = useState("all");
  const [sort, setSort] = useState("new");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchShopifyProducts().then((r) => { if (r && r.length) setLive(r); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selection) {
      setShape("all");
      setSort("new");
      setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    }
  }, [selection]);

  const items = useMemo(() => {
    if (!selection) return [];
    const src = live ?? FALLBACK_PRODUCTS;
    let filtered = src.filter(
      (p) =>
        p.category === selection.category &&
        p.type === selection.type &&
        (selection.style === "Uniquely Yours" ? true : p.style === selection.style) &&
        (shape === "all" || p.shape === shape),
    );
    if (sort === "new") filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    if (sort === "lo") filtered = [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "hi") filtered = [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [selection, live, shape, sort]);

  if (!selection) return null;

  return (
    <section id="catalog" ref={sectionRef}>
      <div className="wrap">
        <div className="cat-head">
          <div>
            <span className="eyebrow">{selection.category} — {selection.type}</span>
            <h2 className="serif">{selection.style}</h2>
          </div>
          <button className="cat-close" aria-label="Close catalog" onClick={onClose}>× Close</button>
        </div>
        <div className="cat-filters">
          <div className="cf-group">
            <span className="cf-label">Stone Shape</span>
            {SHAPES.map((s) => (
              <button
                key={s}
                className={"cf" + (shape === s ? " sel" : "")}
                onClick={() => setShape(s)}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
          <div className="cf-group">
            <span className="cf-label">Sort</span>
            {SORTS.map((s) => (
              <button
                key={s.v}
                className={"cf" + (sort === s.v ? " sel" : "")}
                onClick={() => setSort(s.v)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {items.length ? (
          <div className="cat-grid">
            {items.map((p) => {
              const inner = (
                <>
                  <div className="p-img">
                    <div style={{ backgroundImage: `url('${p.img}')` }} />
                  </div>
                  <div className="p-body">
                    <h3>{p.name}</h3>
                    <div className="p-spec">{p.shape} · {p.style}</div>
                    <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", fontWeight: 200, marginBottom: ".8rem" }}>{p.desc}</p>
                    <div className="p-price">{money(p.price)}</div>
                  </div>
                </>
              );
              return p.url ? (
                <a key={p.name} className="p-card" href={p.url} target="_blank" rel="noopener">{inner}</a>
              ) : (
                <div key={p.name} className="p-card">{inner}</div>
              );
            })}
          </div>
        ) : (
          <div className="cat-empty">
            <p className="serif">Pieces for this collection are being added.</p>
            <p>Tell us what you're looking for and we'll craft it — that's the point of bespoke.</p>
            <a href="#begin" className="btn btn-gold" style={{ marginTop: "1.4rem", display: "inline-block" }}>Start Your Story</a>
          </div>
        )}
      </div>
    </section>
  );
}
