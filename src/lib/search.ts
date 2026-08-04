/* ============================ SITE SEARCH ============================
   One index, one matcher, one notion of where a result goes.

   What this replaces: a hand-written list of labels each carrying a `#anchor`,
   matched by substring, whose every destination was `scrollIntoView` on a
   section. That could only ever answer "which part of the home page is this
   nearest to" — it could not send anyone to /collection/rings/engagement, it
   could not open the one question they were actually asking, and it could not
   survive a single typo. All three are the point of this file.

   ---- The three pieces ----

   1. A STRUCTURED RECORD. Every searchable thing in the house — a collection,
      a piece, a question, a page — is the same shape, with its matchable words
      separated from its displayed words and its destination held as real route
      data rather than as a string to be scrolled to. The fields a Shopify
      product needs (handle, sku, category, subtype, style, shape, metal, tags)
      are already on the type and already weighted by the matcher, so switching
      the catalogue on means pushing products into the same array — not
      rewriting any of this.

   2. A WEIGHTED, TYPO-TOLERANT MATCHER. Entirely local: no request goes out,
      per keystroke or otherwise, so results land in the same frame as the
      character that asked for them. Deliberately hand-written rather than a
      dependency — Fuse and MiniSearch both bring a general-purpose scorer that
      would then have to be argued out of its own opinions to produce the
      ranking below, and neither is small next to the ~200 lines that do exactly
      what this site needs. Nothing is added to the bundle.

   3. A DESTINATION. Not an anchor: a route, optional search params, and an
      optional FAQ id. A collection result navigates to the canonical URL built
      by collectionPath(), so it is bookmarkable, shareable and survives a
      refresh. A question result carries the id of the exact question, which the
      home page uses to open it.

   ---- The ranking, and why ----
   exact title  >  alias/synonym  >  category & subtype  >  keywords  >  content
   which is what makes "engagement" produce Engagement Rings — where the word IS
   the title — ahead of Rings, where it is only one keyword among four. Sending
   someone to the generic Rings page when they named a subtype is the single
   most common way a search like this quietly wastes the visitor's time. */

import { COLLECTION_TREE, STYLES, collectionPath, slug } from "./catalog";
import { FAQ } from "./faq";

/* ------------------------------------------------------------------ types */

export type SearchType = "collection" | "piece" | "question" | "page";

/** Where a result actually sends you. Route and search params rather than an
 *  anchor, because the destination has to be a real address — one that can be
 *  refreshed, shared, and arrived at from outside the site. `hash` and `faqId`
 *  are the two things a route alone cannot say: which part of the home page,
 *  and which question on it. */
export type SearchDestination = {
  route: string;
  search?: Record<string, string>;
  hash?: string;
  faqId?: string;
};

export type SearchRecord = {
  id: string;
  type: SearchType;
  /** What the visitor reads in the results list. */
  title: string;
  /** The group name shown beside it — Collections, Pieces, Questions, Pages. */
  tag: string;

  /* ---- matched, never displayed ---- */
  /** Other names for this exact thing, including the misspellings that are too
   *  far from the real word for edit distance to reach. Weighted just under the
   *  title, because an alias is a name, not a mention. */
  aliases?: string[];
  /** Words that point at this thing without naming it. */
  keywords?: string[];
  /** Long-form prose — an answer, a description. Lowest weight: a word
   *  appearing somewhere in a paragraph is the weakest evidence there is. */
  content?: string;

  /* ---- taxonomy, shared with the catalogue and with Shopify ---- */
  category?: string;
  subtype?: string;
  style?: string;
  shape?: string;
  metal?: string;
  tags?: string[];

  /* ---- identity, for the catalogue when it opens ---- */
  handle?: string;
  sku?: string;
  faqId?: string;

  dest: SearchDestination;
  /** A small hand tie-break, for the rare case where two records score level
   *  and one is plainly the more useful answer. Not a substitute for the
   *  weighting — it is measured in fractions of a point. */
  boost?: number;
};

export type SearchHit = { record: SearchRecord; score: number };

/* -------------------------------------------------------------- normalise */

/** One tokeniser for the index and for the query, so the two can never
 *  disagree about what a word is. Apostrophes are dropped rather than split on
 *  — "it's" is one word — and everything else non-alphanumeric is a boundary,
 *  which is what lets "lab-grown", "lab grown" and "labgrown"... well, the
 *  first two; the third is why aliases exist. */
