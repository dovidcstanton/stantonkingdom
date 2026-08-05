/** What an enquiry is, and what makes one acceptable.
 *
 *  Pure data and pure functions — no React, no server APIs, no network — so
 *  the same rules run in the browser and in the Worker. That is the point:
 *  the client uses them to decide what to show, the server uses them to decide
 *  what to trust, and there is exactly one definition of "a valid phone
 *  number" rather than two that drift.
 *
 *  Nothing here is a substitute for the server check. The browser copy exists
 *  to be helpful; the Worker copy exists because anything arriving at an
 *  endpoint may have been hand-crafted by someone who never loaded the page. */

/** Which surface the enquiry came from. Both land in the same inbox, but the
 *  internal email is composed differently for a piece enquiry, which carries a
 *  product with it. */
export type InquirySource = "consult" | "piece";

export type InquiryFields = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  diamond_preference: string;
  ideal_budget: string;
  referral: string;
  referred_by: string;
  referral_other: string;
  message: string;
  /** Set only by the piece dialog. */
  piece_name: string;
  piece_handle: string;
  piece_price: string;
  /** The page the enquiry was sent from, for context. */
  page_url: string;
  source: InquirySource;
};

/** Every field the form may send, with the ceiling each is allowed.
 *
 *  Caps are not cosmetic. An unbounded field is an invitation to paste a
 *  megabyte of text through the endpoint and into an inbox, and a long single
 *  "word" also breaks the layout of the internal email. These are generous for
 *  a human and hostile to a script. */
const LIMITS: Record<keyof InquiryFields, number> = {
  first_name: 80,
  last_name: 80,
  email: 160,
  phone: 40,
  category: 60,
  diamond_preference: 60,
  ideal_budget: 60,
  referral: 60,
  referred_by: 120,
  referral_other: 120,
  message: 4000,
  piece_name: 160,
  piece_handle: 160,
  piece_price: 40,
  page_url: 300,
  source: 16,
};

export const INQUIRY_FIELDS = Object.keys(LIMITS) as (keyof InquiryFields)[];

/** The four the house cannot act on an enquiry without. Mirrors the `required`
 *  attributes on the form, deliberately — if one is added there it belongs
 *  here too, or the browser will refuse a submission the server would accept. */
export const REQUIRED_FIELDS: (keyof InquiryFields)[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
];

/** Strip the characters that have no business in a form field.
 *
 *  Control characters do nothing for a reader and are the standard way to
 *  smuggle a line break into an email header — the classic header-injection
 *  route from a web form into someone else's inbox. They come out of every
 *  field without exception.
 *
 *  Written as a codepoint walk rather than a regular expression on purpose.
 *  The regex form of this needs a character class full of control-character
 *  escapes, which is easy to get subtly wrong and impossible to read; this
 *  version says what it means, and keeps the source itself plain ASCII.
 *
 *  A tab or newline survives only where a newline is meaningful — the message
 *  body, where a person may reasonably have pressed Enter. Everywhere else it
 *  becomes a space, because a "single-line" field containing a line break is
 *  either a paste artefact or an attack. */
const CH_TAB = 9;
const CH_NEWLINE = 10;
const CH_SPACE = 32;
const CH_DELETE = 127;

function stripControl(value: string, keepBreaks: boolean): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) as number;
    if (code === CH_NEWLINE || code === CH_TAB) {
      out += keepBreaks ? ch : " ";
      continue;
    }
    if (code < CH_SPACE || code === CH_DELETE) continue;
    out += ch;
  }
  return out;
}

function clean(value: unknown, limit: number, allowNewlines = false): string {
  if (typeof value !== "string") return "";
  let out = stripControl(value.replace(/\r/g, ""), allowNewlines);
  if (allowNewlines) {
    // Keep the paragraphing a person typed — a message is the one field where
    // shape carries meaning — but cap a runaway column of blank lines.
    out = out.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n");
  } else {
    out = out.replace(/\s+/g, " ");
  }
  return out.trim().slice(0, limit);
}

/** Deliberately permissive. The purpose is to catch a typo and an obviously
 *  fabricated address, not to adjudicate RFC 5322 — every strict regex ever
 *  written rejects some real address, and rejecting a real client's enquiry is
 *  far more expensive than accepting one that bounces. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** A phone number is usable if it has enough digits to dial. Formatting,
 *  spaces, brackets and a leading + are all left exactly as the client typed
 *  them, because that is how they will recognise their own number. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isUsablePhone(phone: string): boolean {
  const d = phoneDigits(phone);
  return d.length >= 7 && d.length <= 15;
}

/** wa.me wants digits and nothing else, in full international form — and the
 *  destination is always the CLIENT'S submitted number, never the house's own
 *  WhatsApp line; the house is the account replying, not the one written to.
 *
 *  We cannot know the country of a number typed without one, so the rule is
 *  confidence, not guesswork:
 *    - a leading + is the client saying which country: taken as written
 *    - eleven digits or more already carries a country code: taken as written
 *    - exactly ten digits whose first digit could open a NANP area code
 *      (2–9; none begin with 0 or 1) is a US/Canada number typed the way
 *      Americans type them — "(646) 391-9993" — and gains the 1:
 *      wa.me/16463919993
 *  Anything below that confidence gets no link rather than a wrong one — an
 *  advisor opening a conversation with a stranger in the wrong country is
 *  worse than dialling by hand. The tel: link on the number itself is the
 *  fallback and is always present. */
