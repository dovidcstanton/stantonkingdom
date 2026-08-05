/** The enquiry route to a piece, for anything not sold straight from the cart.
 *
 *  Goes to the same endpoint as the Start Your Story form at the foot of the
 *  home page, so every lead lands in one inbox rather than David having to
 *  watch two — and so there is one place that validates an enquiry, one pair
 *  of email templates and one sending path.
 *
 *  It was the second of the two forms posting a visitor's name, email and
 *  phone number to formsubmit.co; that is gone. It is still an XHR rather than
 *  a form POST, so a client is never navigated away from the piece they were
 *  looking at. */

import { useEffect, useRef, useState } from "react";

import { money, type SkProduct } from "@/lib/catalog";
import { HONEYPOT_FIELD, TIMESTAMP_FIELD } from "@/lib/inquiry";
import { submitInquiry } from "@/lib/inquiry.server";

type Status = "idle" | "sending" | "sent" | "error";

export function InquiryDialog({ piece, onClose }: { piece: SkProduct; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef(Date.now());

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // The same double-submit guard the Consult form uses: a second click while
    // the first request is in flight would send a second enquiry.
    if (status === "sending") return;
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    setStatus("sending");
    const payload = new FormData(form);
    payload.set(TIMESTAMP_FIELD, String(renderedAt.current));
    payload.set("source", "piece");
    payload.set("piece_name", piece.name);
    payload.set("piece_handle", piece.handle);
    payload.set("piece_price", money(piece.price, piece.currency));
    payload.set("page_url", typeof window !== "undefined" ? window.location.href : "");

    try {
      const res = await submitInquiry({ data: payload });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="inq-scrim" onClick={onClose}>
      <div
        className="inq"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inq-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="inq-x" onClick={onClose} aria-label="Close enquiry">
          ×
        </button>

        {status === "sent" ? (
          <div className="inq-done">
            <span className="eyebrow">Received</span>
            <h2 id="inq-title" className="serif">
              Thank you.
            </h2>
            <p>
              Your enquiry about <em>{piece.name}</em> is with us. A member of the house will write
              to you personally within one business day.
            </p>
            <button className="btn btn-gold" onClick={onClose}>
              Continue Browsing
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Private Enquiry</span>
            <h2 id="inq-title" className="serif">
              {piece.name}
            </h2>
            {piece.spec ? <p className="inq-spec">{piece.spec}</p> : null}
            <p className="inq-lead">
              Tell us a little about the occasion and we will come back to you personally — with
              availability, timings, and any variation you have in mind.
            </p>

            <form className="inq-form" onSubmit={submit}>
              {/* See the note on the Consult form's honeypot — same field, same
                  server-side check, same reason it is hidden with geometry
                  rather than display:none, and same readOnly so the visitor's
                  own autofill can never populate it and flag them as a bot. */}
              <div className="acq-hp" aria-hidden="true">
                <label htmlFor={`inq-${HONEYPOT_FIELD}`}>Company website</label>
                <input
                  id={`inq-${HONEYPOT_FIELD}`}
                  type="text"
                  name={HONEYPOT_FIELD}
                  tabIndex={-1}
                  autoComplete="off"
                  readOnly
                />
              </div>
              <div className="f-row">
                <label>
                  First Name
                  <input ref={firstFieldRef} type="text" name="first_name" required />
                </label>
                <label>
                  Last Name
                  <input type="text" name="last_name" required />
                </label>
              </div>
              <div className="f-row">
                <label>
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Contact Number
                  <input type="tel" name="phone" required />
                </label>
              </div>
              <label>
                Message
                <textarea
                  name="message"
                  rows={4}
                  defaultValue={`I would like to know more about ${piece.name}.`}
                  required
                />
              </label>

              {status === "error" ? (
                <p className="inq-error">
                  That didn't send. Please email{" "}
                  <a href="mailto:sales@stantonkingdom.com">sales@stantonkingdom.com</a> and we'll
                  pick it up straight away.
                </p>
              ) : null}

              <button type="submit" className="btn btn-gold inq-go" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send Enquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