export const normalise = (s: string) => s.toLowerCase().replace(/['’]/g, "");
export const tokenise = (s: string) =>
  normalise(s).split(/[^a-z0-9]+/).filter(Boolean);

/* ------------------------------------------------------- edit distance */

/** Damerau-Levenshtein, bounded.
 *
 *  Bounded matters twice over: it lets the whole thing bail the moment a row's
 *  best possible result is already worse than we would accept, and it means a
 *  long word can never rack up a large distance against a short one and then be
 *  rejected after doing all the work. Transposition is included because the
 *  commonest real typing error is a swap — "raing", "rnig" — and plain
 *  Levenshtein charges two edits for it, which is exactly enough to push it out
 *  of tolerance. */
function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length, m = b.length;
  if (!n) return m;
  if (!m) return n;
  let prev2: number[] = [];
  let prev: number[] = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    const cur: number[] = new Array(m + 1);
    cur[0] = i;
    let rowBest = cur[0];
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowBest) rowBest = v;
    }
    if (rowBest > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[m];
}

/** How wrong a word is allowed to be, by how long it is.
 *
 *  Short words get no latitude at all, and that is not timidity: at three
 *  letters one edit reaches most of the dictionary, so "rig" would match "ring"
 *  and "big" and "rug" equally and the results would look random. From four
 *  letters one edit is safe, and from seven — where a real typo is most likely
 *  and the word is distinctive enough to survive it — two. */
const tolerance = (len: number) => (len >= 7 ? 2 : len >= 4 ? 1 : 0);

/* ------------------------------------------------------------- the fields */

/* Weights, highest first. The gaps between them are what does the work: a
   title hit is worth nearly three times a keyword hit, so a record that merely
   mentions a word can never climb over one that is named by it, however many
   times it mentions it. */
const W_TITLE = 10;
const W_ALIAS = 7;
const W_TAXONOMY = 5;
const W_KEYWORD = 3.5;
const W_CONTENT = 1.2;

type Field = { weight: number; tokens: string[]; phrase: string };
type Prepared = { record: SearchRecord; fields: Field[]; titlePhrase: string; aliasPhrases: string[] };

const field = (weight: number, parts: (string | undefined)[]): Field | null => {
  const phrase = normalise(parts.filter(Boolean).join(" "));
  if (!phrase.trim()) return null;
  return { weight, tokens: tokenise(phrase), phrase };
};

/** Tokenising every record on every keystroke would be wasteful for no reason;
 *  the index does not change between builds. Prepared once, lazily, and reused. */
function prepare(records: SearchRecord[]): Prepared[] {
  return records.map((r) => {
    const fields = [
      field(W_TITLE, [r.title]),
      field(W_ALIAS, r.aliases ?? []),
      field(W_TAXONOMY, [r.category, r.subtype, r.style, r.shape, r.metal, r.handle, r.sku, ...(r.tags ?? [])]),
      field(W_KEYWORD, r.keywords ?? []),
      field(W_CONTENT, [r.content]),
    ].filter(Boolean) as Field[];
    return {
      record: r,
      fields,
      titlePhrase: normalise(r.title),
      aliasPhrases: (r.aliases ?? []).map(normalise),
    };
  });
}

/** How well one typed word matches one field, as a fraction of that field's
 *  weight. The tiers are ordered by how much they tell you: the same word is
 *  certainty; the start of a word is someone still typing; a word buried inside
 *  another is a coincidence as often as not; and a near-miss is a typo, which
 *  is worth having but must never outrank something spelled correctly. */
function fieldQuality(token: string, f: Field): number {
  let best = 0;
  for (const t of f.tokens) {
    if (t === token) return 1;
    if (t.startsWith(token)) best = Math.max(best, token.length >= 2 ? 0.92 : 0.5);
    /* The other way round — the typed word is longer than the indexed one, as
       in "necklaces" against "necklace". It has to be nearly the whole word,
       not merely the start of it: without the length floor, "whatsapp" matched
       "what" and pulled in every question containing it. Two characters of
       overhang is a plural or a tense; four is a different word. */
    else if (token.startsWith(t) && t.length >= 3 && t.length >= token.length - 2) {
      best = Math.max(best, 0.8);
    }
  }
  if (best) return best;
  // Substring of the joined phrase — catches a word inside a hyphenated or
  // run-together name that tokenising has already split apart.
  if (token.length >= 3 && f.phrase.includes(token)) best = 0.72;
  if (best) return best;
  const max = tolerance(token.length);
  if (!max) return 0;
  let d = max + 1;
  for (const t of f.tokens) {
    if (t.length < 3) continue;
    d = Math.min(d, editDistance(token, t, max));
    if (d === 1) break;
  }
  /* editDistance returns max+1 as its "further than you asked" sentinel, not a
     real distance — so the tolerance has to be re-checked here. Without this
     line a 5-letter word gets max=1, every genuine miss comes back as 2, and 2
     is a scoring tier: "xyzzy" matched the entire index. */
  if (d > max) return 0;
  return d === 1 ? 0.62 : d === 2 ? 0.42 : 0;
}

