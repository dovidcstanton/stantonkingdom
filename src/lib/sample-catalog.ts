/** PROTOTYPE SAMPLE DATA — the catalogue the site serves when the
 *  SK_SAMPLE_CATALOG environment flag is set and no Shopify credentials are
 *  present. It exists so the collection and piece experiences can be built and
 *  evaluated on the dev Worker before the real products are authored.
 *
 *  Every product here carries EXACTLY the structure proposed for the real
 *  Shopify products:
 *    - options "Metal" (14K Gold / 18K Gold / Platinum) and
 *      "Metal Colour" (White / Yellow / Rose Gold), with variants only for
 *      combinations the piece is offered in — platinum only ever with white;
 *    - gallery images tagged to a colourway by a leading alt-text token
 *      (#white-gold / #yellow-gold / #rose-gold), untagged images being the
 *      signature shots that open the rail;
 *    - custom.product_code and custom.details metafields (here inlined).
 *
 *  The photo library is four real shots from the store's CDN plus the site's
 *  own collection artwork, reused across pieces; colour groups tint them via
 *  the SkImage.tint field (CSS-only, prototype-only) so swiping between metal
 *  groups is visibly evaluable. Real products replace all of this with real
 *  per-metal photography and this file stops being served. */

import type { MetalColor, SkImage, SkProduct, SkVariant } from "./catalog";

/* The four product shots already in the store's CDN, plus local artwork. */
const IMG = {
  solitaire:
    "https://cdn.shopify.com/s/files/1/0822/8923/0073/files/7c23248354327e336479345356485da4.jpg?v=1785522670",
  studs:
    "https://cdn.shopify.com/s/files/1/0822/8923/0073/files/Earrings-e1698231240846-768x768.jpg?v=1785522701",
  tennis:
    "https://cdn.shopify.com/s/files/1/0822/8923/0073/files/shutterstock_1788848870-scaled-e1697638089202-768x548.jpg?v=1785522694",
  riviera:
    "https://cdn.shopify.com/s/files/1/0822/8923/0073/files/Necklace-e1698231277111-768x768.jpg?v=1785522678",
  rings: "/collection-rings.jpg",
  necklaces: "/collection-necklaces.jpg",
  bracelets: "/collection-bracelets.jpg",
  earrings: "/collection-earrings.jpg",
} as const;

const TINT: Record<MetalColor, SkImage["tint"]> = {
  "White Gold": "white",
  "Yellow Gold": "yellow",
  "Rose Gold": "rose",
};

/** A signature (untagged) shot followed by n tagged shots per offered colour,
 *  exactly as the real media library will be tagged in the Shopify admin. */
function gallery(name: string, url: string, colors: MetalColor[], perColor = 2): SkImage[] {
  const shot = (alt: string, tint?: SkImage["tint"]): SkImage => ({
    url,
    alt,
    width: 768,
    height: 768,
    ...(tint ? { tint } : {}),
  });
  return [
    shot(name),
    ...colors.flatMap((c) =>
      Array.from({ length: perColor }, (_, i) =>
        shot(`#${c.toLowerCase().replace(" ", "-")} ${name}${i ? ", detail" : ""}`, TINT[c]),
      ),
    ),
  ];
}

/** Variants for every (origin, purity, colour) combination offered. Platinum
 *  is only ever paired with White Gold, and lab-grown stones price beneath
 *  their natural counterparts — the rules the selectors enforce are true of
 *  the data first. An empty origins list means the piece has no origin choice
 *  and the axis simply never appears on it. */
function configVariants(
  code: string,
  price: number,
  origins: string[],
  purities: string[],
  colors: MetalColor[],
): SkVariant[] {
  const out: SkVariant[] = [];
  const originAxis = origins.length ? origins : [null];
  for (const origin of originAxis) {
    for (const purity of purities) {
      const offered = purity === "Platinum" ? (["White Gold"] as MetalColor[]) : colors;
      for (const color of offered) {
        const id = `sample:${code}:${origin ?? "na"}:${purity}:${color}`
          .replace(/\s+/g, "-")
          .toLowerCase();
        out.push({
          id,
          title: [origin, purity, color].filter(Boolean).join(" / "),
          available: true,
          price: Math.round(
            price * (purity === "Platinum" ? 1.18 : 1) * (origin === "Lab-Grown" ? 0.72 : 1),
          ),
          compareAt: null,
          options: [
            ...(origin ? [{ name: "Diamond Origin", value: origin }] : []),
            { name: "Metal", value: purity },
            { name: "Metal Colour", value: color },
          ],
        });
      }
    }
  }
  return out;
}