export function whatsappLink(phone: string): string | null {
  const d = phoneDigits(phone);
  if (!isUsablePhone(phone)) return null;
  if (phone.trim().startsWith("+") || d.length >= 11) return `https://wa.me/${d}`;
  if (d.length === 10 && d[0] !== "0" && d[0] !== "1") return `https://wa.me/1${d}`;
  return null;
}

export type ValidationResult =
  | { ok: true; data: InquiryFields }
  | { ok: false; errors: Partial<Record<keyof InquiryFields, string>>; message: string };

/** The single gate. Everything that reaches an email has been through here. */
export function validateInquiry(raw: Record<string, unknown>): ValidationResult {
  const data = {} as InquiryFields;
  for (const key of INQUIRY_FIELDS) {
    data[key] = clean(raw[key], LIMITS[key], key === "message") as never;
  }
  data.source = (data.source === "piece" ? "piece" : "consult") as never;

  const errors: Partial<Record<keyof InquiryFields, string>> = {};
  for (const key of REQUIRED_FIELDS) {
    if (!data[key]) errors[key] = "Required";
  }
  if (data.email && !EMAIL_RE.test(data.email)) {
    errors.email = "That does not look like an email address";
  }
  if (data.phone && !isUsablePhone(data.phone)) {
    errors.phone = "That does not look like a phone number";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors, message: "Please check the highlighted fields." };
  }
  return { ok: true, data };
}

/* ------------------------------------------------------------------- spam */

/** Two checks, both free, both invisible, neither requiring an account.
 *
 *  The honeypot is a field the form renders and hides. A person never sees it
 *  and so never fills it; a bot parses the HTML, finds an input named
 *  something plausible, and fills everything it finds. Anything arriving with
 *  it populated was not typed by a human — though "not typed" once included
 *  the visitor's own autofill, which is why the input is readOnly in the
 *  markup: a browser never autofills a read-only field, while the bots this
 *  catches fabricate the POST from parsed HTML and never honour the
 *  attribute.
 *
 *  The clock is the second: the form stamps the moment it was rendered, and a
 *  genuine enquiry — eleven fields, four of them required, one a free-text
 *  message — cannot be completed in three seconds. A script posts instantly.
 *
 *  Neither is a wall. They stop the automated volume that finds a public form
 *  endpoint and hammers it, which is the whole of the problem at this scale.
 *  A determined human targeting this specific site gets through, and the
 *  answer to that is Turnstile — which needs an account, so it is listed as an
 *  external step rather than assumed here. This function is the shape
 *  Turnstile would slot into. */
export const HONEYPOT_FIELD = "company_website";
export const TIMESTAMP_FIELD = "form_rendered_at";
const MIN_FILL_MS = 3000;

export type SpamVerdict = { ok: true } | { ok: false; reason: string };

export function checkNotSpam(raw: Record<string, unknown>, now = Date.now()): SpamVerdict {
  const honey = raw[HONEYPOT_FIELD];
  if (typeof honey === "string" && honey.trim() !== "") {
    return { ok: false, reason: "honeypot" };
  }
  /* The stamp is written by the CLIENT'S clock and compared against the
     server's, so the delta absorbs any skew between the two. A negative delta
     means the visitor's clock runs ahead of the server — a misconfigured PC,
     not a bot — and must never count as "too fast": now that a spam verdict
     is a visible error rather than a silent drop, flagging skew would lock a
     real person out of the form entirely. Only a genuinely small positive
     window is suspicious. */
  const stamp = Number(raw[TIMESTAMP_FIELD]);
  const delta = now - stamp;
  if (Number.isFinite(stamp) && stamp > 0 && delta >= 0 && delta < MIN_FILL_MS) {
    return { ok: false, reason: "too-fast" };
  }
  return { ok: true };
}

/* -------------------------------------------------------------- rendering */

/** How each field is labelled and grouped in the internal email. The order is
 *  the order an advisor reads in: who they are, what they want, what they
 *  said, and only then the housekeeping. */
export const INQUIRY_GROUPS: { title: string; fields: (keyof InquiryFields)[] }[] = [
  { title: "Client", fields: ["first_name", "last_name", "email", "phone"] },
  {
    title: "Enquiry",
    fields: [
      "category",
      "diamond_preference",
      "ideal_budget",
      "referral",
      "referred_by",
      "referral_other",
    ],
  },
  { title: "Piece", fields: ["piece_name", "piece_handle", "piece_price"] },
  { title: "Message", fields: ["message"] },
];

export const FIELD_LABELS: Record<keyof InquiryFields, string> = {
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  phone: "Phone",
  category: "Category",
  diamond_preference: "Stone preference",
  ideal_budget: "Ideal budget",
  referral: "Heard about us via",
  referred_by: "Referred by",
  referral_other: "Referral detail",
  message: "Message",
  piece_name: "Piece",
  piece_handle: "Reference",
  piece_price: "Guide price",
  page_url: "Sent from",
  source: "Form",
};
