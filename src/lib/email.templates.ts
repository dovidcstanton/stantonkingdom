/** The two emails an enquiry produces, as pure functions.
 *
 *  No network, no environment, no side effects: give these an enquiry and they
 *  give back a subject, an HTML body and a plain-text body. That is what makes
 *  them checkable without an API key and without sending anything — the whole
 *  of the composition can be exercised in a test or a console.
 *
 *  ---- why the HTML looks like 2004 ----
 *  Tables, inline styles, no flexbox, no grid, no custom properties. Not
 *  nostalgia: Outlook renders through Word's HTML engine, Gmail strips <style>
 *  blocks in some contexts, and no email client can be relied upon for layout
 *  beyond nested tables with inline attributes. Every rule that matters is
 *  written on the element it applies to. The result is verbose and it is the
 *  only thing that survives contact with a real inbox.
 *
 *  ---- the two are not siblings ----
 *  The client confirmation is correspondence: it continues the Start Your
 *  Story section the client just left — same ivory, the wordmark, one
 *  field-coloured card holding a short personal note. The internal email is a
 *  work order: no logo, name and actions first, then a tight specification
 *  sheet an advisor can act on from a phone. They share a palette and nothing
 *  else, on purpose. */

import {
  FIELD_LABELS,
  INQUIRY_GROUPS,
  whatsappLink,
  type InquiryFields,
} from "./inquiry";

/** The house palette, restated here because an email cannot read the
 *  stylesheet. Kept in step with :root in src/styles.css by hand — these
 *  values have not moved in the life of the site. */
const NAVY = "#0B1730";
const IVORY = "#FBF9F4";
const GOLD = "#AE8C4C";
const INK = "#1C1B18";
const RULE = "#E4DED1";
const MUTED = "#6B6660";

/** The Consult form's field surface, resolved to solids. On the site a field
 *  is rgba(255,255,255,.4) over the section's ivory with an inset recess; an
 *  email background cannot be translucent over a parent and no client renders
 *  inset shadows dependably, so the blend is precomputed — white at 40% over
 *  #FBF9F4 lands on #FDFBF8 — and the depth is left to the border. Same
 *  material, translated rather than copied. */
const FIELD_FACE = "#FDFBF8";

/** Georgia is the only serif that is genuinely everywhere, and it is close
 *  enough in colour to Cormorant to carry the house voice. Naming the webfont
 *  first costs nothing and pays off in the few clients that honour it. */
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Jost', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Escape everything that is interpolated into HTML. Every value in these
 *  emails came from a public form, and the internal email is read by us — an
 *  unescaped field is a script tag delivered to our own inbox, and a broken
 *  layout on the way. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Message bodies are the one place a newline is meaningful, so they become
 *  <br> — after escaping, never before. */
function escMultiline(value: string): string {
  return esc(value).replace(/\n/g, "<br>");
}

export type EmailContent = { subject: string; html: string; text: string };

export type TemplateContext = {
  /** Absolute origin of the live site, e.g. https://stantonkingdom.com — the
   *  logo and any link in an email must be absolute, because there is no page
   *  for a relative URL to resolve against. */
  siteUrl: string;
  /** When the enquiry arrived, already formatted for a human, in Eastern
   *  Time — see formatReceivedAt in inquiry.server.ts. */
  receivedAt: string;
};

/** The document around a body: ivory ground, the hidden preheader, one
 *  centred fluid column. width:100% with a max-width is what lets the same
 *  markup fill a phone and hold a column on a desktop — a fixed width=560
 *  table is exactly the thing that used to force Gmail's phone view to
 *  shrink-to-fit. */
