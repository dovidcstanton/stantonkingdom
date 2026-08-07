// One WhatsApp link for the whole site, so the pre-filled opener travels
// wherever the button does rather than being retyped — and drifting — at
// each call site.
export const WHATSAPP_MESSAGE = "Hi, I'd love to gain more insight regarding...";
const WHATSAPP_NUMBER = "16464508840";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/* The visitor's own words, and nothing else. Used by the Concierge when it
   cannot answer from the FAQ: the advisor opens the chat already knowing what
   was asked, instead of the visitor typing it twice.
 *
 *  The message is now the question verbatim — no "Hi, I'd love to gain more
 *  insight regarding:" ahead of it, nothing appended. Someone who has already
 *  typed their question has already introduced themselves; wrapping their
 *  sentence in a second one made the advisor read past a stock phrase to reach
 *  the actual query, and made the visitor's own words look like a quotation
 *  inside someone else's message.
 *
 *  This is the ONLY link that changed. WHATSAPP_MESSAGE and WHATSAPP_URL above
 *  are untouched, so the footer, the contact pills, the Start Your Story panel
 *  and the Coming Soon page all keep their existing opener. Same number, same
 *  wa.me link, still one integration.
 *
 *  encodeURIComponent handles the whole string, so apostrophes, question marks,
 *  ampersands and line breaks all survive the URL intact. */
export function whatsappUrlWithQuestion(question: string) {
  const asked = question.trim();
  if (!asked) return WHATSAPP_URL;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(asked)}`;
}

/** The enquiry a piece's Inquire control opens with — the advisor should know
 *  the piece, its house code, and the metal the client was looking at before
 *  the first reply. One builder so the collection card and the piece page can
 *  never phrase it differently. */
export function whatsappForPiece(d: { name: string; code: string; metal?: string; url: string }) {
  const lines = [
    `Hi, I'd love more details on ${d.name}.`,
    d.code ? `Code: ${d.code}` : "",
    d.metal ? `Metal: ${d.metal}` : "",
    d.url,
  ].filter(Boolean);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export const SOCIAL_X = "https://x.com/stantonkingdom";
export const SOCIAL_INSTAGRAM = "https://www.instagram.com/stantonkingdom?igsh=Mmd3YjduOTJsaTZj";
export const SOCIAL_TIKTOK = "https://www.tiktok.com/@stantonkingdom?_r=1&_t=ZT-98TCNSs7Fcs";
export const SOCIAL_LINKEDIN = "https://www.linkedin.com/company/stanton-kingdom/";
export const SOCIAL_FACEBOOK = "https://www.facebook.com/share/14e85rH2ebU/";
