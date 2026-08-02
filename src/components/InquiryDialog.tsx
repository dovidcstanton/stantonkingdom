/** The enquiry route to a piece, for anything not sold straight from the cart.
 *
 *  Posts to the same formsubmit.co endpoint as the Start Your Story form at the
 *  foot of the home page, so every lead lands in one inbox rather than David
 *  having to watch two. It uses the AJAX endpoint rather than a plain form POST
 *  so a client is never navigated away from the piece they were looking at. */

import { useEffect, useRef, useState } from "react";

import { money, type SkProduct } from "@/lib/catalog";

const ENDPOINT = "https://formsubmit.co/ajax/sales@stantonkingdom.com";

type Status = "idle" | "sending" | "sent" | "error";

export function InquiryDialog({ piece, onClose }: { piece: SkProduct; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const firstFieldRef = useRef<HTMLInputElement>(null);

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
    const form = e.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...fields,
          _subject: `Enquiry — ${piece.name}`,
          _captcha: "false",
          Piece: piece.name,
          Reference: piece.handle,
          "Guide price": money(piece.price, piece.currency),
          Page: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
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