function frame(column: string, preheader: string, maxWidth: number, pad: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Stanton Kingdom</title>
</head>
<body style="margin:0;padding:0;background-color:${IVORY};-webkit-text-size-adjust:100%;">
<!-- The preheader is the grey line an inbox shows after the subject. Left to
     itself it scrapes whatever text comes first. Setting it deliberately,
     then hiding it, is the only way to control that line. -->
<div style="display:none;font-size:1px;color:${IVORY};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${IVORY};">
  <tr>
    <td align="center" style="padding:${pad};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${maxWidth}px;">
${column}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/* ====================================================================== */
/*  A. Client confirmation                                                */
/* ====================================================================== */

/** Correspondence, not a receipt. The visitor has just watched the Consult
 *  form become "Message Received."; this continues that moment — the crest
 *  above and the wordmark below frame one card in the form's own field
 *  colour, the way a letterhead frames a note, and neither mark ever sits
 *  inside the card itself. The copy is the house's, verbatim, and stays that
 *  way: no ticket number, no survey, no social icons, no unsubscribe — a
 *  one-off transactional reply to something the person just did, not a
 *  mailing.
 *
 *  Set in the house serif's italic at note size on a narrow column: five
 *  short lines that hold their shape on a phone instead of wrapping. Both
 *  marks are plain absolute <img>s — the only logo treatment every client
 *  renders — with ALT text written to be read, because images-off is the
 *  default in many inboxes.
 *
 *  The crest is rendered from the brand's vector original (Asset 27 PDF)
 *  through Windows' own PDF engine at 1600px, unmixed to transparency and
 *  laid down in the wordmark's exact #132A5E, then resampled once to 4x its
 *  54px display size — the raster ceiling of the old 300px source is gone.
 *  Explicit width AND height attributes because Outlook sizes from the
 *  attributes, not the style. */
export function clientConfirmationEmail(
  data: InquiryFields,
  ctx: TemplateContext,
): EmailContent {
  const first = data.first_name;

  const p = (inner: string, mt: number) =>
    `<p style="margin:${mt}px 0 0;font-family:${SERIF};font-style:italic;font-size:15px;line-height:1.75;color:${NAVY};">${inner}</p>`;

  const column = `
        <tr>
          <td align="center" style="padding:8px 0 40px;">
            <img src="${esc(ctx.siteUrl)}/email-crest-v2.png" width="54" height="53" alt="Stanton Kingdom crest" style="display:block;border:0;outline:none;text-decoration:none;width:54px;max-width:54px;height:53px;">
          </td>
        </tr>
        <tr>
          <td style="background-color:${FIELD_FACE};border:1px solid ${RULE};border-radius:9px;padding:34px 26px 36px;">
            ${p(`Dear ${esc(first)},`, 0)}
            ${p(`Your enquiry has been received.`, 16)}
            ${p(`A client advisor will be in touch with you shortly.`, 16)}
            ${p(`Warmly,<br>Stanton&nbsp;Kingdom`, 26)}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:40px 0 0;">
            <img src="${esc(ctx.siteUrl)}/email-wordmark.png" width="124" alt="Stanton Kingdom" style="display:block;border:0;outline:none;text-decoration:none;width:124px;max-width:124px;height:auto;">
          </td>
        </tr>`;

  const text = [
    `Dear ${first},`,
    ``,
    `Your enquiry has been received.`,
    ``,
    `A client advisor will be in touch with you shortly.`,
    ``,
    `Warmly,`,
    `Stanton Kingdom`,
  ].join("\n");

  return {
    subject: "Your enquiry has been received",
    // 340 with a 14px gutter: narrow enough that the card stands portrait
    // rather than as a wide letterbox, and still width:100% underneath, so on
    // a phone it fills the screen edge to edge instead of sitting in a column
    // with dead ivory either side. The card has no height of its own — it is
    // the padding plus however many lines the note runs to — so a wider
    // screen never makes it taller.
    html: frame(column, "Your enquiry has been received.", 340, "34px 14px 44px"),
    text,
  };
}

/* ====================================================================== */
/*  B. Internal enquiry                                                   */
/* ====================================================================== */

/** One field, as a labelled row on the sheet's single shared grid.
 *
 *  LABEL_COL is the whole of the alignment story: every group table uses the
 *  same fixed first column, so every label starts on one vertical axis and
 *  every answer starts on another, from CLIENT down to RECEIVED. It is also
 *  the mobile budget, balanced from both ends: 134px — of which 10px is the
 *  gutter to the answers — is just wide enough that the longest label,
 *  HEARD ABOUT US VIA at 11px bold, holds one line, and just narrow enough
 *  that a Gmail phone viewport still gives the answer column a full email
 *  address on one line. A label that ever grows
 *  past it wraps within its column rather than pushing the answers around;
 *  that is the point of a grid. The labels carry the hierarchy — bold navy caps against
 *  regular-weight ink answers — and the rows sit at 3px so a group reads as
 *  one compact block: a specification sheet, not a marketing email. */
const LABEL_COL = 134;

function row(label: string, valueHtml: string): string {
  return `
              <tr>
                <td width="${LABEL_COL}" valign="top" style="width:${LABEL_COL}px;padding:3px 8px 3px 0;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.03em;line-height:1.5;text-transform:uppercase;color:${NAVY};">${esc(label)}</td>
                <td valign="top" style="padding:3px 0;font-family:${SANS};font-size:13.5px;font-weight:400;line-height:1.5;color:${INK};word-break:break-word;">${valueHtml}</td>
              </tr>`;
}

/** A titled section: gold eyebrow, hairline, rows. Empty ones are omitted by
 *  the caller — a column of blank labels is noise between the advisor and the
 *  three lines that matter. */
function section(title: string, innerHtml: string): string {
  if (!innerHtml.trim()) return "";
  return `
        <tr>
          <td style="padding:16px 0 0;">
            <p style="margin:0 0 4px;font-family:${SANS};font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};">${esc(title)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${RULE};">
              <tr><td colspan="2" style="height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
              ${innerHtml}
            </table>
          </td>
        </tr>`;
}

/** The message is one heading and the client's own words — never a label
 *  column repeating MESSAGE beside itself. Full width, natural wrap, no fixed
 *  height: a long message takes the room it needs and a short one takes none. */
function messageSection(message: string): string {
  return section(
    "Message",
    `
              <tr>
                <td colspan="2" style="padding:2px 0;font-family:${SANS};font-size:13.5px;font-weight:400;line-height:1.6;color:${INK};word-break:break-word;">${escMultiline(message)}</td>
              </tr>`,
  );
}

/** One compact action: a navy icon beside a navy label on a gold hairline.
 *  Title case, never caps. Each sits in an outlined pill — same height, same
 *  radius, same rule weight, same padding, same type and icon size — so the
 *  three read as one set of controls rather than three underlined words of
 *  different lengths. Gold rule, navy ink: the house's own pair, not a
 *  generic web button.
 *
 *  border-radius is ignored by Outlook's Word engine, which draws these as
 *  square-cornered outlined boxes. That is a deliberate floor, not an
 *  oversight — the control still reads and still works; only the corner
 *  softens. line-height is pinned so every pill is the same height whatever
 *  the label, and mso-padding-alt gives Word the padding it otherwise drops.
 *
 *  The icons are hosted PNGs (drawn navy on transparent, served 3x for
 *  retina) because inline SVG is stripped by Gmail and an emoji glyph
 *  renders differently in every client. */
function action(href: string, icon: string, label: string, siteUrl: string): string {
  return (
    `<a href="${esc(href)}" style="display:inline-block;font-family:${SANS};font-size:12.5px;font-weight:600;letter-spacing:.02em;line-height:16px;color:${NAVY};text-decoration:none;border:1px solid ${GOLD};border-radius:100px;padding:8px 15px;white-space:nowrap;mso-padding-alt:8px 15px;">` +
    `<img src="${esc(siteUrl)}/${icon}" width="15" height="15" alt="" style="border:0;vertical-align:middle;margin-right:7px;">` +
    `<span style="vertical-align:middle;">${esc(label)}</span></a>`
  );
}

/* Between pills, and wide enough that they never read as one control. The
   row's own line-height (set on the paragraph) is what spaces them when a
   narrow phone wraps the third one onto a second line. */
const ACTION_GAP = `<span style="display:inline-block;width:10px;">&nbsp;</span>`;

/** Built to be acted on, not admired. An advisor opening this on a phone sees
 *  who it is and how to answer them — Email, WhatsApp, Call — before anything
 *  else, then the enquiry as a tight labelled sheet. No wordmark: this is a
 *  work order arriving in the house's own inbox, and the subject line already
 *  says whose house it is.
 *
 *  The WhatsApp action opens a conversation with THE CLIENT'S submitted
 *  number — never the house's own WhatsApp line — and only when the number
 *  normalizes with confidence; see whatsappLink. Reply-To is the client, set
 *  in the send layer, so the mail client's own Reply button answers them too. */
export function internalInquiryEmail(
  data: InquiryFields,
  ctx: TemplateContext,
  attachment?: { filename: string; note?: string },
): EmailContent {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  const wa = whatsappLink(data.phone);
  const tel = data.phone ? `tel:${data.phone.replace(/[^\d+]/g, "")}` : null;
  const sourceName = data.source === "piece" ? "Piece enquiry" : "Start Your Story";

  /* Verbs only — the name is two lines up, restating it three times bought
     width and nothing else. The WhatsApp mark is the real one (bubble and
     handset), not a generic chat glyph; the destinations stay the client's
     own submitted address and number. */
  const actions = [
    action(`mailto:${data.email}`, "email-icon-envelope.png", "Email", ctx.siteUrl),
    wa ? action(wa, "email-icon-whatsapp.png", "WhatsApp", ctx.siteUrl) : "",
    tel ? action(tel, "email-icon-handset.png", "Call", ctx.siteUrl) : "",
  ]
    .filter(Boolean)
    .join(ACTION_GAP);

  const fieldRow = (f: keyof InquiryFields): string => {
    const value = data[f];
    if (!value) return "";
    if (f === "email") {
      return row(
        FIELD_LABELS[f],
        `<a href="mailto:${esc(value)}" style="color:${NAVY};text-decoration:underline;">${esc(value)}</a>`,
      );
    }
    if (f === "phone") {
      return row(
        FIELD_LABELS[f],
        `<a href="${esc(tel ?? "")}" style="color:${NAVY};text-decoration:underline;">${esc(value)}</a>`,
      );
    }
    return row(FIELD_LABELS[f], esc(value));
  };

  /* The named sections, in reading order: who they are, what they want, what
     they said — Message rendered as prose rather than as a labelled row. */
  const sections = INQUIRY_GROUPS.map((g) => {
    if (g.title === "Message") {
      return data.message ? messageSection(data.message) : "";
    }
    return section(g.title, g.fields.map(fieldRow).join(""));
  }).join("");

  const attachmentSection = attachment
    ? section(
        "Attachment",
        row(
          "File",
          esc(attachment.filename) +
            (attachment.note
              ? `<br><span style="color:${MUTED};font-size:12px;">${esc(attachment.note)}</span>`
              : ""),
        ),
      )
    : "";

  /* The housekeeping: when, and from where. The source page is named, not
     printed — a workers.dev URL wrapped over three lines told the reader
     nothing the words "Start Your Story" do not, and the URL is still one
     click away under them. */
  const received = section(
    "Received",
    row("Time", esc(ctx.receivedAt)) +
      row(
        "Sent from",
        data.page_url
          ? `<a href="${esc(data.page_url)}" style="color:${NAVY};text-decoration:underline;">${esc(sourceName)}</a>`
          : esc(sourceName),
      ),
  );

  const column = `
        <tr>
          <td style="padding:4px 0 0;">
            <p style="margin:0 0 4px;font-family:${SANS};font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};">New enquiry</p>
            <p style="margin:0;font-family:${SERIF};font-size:27px;line-height:1.2;font-weight:700;color:${NAVY};">${esc(name)}</p>
            <p style="margin:14px 0 0;line-height:2.6;">${actions}</p>
          </td>
        </tr>
        ${sections}${attachmentSection}${received}
        <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>`;

  /* The plain-text version is not a courtesy. Some clients show it, spam
     filters score its absence, and it is the version that survives being
     forwarded into a ticketing system — so it keeps the raw URL the HTML
     tucks behind a link. */
  const textLines: string[] = [`NEW ENQUIRY — ${name}`, ""];
  for (const g of INQUIRY_GROUPS) {
    const present = g.fields.filter((f) => data[f]);
    if (!present.length) continue;
    textLines.push(g.title.toUpperCase());
    if (g.title === "Message") {
      // The heading already says MESSAGE — repeating it as a label was the
      // exact duplication the HTML version fixes, so the text fixes it too.
      textLines.push(`  ${data.message}`);
    } else {
      for (const f of present) {
        textLines.push(`  ${FIELD_LABELS[f]}: ${data[f]}`);
      }
    }
    textLines.push("");
  }
  if (wa) textLines.push(`WhatsApp: ${wa}`, "");
  if (attachment) {
    textLines.push(`Attachment: ${attachment.filename}${attachment.note ? ` (${attachment.note})` : ""}`, "");
  }
  textLines.push(`Received: ${ctx.receivedAt}`);
  if (data.page_url) textLines.push(`Sent from: ${data.page_url}`);
  textLines.push(`Form: ${sourceName}`);

  const subject =
    data.source === "piece" && data.piece_name
      ? `New enquiry — ${name} — ${data.piece_name}`
      : `New enquiry — ${name}`;

  return {
    subject,
    html: frame(column, `${name} · ${data.email}`, 560, "20px 10px 26px"),
    text: textLines.join("\n"),
  };
}
