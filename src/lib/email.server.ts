/** Sending, and nothing else.
 *
 *  Every other file in this feature is provider-agnostic. This one knows about
 *  Resend, and it is the only one that does — deliberately, so that swapping to
 *  Cloudflare Email Service later is a change to `deliver()` and to nothing
 *  above it. The templates would not move; the endpoint would not move.
 *
 *  Server-only. Nothing here may be imported into a component: the API key is
 *  read from the environment and must never be reachable from the browser
 *  bundle. It is used by inquiry.server.ts, which runs inside createServerFn.
 *
 *  Required environment:
 *    RESEND_API_KEY      the Resend API key         (Worker secret)
 *    INQUIRY_FROM_EMAIL  e.g. Stanton Kingdom <no-reply@send.stantonkingdom.com>
 *    INQUIRY_TO_EMAIL    where enquiries land       e.g. sales@stantonkingdom.com
 *    PUBLIC_SITE_URL     absolute origin, for the logo and links
 *
 *  When any of them is missing the send does not throw and does not pretend to
 *  have worked: it returns a not-configured result, the endpoint reports
 *  failure, and the form shows its error state with the client's answers still
 *  in the fields. A silently swallowed enquiry is the one outcome worth
 *  engineering against — the visitor believes they have reached us and we have
 *  no record of them. */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailAttachment = {
  filename: string;
  /** base64, no data: prefix — what Resend expects. */
  content: string;
};

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  /** Which of the two messages this is, in plain words, purely so a failure in
   *  the log says which one died without the reader having to correlate
   *  timestamps against the call site. */
  label?: string;
};

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "unconfigured" | "rejected" | "network"; detail: string };

export type MailerConfig = {
  apiKey: string;
  from: string;
  to: string;
  siteUrl: string;
};

/** Read and check the environment once, so a misconfiguration is reported as
 *  one clear fact rather than as four separate mysterious failures.
 *
 *  process.env is how this project already reads server configuration — see
 *  shopify.functions.ts — and nitro maps Worker bindings and secrets onto it,
 *  so the same code reads .dev.vars locally and Worker secrets in production. */
/** Everything a bearer token may legally contain: printable ASCII, no space.
 *
 *  This is not defensive tidying, it is the fix for a real failure. A key
 *  copied out of a dashboard can carry an invisible passenger — a zero-width
 *  space, a byte-order mark — and an API key is the one string nobody ever
 *  looks at, so it travels unnoticed into the Authorization header.
 *
 *  What made it expensive to find is that Resend answers the two cases
 *  differently, and only one of them looks like a key problem:
 *
 *      wrong key, well formed   -> 401  "API key is invalid"
 *      malformed key            -> 400  (bare, at the edge)
 *
 *  A 400 reads like a bad request — a wrong field, a bad address — so the
 *  investigation goes looking at the payload, which is fine. Verified against
 *  the live API: a trailing space still gives 401, but an EMBEDDED zero-width
 *  space or BOM gives 400. That is why trimming is not enough and every
 *  offending character has to come out, wherever it sits in the string. */
const KEY_UNSAFE = /[^\x21-\x7E]/g;

export function readMailerConfig(): MailerConfig | { missing: string[] } {
  const rawKey = process.env.RESEND_API_KEY ?? "";
  const apiKey = rawKey.replace(KEY_UNSAFE, "");
  const stripped = rawKey.length - apiKey.length;
  if (stripped > 0) {
    // The count and nothing else. Never a fragment, never a length, never a
    // prefix — a key is not partially safe to log.
    console.warn(
      `[inquiry] RESEND_API_KEY contained ${stripped} character(s) outside ` +
        `printable ASCII; removed before use.`,
    );
  }

  // The other three are addresses and a URL. They cannot carry an invisible
  // character into a header the way the key can, but a stray newline from a
  // paste would corrupt the From header just as effectively, so they are
  // trimmed on the same principle.
  const from = (process.env.INQUIRY_FROM_EMAIL ?? "").trim();
  const to = (process.env.INQUIRY_TO_EMAIL ?? "").trim();
  const siteUrl = (process.env.PUBLIC_SITE_URL ?? "").trim();

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("INQUIRY_FROM_EMAIL");
  if (!to) missing.push("INQUIRY_TO_EMAIL");
  if (!siteUrl) missing.push("PUBLIC_SITE_URL");
  if (missing.length) return { missing };

  return {
    apiKey,
    from,
    to,
    // A trailing slash here produces "//email-wordmark.png" in every email.
    siteUrl: siteUrl.replace(/\/+$/, ""),
  };
}

/** One HTTP call. Resend's failures are worth distinguishing: a 4xx means the
 *  message or the domain is wrong and retrying will not help, while a network
 *  error may be transient. The caller does not currently retry, but it can see
 *  which it was, and so can the log. */
export async function deliver(config: MailerConfig, email: OutboundEmail): Promise<SendResult> {
  const label = email.label ?? "email";
  let res: Response;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: [email.replyTo] } : {}),
        ...(email.attachments?.length ? { attachments: email.attachments } : {}),
      }),
    });
  } catch (err) {
    console.error(`[inquiry] ${label}: could not reach Resend`, {
      detail: String(err).slice(0, 300),
    });
    return { ok: false, reason: "network", detail: String(err) };
  }

  if (!res.ok) {
    /* Everything the next person needs, in one line.
       The previous version returned only "400 " — an empty body — and left no
       way to tell whether Resend had rejected the message or something in
       front of it had rejected the request. That cost a long investigation, so
       the identifiers that distinguish the two are now captured:
         x-resend-request-id  present -> Resend's application answered
         cf-ray               present -> which Cloudflare edge handled it
       A body that cannot be read says so explicitly rather than arriving as an
       empty string that reads like "Resend said nothing".
       The Authorization header and the key are never touched here. */
    const body = await res.text().catch((e) => `<body unreadable: ${String(e).slice(0, 120)}>`);
    console.error(`[inquiry] ${label}: Resend rejected the message`, {
      status: res.status,
      resendRequestId: res.headers.get("x-resend-request-id"),
      cfRay: res.headers.get("cf-ray"),
      body: body.slice(0, 500),
    });
    return { ok: false, reason: "rejected", detail: `${res.status} ${body}`.slice(0, 500) };
  }

  const body = (await res.json().catch(() => null)) as { id?: string } | null;
  console.log(`[inquiry] ${label}: accepted by Resend`, { id: body?.id ?? null });
  return { ok: true, id: body?.id ?? null };
}
