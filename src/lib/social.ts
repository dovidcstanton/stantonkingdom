// One WhatsApp link for the whole site, so the pre-filled opener travels
// wherever the button does rather than being retyped — and drifting — at
// each call site.
export const WHATSAPP_MESSAGE =
  "Hi, I'd love to gain more insight regarding...";
const WHATSAPP_NUMBER = "16464508840";
export const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/* The same link with the visitor's own words carried into it. Used by the
   Concierge when it cannot answer from the FAQ: the advisor opens the chat
   already knowing what was asked, instead of the visitor typing it twice.
   Deliberately the same number and the same wa.me link the rest of the site
   uses — this is one extra opener, not a second WhatsApp integration. */
export function whatsappUrlWithQuestion(question: string) {
  const asked = question.trim();
  if (!asked) return WHATSAPP_URL;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi, I'd love to gain more insight regarding: ${asked}`,
  )}`;
}

export const SOCIAL_X = "https://x.com/stantonkingdom";
export const SOCIAL_INSTAGRAM = "https://www.instagram.com/stantonkingdom?igsh=Mmd3YjduOTJsaTZj";
export const SOCIAL_TIKTOK = "https://www.tiktok.com/@stantonkingdom?_r=1&_t=ZT-98TCNSs7Fcs";
export const SOCIAL_LINKEDIN = "https://www.linkedin.com/company/stanton-kingdom/";
export const SOCIAL_FACEBOOK = "https://www.facebook.com/share/14e85rH2ebU/";