/* --------------------------------------------------------------- matching */

/** Every typed word has to land somewhere, so a second word narrows the results
 *  instead of widening them — "ring price" is one request, not two. A word that
 *  matches nothing at all, even allowing for a typo, rules the record out. */
export function scoreRecord(p: Prepared, tokens: string[], query: string): number {
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const f of p.fields) {
      const q = fieldQuality(token, f);
      if (q) best = Math.max(best, q * f.weight);
    }
    if (!best) return 0; // this record is not what was asked for
    total += best;
  }
  /* Phrase bonuses. Word-by-word scoring cannot tell "engagement rings" typed
     in full from the two words appearing separately in a paragraph, and the
     difference between those is most of what makes a result feel right. */
  if (p.titlePhrase === query) total += 20;
  else if (p.titlePhrase.startsWith(query)) total += 12;
  else if (query.length >= 3 && p.titlePhrase.includes(query)) total += 6;
  for (const a of p.aliasPhrases) {
    if (a === query) { total += 9; break; }
    if (query.length >= 4 && a.startsWith(query)) { total += 5; break; }
  }
  return total + (p.record.boost ?? 0);
}

let prepared: Prepared[] | null = null;

export function search(query: string, limit = 8): SearchHit[] {
  const q = normalise(query.trim());
  if (!q) return [];
  const tokens = tokenise(q);
  if (!tokens.length) return [];
  if (!prepared) prepared = prepare(SEARCH_INDEX);
  const hits: SearchHit[] = [];
  for (const p of prepared) {
    const score = scoreRecord(p, tokens, q);
    if (score > 0) hits.push({ record: p.record, score });
  }
  /* Ties break by index order, which is the order of the page itself —
     Collections before Questions before Pages — so a genuinely level pair comes
     back in the order the site presents them rather than in whatever order the
     array happened to be built. */
  const order = new Map(SEARCH_INDEX.map((r, i) => [r.id, i]));
  hits.sort((a, b) => b.score - a.score || (order.get(a.record.id)! - order.get(b.record.id)!));
  return hits.slice(0, limit);
}

/* ============================== THE INDEX ==============================
   Built from the same sources the rest of the site reads — COLLECTION_TREE for
   the taxonomy, FAQ for the questions — rather than retyped here, so a category
   renamed or a question reworded is renamed and reworded in search at the same
   moment. Only the pages, which have no data structure of their own, are
   written out. */

/** Words a visitor is likely to type for a category or a subtype that do not
 *  appear in its name — including the misspellings edit distance cannot reach.
 *  "neckless" is three edits from "necklaces" and would need a tolerance wide
 *  enough to make everything else match everything else; it is far cheaper and
 *  far safer to simply know that people write it. */
const CATEGORY_ALIASES: Record<string, string[]> = {
  Rings: ["ring", "rings", "band", "bands", "rng", "rig"],
  Necklaces: ["necklace", "necklaces", "neckless", "necklase", "neclace", "chain", "chains", "pendant", "pendants", "choker"],
  Bracelets: ["bracelet", "bracelets", "braclet", "bracelette", "bangle", "bangles", "cuff", "wrist"],
  Earrings: ["earring", "earrings", "earing", "earings", "ear ring", "studs", "hoops", "huggies"],
};