type Sample = {
  handle: string;
  name: string;
  code: string;
  category: string;
  type: string;
  style: string;
  /** May carry several comma-separated shapes — a piece can belong to more
   *  than one cut's filter. */
  shape: string;
  price: number;
  image: string;
  /** Empty list = the piece offers no origin choice and draws no control. */
  origins: string[];
  purities: string[];
  colors: MetalColor[];
  narrative: string;
  details: [string, string][];
  date: string;
};

const SAMPLES: Sample[] = [
  {
    handle: "the-sovereign-solitaire",
    name: "The Sovereign Solitaire",
    code: "SK-RING-SOV",
    category: "Rings",
    type: "Engagement",
    style: "Classic",
    shape: "Round",
    price: 8900,
    image: IMG.solitaire,
    origins: ["Natural", "Lab-Grown"],
    purities: ["14K Gold", "18K Gold", "Platinum"],
    colors: ["White Gold", "Yellow Gold", "Rose Gold"],
    narrative:
      "A six-prong solitaire built around a two-carat round brilliant, cut to return light rather than to hold weight. It began as a study of the crown settings in David's earliest London sketchbooks — the basket kept deliberately open so the stone reads as held rather than mounted. Quietly architectural, with nothing on the band to compete with the centre.",
    details: [
      ["Centre stone", "2.00ct round brilliant, D–F / VS+"],
      ["Setting", "Six-prong crown, open basket"],
      ["Band width", "1.8mm, knife-edge"],
      ["Dimensions", "Crown 8.1mm across"],
    ],
    date: "2026-07-28",
  },
  {
    handle: "the-duchess-studs",
    name: "The Duchess Studs",
    code: "SK-EARR-DUC",
    category: "Earrings",
    type: "Studs & Clusters",
    style: "Classic",
    shape: "Round",
    price: 3600,
    image: IMG.studs,
    origins: ["Natural", "Lab-Grown"],
    purities: ["14K Gold", "18K Gold"],
    colors: ["White Gold", "Yellow Gold"],
    narrative:
      "Two carats total weight in a martini setting, which sits each stone lower and closer to the lobe than a basket will. Drawn for a client who wanted her mother's stones worn daily rather than kept — the setting disappears and the light does the talking. Screw backs as standard.",
    details: [
      ["Stones", "2 × 1.00ct round brilliant, matched pair"],
      ["Setting", "Three-prong martini"],
      ["Backs", "Threaded screw backs"],
    ],
    date: "2026-07-26",
  },
  {
    handle: "the-riviera",
    name: "The Riviera",
    code: "SK-NECK-RIV",
    category: "Necklaces",
    type: "Riviera & Tennis",
    style: "Classic",
    shape: "Cushion",
    price: 15600,
    image: IMG.riviera,
    // No origin choice at all: the axis itself is absent from this piece and
    // the control must not draw.
    origins: [],
    purities: ["14K Gold", "18K Gold", "Platinum"],
    colors: ["White Gold", "Yellow Gold", "Rose Gold"],
    narrative:
      "A graduated riviera of twelve and a half carats, running from a tenth of a carat at the clasp to a ninety-point centre. Every stone is matched for colour and cut within a single grading window, so the line reads as one unbroken river of light — the effect the piece is named for.",
    details: [
      ["Total weight", "12.50ctw, graduated"],
      ["Stones", "0.10ct to 0.90ct centre, matched"],
      ["Length", "16in, with 1in extender"],
      ["Clasp", "Concealed box clasp, double safety"],
    ],
    date: "2026-07-24",
  },
  {
    handle: "the-kingdom-tennis",
    name: "The Kingdom Tennis",
    code: "SK-BRAC-TEN",
    category: "Bracelets",
    type: "Tennis",
    style: "Classic",
    shape: "Princess",
    price: 7800,
    image: IMG.tennis,
    origins: ["Natural", "Lab-Grown"],
    purities: ["14K Gold", "18K Gold", "Platinum"],
    colors: ["White Gold", "Yellow Gold", "Rose Gold"],
    narrative:
      "Five carats total weight in a four-prong line. The links are individually articulated so the bracelet lies flat around the wrist and moves like fabric rather than chain — a piece designed to be forgotten on the arm until the light finds it.",
    details: [
      ["Total weight", "5.00ctw"],
      ["Setting", "Four-prong line, articulated links"],
      ["Length", "7in standard, sized to order"],
      ["Clasp", "Box clasp, double safety"],
    ],
    date: "2026-07-22",
  },
  {
    handle: "the-marlowe-oval",
    name: "The Marlowe Oval",
    code: "SK-RING-MRL",
    category: "Rings",
    type: "Engagement",
    style: "Trendsetting",
    // Offered in two silhouettes of the same design, so it answers both
    // filters — multi-shape membership, one product, never duplicated.
    shape: "Oval, Elongated Radiant",
    price: 11200,
    image: IMG.rings,
    origins: ["Natural", "Lab-Grown"],
    purities: ["18K Gold", "Platinum"],
    colors: ["White Gold", "Rose Gold"],
    narrative:
      "An elongated oval on a hidden halo — from the finger it reads as a clean solitaire, and only its wearer knows about the ring of light beneath the crown. Drawn for those who like their luxury private. The band tapers toward the centre to lengthen the hand.",
    details: [
      ["Centre stone", "2.50ct elongated oval"],
      ["Setting", "Hidden halo, four claw prongs"],
      ["Band width", "1.6mm, tapered"],
    ],
    date: "2026-07-20",
  },
  {
    handle: "the-vesper-pendant",
    name: "The Vesper Pendant",
    code: "SK-NECK-VSP",
    category: "Necklaces",
    type: "Pendants",
    style: "Trendsetting",
    shape: "Pear",
    price: 4900,
    image: IMG.necklaces,
    origins: ["Natural", "Lab-Grown"],
    purities: ["14K Gold", "18K Gold"],
    colors: ["White Gold", "Yellow Gold", "Rose Gold"],
    narrative:
      "A single pear-cut stone hung point-down from an almost invisible bail, on a chain fine enough to disappear. Named for the first hour of evening — it is the piece that goes from a shirt collar to candlelight without changing anything but the room.",
    details: [
      ["Stone", "1.20ct pear brilliant"],
      ["Bail", "Concealed, articulated"],
      ["Chain", "0.9mm cable, 18in"],
    ],
    date: "2026-07-18",
  },
  {
    handle: "the-regent-bangle",
    name: "The Regent Bangle",
    code: "SK-BRAC-RGT",
    category: "Bracelets",
    type: "Bangles",
    style: "Vintage",
    shape: "Emerald",
    price: 9400,
    image: IMG.bracelets,
    // One fixed origin: a single-value axis is a fact, not a choice, so the
    // control hides but the variant still carries the option.
    origins: ["Natural"],
    purities: ["18K Gold"],
    colors: ["Yellow Gold", "Rose Gold"],
    narrative:
      "A solid oval bangle carrying seven emerald-cut stones flush in its crown, after the Art Deco manner of setting stones into architecture rather than onto it. The interior is court-shaped, so it turns with the wrist instead of against it.",
    details: [
      ["Stones", "7 × emerald cut, 2.10ctw, flush set"],
      ["Profile", "Court interior, 6mm crown"],
      ["Fit", "Oval, hinged with concealed clasp"],
    ],
    date: "2026-07-16",
  },
  {
    handle: "the-lyra-drops",
    name: "The Lyra Drops",
    code: "SK-EARR-LYR",
    category: "Earrings",
    type: "Drops & Chandeliers",
    style: "Vintage",
    shape: "Marquise, Pear",
    price: 6700,
    image: IMG.earrings,
    origins: ["Natural", "Lab-Grown"],
    purities: ["14K Gold", "18K Gold", "Platinum"],
    colors: ["White Gold", "Yellow Gold"],
    narrative:
      "Three marquise stones in a falling line, each on its own articulation so the earring moves a half-beat behind its wearer. Named for the constellation — small lights, precisely placed. The kind of piece that photographs quietly and behaves unforgettably in person.",
    details: [
      ["Stones", "6 × marquise, 3.20ctw total"],
      ["Drop", "34mm, three articulation points"],
      ["Backs", "Lever backs"],
    ],
    date: "2026-07-14",
  },
];

function toSampleProduct(s: Sample): SkProduct {
  const variants = configVariants(s.code, s.price, s.origins, s.purities, s.colors);
  return {
    id: `sample:${s.handle}`,
    handle: s.handle,
    name: s.name,
    description: s.narrative,
    descriptionHtml: `<p>${s.narrative}</p>`,
    spec: s.details[0] ? s.details[0][1] : "",
    category: s.category,
    type: s.type,
    style: s.style,
    shape: s.shape,
    // Basket-first, like the real launch pieces will be — the slice has to
    // demonstrate Add to Basket end to end.
    acquisition: "cart",
    code: s.code,
    details: s.details,
    price: Math.min(...variants.map((v) => v.price)),
    compareAt: null,
    currency: "USD",
    soldOut: false,
    date: s.date,
    images: gallery(s.name, s.image, s.colors),
    variants,
  };
}

export const SAMPLE_CATALOG: SkProduct[] = SAMPLES.map(toSampleProduct);

export const sampleByHandle = (handle: string) =>
  SAMPLE_CATALOG.find((p) => p.handle === handle) ?? null;
