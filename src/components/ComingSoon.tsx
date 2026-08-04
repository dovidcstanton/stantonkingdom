/** The holding page shown where a collection's results would be.
 *
 *  It stands in for the secondary catalogue pages only — the navigation that
 *  leads here is untouched, so a visitor still travels Jewelry → Rings →
 *  Engagement → Classic in full and only meets this screen when they ask for
 *  the results themselves. See CATALOGUE_LIVE in src/lib/catalog.ts.
 *
 *  The page is now the house artwork and one line of type. The backdrop, the
 *  ghosted lockup and the "COMING SOON / STAY TUNED" wording all live inside
 *  the supplied image rather than being rebuilt in CSS, so what ships is
 *  exactly what was designed. The only thing this file adds is the client
 *  advisor line at the foot.
 *
 *  The WhatsApp link is the site's single shared one (src/lib/social.ts) — the
 *  same number and the same pre-filled opener the Concierge, the footer and the
 *  contact panel all use. There is no second integration here. */

import { useEffect } from "react";

import { WHATSAPP_URL } from "../lib/social";

/* Served from /public rather than imported, like the other full-bleed artwork
   on the site (heritage-portrait, philosophy). Re-encoded from the supplied
   1.5MB PNG to a full-resolution JPEG at quality 92 — 129KB, a twelfth of the
   weight, with a mean channel difference of 1.2/255 against the original and
   no banding in the gradients. It is the only asset this page loads. */
const ART = "/coming-soon.jpg";

export function ComingSoon() {
  /* The header turns white on any page without a hero to sit over, which would
     lay a hard white bar across the top of a page that is one continuous navy
     image. This class lets the stylesheet hand it back the transparency it
     already uses over the hero — presentation only: no dimension, no padding
     and no icon size is touched, so --sk-hdr and everything measured against
     it stay exactly as they are. */
  useEffect(() => {
    document.body.classList.add("sk-holding");
    return () => document.body.classList.remove("sk-holding");
  }, []);

  return (
    <main className="cs">
      {/* The same artwork, blown past the edges and blurred, purely to fill the
          screen around it. The image is square and a screen never is, so
          showing all of it always leaves bands — and its own vignette is not
          one flat colour, so any fixed backdrop would seam against it
          somewhere. Taking the fill from the picture itself means the join
          matches at every edge on every viewport, and reads as the artwork's
          own glow rather than as a letterbox. Same file, so it costs one
          cached decode and no extra request. */}
      <div className="cs-bleed" aria-hidden="true" style={{ backgroundImage: `url(${ART})` }} />

      {/* The artwork carries the page's entire message, so it is the heading —
          the alt text is the wording printed in it, and there is no second copy
          of those words to drift out of step with the picture. */}
      <h1 className="cs-head">
        <img className="cs-art" src={ART} alt="Coming Soon — Stay Tuned!" />
      </h1>

      {/* Two halves on purpose: the question stays quiet in ivory, and only the
          offer is gold and live. Splitting it that way keeps the line reading
          as concierge assistance rather than as a button someone has laid at
          the bottom of the page. */}
      <p className="cs-foot">
        <span className="cs-foot-ask">After something specific?</span>{" "}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          Speak with a Client Advisor directly via WhatsApp.
        </a>
      </p>
    </main>
  );
}