const TYPE_ALIASES: Record<string, string[]> = {
  Engagement: ["engagement", "engagment", "engagement ring", "engagment ring", "propose", "proposal", "proposing", "solitaire", "bridal", "she said yes"],
  Wedding: ["wedding", "weding", "wedding band", "wedding ring", "bridal", "matrimony", "marriage"],
  Eternity: ["eternity", "eternety", "full eternity", "half eternity", "anniversary"],
  "Haute Couture": ["haute couture", "couture", "high jewellery", "high jewelry", "one of a kind", "showpiece"],
  Solitaires: ["solitaire", "solitaires", "single stone", "pendant solitaire"],
  Pendants: ["pendant", "pendants", "charm", "drop necklace", "initial"],
  "Riviera & Tennis": ["riviera", "rivera", "tennis necklace", "tennis", "line necklace", "graduated"],
  "Statement & Link": ["statement", "link", "links", "chain", "curb", "cuban", "figaro", "bold"],
  Tennis: ["tennis", "tenis", "tennis bracelet", "line bracelet", "diamond bracelet"],
  Bangles: ["bangle", "bangles", "bangel", "cuff", "rigid bracelet"],
  "Studs & Clusters": ["stud", "studs", "cluster", "clusters", "everyday earrings"],
  "Hoops & Huggies": ["hoop", "hoops", "huggie", "huggies", "hugies", "creole"],
  "Drops & Chandeliers": ["drop", "drops", "chandelier", "chandeliers", "dangle", "danglers", "statement earrings"],
};

const STYLE_ALIASES: Record<string, string[]> = {
  Classic: ["classic", "timeless", "traditional", "simple", "understated"],
  Trendsetting: ["trendsetting", "trend", "trendy", "modern", "contemporary", "current"],
  Vintage: ["vintage", "vintge", "antique", "deco", "art deco", "retro", "heirloom style", "old world"],
  "Uniquely Yours": ["uniquely yours", "unique", "bespoke", "custom", "one off", "made for me", "commission"],
};

/** Every word that means "jewellery", spelled every way people spell it. Put on
 *  the category records so any of them can be reached by the general word. */
const JEWELRY_WORDS = [
  "jewelry", "jewellery", "jewelery", "jewlery", "piece", "pieces", "shop",
  "browse", "buy", "collection", "catalogue", "catalog",
  /* A collection page is where a thing's price is, so these belong here —
     otherwise "ring price" lands nowhere at all, because every typed word has
     to hit the SAME record and no single record held both. They are keywords,
     not aliases, so a bare "price" still answers with the question about
     budget, which is the better answer to the question actually asked. */
  "price", "prices", "pricing", "cost", "costs", "how much", "value",
];

const COLLECTION_RECORDS: SearchRecord[] = [
  /* The whole catalogue, and the right answer to the general word. "Jewellery"
     is an ALIAS here and only a keyword on the categories, which is what puts
     the everything-page above them — otherwise Haute Couture Rings won it, on
     the strength of carrying "high jewellery" as an alias of its own. Nothing
     more specific is affected: a category name is a title hit and outscores
     this outright. */
  {
    id: "col-all", type: "collection", title: "The David C. Stanton Collection", tag: "Collections",
    aliases: ["the collection", "all jewelry", "all jewellery", "everything", "shop all", "view all",
      "jewelry", "jewellery", "jewelery", "jewlery", "pieces"],
    keywords: JEWELRY_WORDS,
    dest: { route: collectionPath() },
  },
  ...COLLECTION_TREE.flatMap((c) => [
    {
      id: "col-" + slug(c.name),
      type: "collection" as const,
      title: c.name,
      tag: "Collections",
      category: c.name,
      aliases: CATEGORY_ALIASES[c.name] ?? [],
      /* The subtypes are keywords here, NOT aliases. That one distinction is
         what settles "engagement": the subtype record is TITLED Engagement
         Rings and scores on the title, while Rings scores on a keyword worth a
         third as much — so the deeper, more specific destination wins, which is
         the one the visitor asked for. */
      keywords: [...c.types, ...JEWELRY_WORDS],
      dest: { route: collectionPath(c.name) },
    },
    ...c.types.map((t) => ({
      id: "col-" + slug(c.name) + "-" + slug(t),
      type: "collection" as const,
      /* Named as the destination page names itself, so the strongest possible
         match — someone typing the words on the tin — is also the exact answer.
         Singular category so "Engagement Ring" reads and matches as naturally
         as "Engagement Rings". */
      title: `${t} ${c.name}`,
      tag: "Collections",
      category: c.name,
      subtype: t,
      aliases: [
        ...(TYPE_ALIASES[t] ?? []),
        `${t} ${c.name}`.toLowerCase(),
        `${t} ${c.name.replace(/e?s$/, "")}`.toLowerCase(),
      ],
      keywords: JEWELRY_WORDS,
      dest: { route: collectionPath(c.name, t) },
    })),
  ]),
  /* Style is a cross-cutting adjective rather than a place in the tree, so it
     stays a search param on the whole catalogue — exactly as the side menu
     treats it. "Uniquely Yours" is not here: it is an invitation to commission
     something, not a filter, and it is answered by the Bespoke page below. */
  ...STYLES.filter((s) => s !== "Uniquely Yours").map((s) => ({
    id: "style-" + slug(s),
    type: "collection" as const,
    title: `${s} Pieces`,
    tag: "Collections",
    style: s,
    aliases: STYLE_ALIASES[s] ?? [],
    keywords: JEWELRY_WORDS,
    dest: { route: collectionPath(), search: { style: s } },
    boost: -0.5,
  })),
];

