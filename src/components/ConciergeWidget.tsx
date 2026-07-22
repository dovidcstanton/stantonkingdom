import { useEffect, useRef, useState } from "react";
import markAsset from "../assets/stanton-mark.png.asset.json";

const KB: { k: string[]; a: string }[] = [
  { k: ["commission", "work", "process", "start", "begin", "how does"], a: "It begins with a conversation. Share an image, a rendering, an heirloom, or simply an idea — we translate it into a detailed design rendering, refine it with you until it's exactly right, and only then begin crafting. You approve every detail first." },
  { k: ["natural", "lab", "grown", "difference", "which"], a: "Lab-grown diamonds are chemically and optically identical to natural at a fraction of the price — more carat for the same commitment. Natural diamonds carry billion-year rarity and stronger long-term value. We'll walk you through both honestly; the choice is entirely yours." },
  { k: ["certif", "graded", "gia", "igi", "authentic"], a: "Yes — our stones are graded and certified by independent gemological laboratories, and the certificate accompanies your piece." },
  { k: ["long", "time", "weeks", "fast", "when", "deadline", "rush"], a: "Most commissions complete within three to six weeks. If you have a date — a proposal, an anniversary — tell us first and we build the timeline around it. Rush timelines are often possible." },
  { k: ["cost", "price", "budget", "expensive", "afford", "much"], a: "Often less than you'd expect. No inventory, no showroom — you pay for the stone, the metal, and the craft, not retail markup. Tell us your budget and we design within it. Every quote is itemized before we begin." },
  { k: ["heirloom", "own stone", "my diamond", "reset", "existing"], a: "Absolutely — we can reset an heirloom diamond into a new design, redesign an existing piece entirely, or build around a stone you've sourced yourself." },
  { k: ["metal", "gold", "platinum", "rose", "white", "yellow"], a: "We work in 18k and 14k gold — yellow, white and rose — and platinum. Mixed metals, finishes and engraving are all within reach." },
  { k: ["ship", "deliver", "worldwide", "international", "insured"], a: "Yes — every piece is fully insured in transit, discreetly packaged, and delivered to your door on any continent." },
  { k: ["copy", "replica", "another brand", "tiffany", "cartier", "photo of"], a: "Send anything as inspiration. We won't copy another house's piece — we'll design something in its spirit that's original and yours alone." },
  { k: ["ring", "engagement", "wedding", "propose"], a: "Engagement rings are the heart of the House — each designed around one hand and one story, in any shape or style: Classic, Trendsetting, Vintage, or Uniquely Yours. Tap 'Start Your Story' below and tell us about her." },
  { k: ["render", "modify", "redesign", "change", "reimagine"], a: "We can reimagine any existing piece — a different stone, a new setting, another metal. Send a photo through Start Your Story or WhatsApp and we'll show you design renderings of the transformation before anything is remade." },
  { k: ["contact", "call", "phone", "email", "speak", "talk", "appointment", "consult", "meet"], a: "Reach out for a complimentary private consultation — in person or virtual. WhatsApp is fastest, or call +1 (646) 450-8840 (Mon–Thu 9–5, Fri 9–3 ET), or email sales@stantonkingdom.com." },
  { k: ["hour", "open", "when are you"], a: "Mon–Thu 9am–5pm, Friday 9am–3pm ET. WhatsApp messages are welcome anytime." },
];

function reply(q: string) {
  const t = q.toLowerCase();
  let best: string | null = null;
  let score = 0;
  KB.forEach((e) => {
    let s = 0;
    e.k.forEach((k) => {
      if (t.includes(k)) s += k.length;
    });
    if (s > score) {
      score = s;
      best = e.a;
    }
  });
  return best ?? "That deserves a personal answer. Tap 'Continue on WhatsApp' below and we'll reply personally — or leave your details in Start Your Story.";
}

type Msg = { who: "bot" | "user"; text: string };

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { who: "user", text: q }]);
    setTimeout(() => setMsgs((m) => [...m, { who: "bot", text: reply(q) }]), 450);
    setText("");
  };

  return (
    <div className={"cw" + (open ? " open" : "")}>
      <button className="cw-btn" aria-label="Ask the Kingdom" onClick={() => setOpen((v) => !v)}>
        <img src={markAsset.url} alt="" className="cw-btn-mark" />
      </button>
      <div className="cw-panel" aria-hidden={!open}>
        <div className="cw-head">
          <div>
            <div className="cw-title serif">The Kingdom Concierge</div>
            <div className="cw-sub">Ask anything about bespoke</div>
          </div>
          <button className="cw-close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="cw-body" ref={bodyRef}>
          <div className="cw-msg bot">Welcome. Ask me about commissions, diamonds, timing, or pricing — or tap a question below.</div>
          <div className="cw-chips">
            <button onClick={() => ask("how does a commission work")}>How does it work?</button>
            <button onClick={() => ask("natural or lab grown")}>Natural vs lab-grown?</button>
            <button onClick={() => ask("how long does it take")}>How long does it take?</button>
            <button onClick={() => ask("what does it cost")}>What does it cost?</button>
          </div>
          {msgs.map((m, i) => (
            <div key={i} className={"cw-msg " + m.who}>{m.text}</div>
          ))}
        </div>
        <div className="cw-foot">
          <input
            type="text"
            placeholder="Type a question…"
            aria-label="Your question"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(text); }}
          />
          <button aria-label="Send" onClick={() => ask(text)}>→</button>
        </div>
        <a className="cw-wa" href="https://wa.me/16464508840">Continue on WhatsApp →</a>
      </div>
    </div>
  );
}
