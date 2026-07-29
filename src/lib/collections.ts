/* -------- Collections data (shared by the Collections carousel and the header menu) -------- */
export const COLLECTIONS = [
  {
    name: "Rings",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/7c23248354327e336479345356485da4.jpg",
    types: ["Engagement", "Wedding", "Eternity", "Haute Couture"],
  },
  {
    name: "Necklaces",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Necklace-e1698231277111-768x768.jpg",
    types: ["Pendants", "Riviera & Tennis Necklaces", "Milestone Pieces"],
  },
  {
    name: "Bracelets",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/shutterstock_1788848870-scaled-e1697638089202-768x548.jpg",
    types: ["Tennis", "Bangles", "Statement & Link"],
  },
  {
    name: "Earrings",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Earrings-e1698231240846-768x768.jpg",
    types: ["Studs & Clusters", "Hoops & Huggies", "Drops & Chandeliers"],
  },
];

export const STYLES = ["Classic", "Trendsetting", "Vintage", "Uniquely Yours"];

/* The header lives outside the home route's component tree, so it opens the
   catalog by dispatching this event; the home page listens and sets the
   catalog selection. `type`/`style` accept "All" as a wildcard. */
export const CATALOG_EVENT = "stanton:catalog";

export type CatalogEventDetail = { category: string; type: string; style: string };

export const openCatalogFromMenu = (detail: CatalogEventDetail) => {
  window.dispatchEvent(new CustomEvent<CatalogEventDetail>(CATALOG_EVENT, { detail }));
};