/** The home page's own sections. These keep an anchor, because that is
 *  genuinely what they are — a place on a page rather than a page. */
const PAGE_RECORDS: SearchRecord[] = [
  {
    id: "page-belief", type: "page", title: "The Philosophy of the Founder", tag: "Pages",
    aliases: ["philosophy", "our belief", "belief", "about", "about us", "david stanton", "david c stanton", "founder"],
    keywords: ["story", "values", "why", "who we are"],
    dest: { route: "/", hash: "#belief" },
  },
  {
    id: "page-heritage", type: "page", title: "Our Illustrious Heritage", tag: "Pages",
    aliases: ["heritage", "history", "legacy", "our story", "the house"],
    keywords: ["generations", "craftsmanship", "tradition", "family", "atelier", "workshop"],
    dest: { route: "/", hash: "#heritage" },
  },
  {
    id: "page-journey", type: "page", title: "Bespoke Artistry — The Journey", tag: "Pages",
    aliases: ["bespoke", "the journey", "journey", "custom", "custom design", "commission", "made to order", "uniquely yours"],
    keywords: ["process", "how it works", "steps", "cad", "design", "consultation", "sketch"],
    dest: { route: "/", hash: "#journey" },
  },
  {
    id: "page-begin", type: "page", title: "Start Your Story — Book a Consultation", tag: "Pages",
    aliases: ["contact", "contact us", "book", "booking", "consultation", "appointment", "enquiry", "inquiry", "enquire", "inquire", "get in touch", "start your story"],
    keywords: ["form", "meeting", "visit", "showroom", "talk", "reach us", "email", "phone", "whatsapp", "call"],
    dest: { route: "/", hash: "#begin" },
  },
  {
    id: "page-faq", type: "page", title: "Before You Ask — Questions, Answered", tag: "Pages",
    aliases: ["faq", "faqs", "questions", "help", "support", "answers"],
    keywords: ["common questions", "frequently asked"],
    dest: { route: "/", hash: "#faq" },
    boost: -1,
  },
];

/** One record per question, carrying its permanent id. The answer goes in as
 *  content — the lowest weight there is — which is how "refund" finds the
 *  question about changes even though the question never uses the word, while
 *  never letting a passing mention outrank a question that is actually about
 *  the thing asked. */
const QUESTION_RECORDS: SearchRecord[] = FAQ.map((f) => ({
  id: "faq-" + f.id,
  type: "question" as const,
  title: f.q,
  tag: "Questions",
  aliases: f.aliases ?? [],
  content: f.a.join(" "),
  faqId: f.id,
  dest: { route: "/", hash: "#faq", faqId: f.id },
}));

/* Pieces are absent only because the catalogue is not open yet. When it is,
   products map onto this same shape — title from the product name, aliases from
   its tags, category/subtype/style/shape/metal from its metafields, handle and
   sku from Shopify, dest `{ route: "/piece/" + handle }` — and are concatenated
   here. Nothing else in this file changes. */
/* Order matters only for ties, and only then — but ties are common when a word
   is a deliberate alias of two different things. Pages sit above questions
   because a page is a destination and a question is content about one: someone
   typing "contact" wants Start Your Story, not the FAQ row that happens to end
   with "reach out". Collections lead, as the page itself does. */
export const SEARCH_INDEX: SearchRecord[] = [
  ...COLLECTION_RECORDS,
  ...PAGE_RECORDS,
  ...QUESTION_RECORDS,
];

/** For the catalogue going live: hand it the product records and the matcher
 *  picks them up on the next keystroke. Exists so the eventual Shopify wiring
 *  has a door to knock on rather than a reason to edit this file. */
export function registerRecords(extra: SearchRecord[]) {
  SEARCH_INDEX.push(...extra);
  prepared = null;
}
