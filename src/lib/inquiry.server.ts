/** The endpoint an enquiry is submitted to.
 *
 *  createServerFn is the same mechanism the Shopify calls use, which means it
 *  needs no new routing, no new deployment concern and no new place for
 *  configuration to live: it compiles into the Worker and the browser calls it
 *  as RPC. That is the whole reason for choosing it over a hand-rolled API
 *  route — this project already has exactly one way of doing server work.
 *
 *  It replaces formsubmit.co, which had the form POST a visitor's name, email,
 *  phone number and message to a third party we have no agreement with, and
 *  which put that third party's branding in front of a client at the moment
 *  they first reach out.
 *
 *  Everything that arrives here is untrusted. The order below is deliberate:
 *  cheap rejections first, then validation, then the expensive network work,
 *  so a flood of junk costs a string comparison rather than two API calls. */

import { createServerFn } from "@tanstack/react-start";

import {
  checkNotSpam,
  validateInquiry,
  type InquiryFields,
} from "./inquiry";
import { clientConfirmationEmail, internalInquiryEmail, type TemplateContext } from "./email.templates";
import { deliver, readMailerConfig, type EmailAttachment } from "./email.server";

/** What the browser gets back. Deliberately coarse: a visitor is told whether
 *  it worked, and if not, what they can do about it. The reason a send failed
 *  — an unverified sending domain, a rejected API key — is ours to read in the
 *  log, not theirs to decode on a contact form. */
export type InquiryResponse =
  | { ok: true }
  | { ok: false; kind: "validation"; message: string; fields: Partial<Record<keyof InquiryFields, string>> }
  | { ok: false; kind: "server"; message: string };

/** Uploads are capped well below what the Worker or Resend would allow.
 *  Four megabytes is a generous phone photograph and a poor denial-of-service
 *  payload, and the cap is enforced after reading the size rather than after
 *  buffering the whole thing. */
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const ALLOWED_ATTACHMENT = /^image\//;

/** btoa on a large string overflows the argument list, so the buffer is walked
 *  in chunks. Workers have no Buffer, which is the usual shortcut here. */
function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function formatReceivedAt(date: Date): string {
  // Written out in full rather than as an ISO string: this is read by a person
  // deciding how quickly to reply, and "2026-08-04T22:41:07Z" is not that.
  // The person is in New York, so the clock is New York's — the IANA zone, not
  // a fixed offset, so the switch in and out of daylight saving is the
  // formatter's problem and never ours. "ET" rather than EST/EDT for the same
  // reason: it is correct in both halves of the year.
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date) + " ET";
}

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    return data;
  })
  .handler(async ({ data }): Promise<InquiryResponse> => {
    const raw: Record<string, unknown> = {};
    for (const [key, value] of data.entries()) {
      if (typeof value === "string") raw[key] = value;
    }

    /* 1. Spam, first and cheapest. Nothing is sent and nothing is stored.

          A caught submission gets the same GENERIC failure a real outage
          produces — never "you look like a bot", which simply tells the
          author of the bot what to change, and never a fake success. This
          used to return { ok: true } to blind bots completely, until a real
          person's browser autofilled the honeypot and they watched the site
          confirm an enquiry that was never sent. A false "Message Received."
          costs a client; a bot seeing a generic error costs nothing. The
          success state is now reachable ONLY through a genuinely delivered
          internal notification. */
    const spam = checkNotSpam(raw);
    if (!spam.ok) {
      console.warn("[inquiry] rejected as spam:", spam.reason);
      return {
        ok: false,
        kind: "server",
        message: "We could not send that just now. Please try again, or write to us directly.",
      };
    }

    /* 2. Shape and content. */
    const validated = validateInquiry(raw);
    if (!validated.ok) {
      return {
        ok: false,
        kind: "validation",
        message: validated.message,
        fields: validated.errors,
      };
    }
    const fields = validated.data;

    /* 3. Configuration. Checked before the attachment is read, so a
          misconfigured deployment fails fast and cheaply. */
    const config = readMailerConfig();
    if ("missing" in config) {
      console.error("[inquiry] not configured, missing:", config.missing.join(", "));
      return {
        ok: false,
        kind: "server",
        message: "We could not send that just now. Please try again, or write to us directly.",
      };
    }

    /* 4. The optional upload. A file that is too large or of the wrong type
          does NOT fail the enquiry — the enquiry is the valuable thing and the
          photograph is a nicety. It is dropped, and the internal email says so,
          so an advisor knows to ask for it rather than wondering. */
    let attachment: EmailAttachment | undefined;
    let attachmentNote: string | undefined;
    let attachmentName: string | undefined;

    const file = data.get("attachment");
    if (file && typeof file !== "string" && file.size > 0) {
      attachmentName = file.name;
      if (!ALLOWED_ATTACHMENT.test(file.type)) {
        attachmentNote = "Not attached — only images are accepted.";
      } else if (file.size > MAX_ATTACHMENT_BYTES) {
        attachmentNote = `Not attached — ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 4MB limit. Ask the client to resend it.`;
      } else {
        try {
          const buf = new Uint8Array(await file.arrayBuffer());
          attachment = { filename: file.name, content: toBase64(buf) };
        } catch (err) {
          attachmentNote = "Not attached — the upload could not be read.";
          console.error("[inquiry] attachment read failed:", err);
        }
      }
    }

    const ctx: TemplateContext = {
      siteUrl: config.siteUrl,
      receivedAt: formatReceivedAt(new Date()),
    };

    /* 5. The internal email is the one that must not be lost, so it is sent
          first and its failure is the one that fails the request. If it
          succeeds and the client's confirmation does not, the enquiry has
          still reached the house — the visitor simply misses a receipt, which
          is not worth telling them the whole thing failed and inviting a
          duplicate submission. */
    const internal = internalInquiryEmail(
      fields,
      ctx,
      attachmentName ? { filename: attachmentName, note: attachmentNote } : undefined,
    );

    const internalResult = await deliver(config, {
      label: "internal notification",
      to: config.to,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      // The point of the whole exercise: pressing Reply writes to the client.
      replyTo: fields.email,
      attachments: attachment ? [attachment] : undefined,
    });

    if (!internalResult.ok) {
      console.error("[inquiry] internal email failed:", internalResult.reason, internalResult.detail);
      return {
        ok: false,
        kind: "server",
        message: "We could not send that just now. Please try again, or write to us directly.",
      };
    }

    const confirmation = clientConfirmationEmail(fields, ctx);
    const clientResult = await deliver(config, {
      label: "client confirmation",
      to: fields.email,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
      // A client who presses Reply on their confirmation should be writing to
      // the concierge inbox, not to no-reply@ — the From stays the verified
      // sending address, and this is the one header that redirects the reply.
      replyTo: config.to,
    });

    if (!clientResult.ok) {
      // Logged loudly, because it means a client who wrote to us believes they
      // received no acknowledgement. It does not fail the request.
      console.error("[inquiry] client confirmation failed:", clientResult.reason, clientResult.detail);
    }

    return { ok: true };
  });
