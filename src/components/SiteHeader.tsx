import { useEffect, useMemo, useRef, useState } from "react";
import bagIconUrl from "../assets/icon-box-v3.png";
import wordmarkUrl from "../assets/stanton-wordmark.png";

const SEARCH_INDEX = [
  { label: "The Philosophy of the Founder", tag: "Our Belief", anchor: "#belief" },
  { label: "The David C. Stanton Collection", tag: "Collections", anchor: "#collections" },
  { label: "Rings — Engagement, Wedding, Eternity, Haute Couture", tag: "Collections", anchor: "#collections" },
  { label: "Necklaces — Pendants, Riviera & Tennis, Milestone", tag: "Collections", anchor: "#collections" },
  { label: "Bracelets — Tennis, Bangles, Statement & Link", tag: "Collections", anchor: "#collections" },
  { label: "Earrings — Studs, Hoops, Drops & Chandeliers", tag: "Collections", anchor: "#collections" },
  { label: "Our Illustrious Heritage", tag: "Heritage", anchor: "#heritage" },
  { label: "Bespoke Artistry — The Journey", tag: "The Journey", anchor: "#journey" },
  { label: "Do you offer both natural and lab-grown diamonds?", tag: "Questions", anchor: "#faq" },
  { label: "Do I need to know exactly what I want?", tag: "Questions", anchor: "#faq" },
  { label: "Can I repurpose or trade in my existing jewelry?", tag: "Questions", anchor: "#faq" },
  { label: "Will I see the design before it's in production?", tag: "Questions", anchor: "#faq" },
  { label: "Is there a minimum budget for going custom?", tag: "Questions", anchor: "#faq" },
  { label: "How does payment work on custom?", tag: "Questions", anchor: "#faq" },
  { label: "How long does a custom project take?", tag: "Questions", anchor: "#faq" },
  { label: "What if I want to make a change?", tag: "Questions", anchor: "#faq" },
  { label: "Do you ship worldwide?", tag: "Questions", anchor: "#faq" },
  { label: "How do I get started?", tag: "Questions", anchor: "#faq" },
  { label: "Start Your Story — Book a Consultation", tag: "Contact", anchor: "#begin" },
  { label: "WhatsApp", tag: "Contact", anchor: "#begin" },
  { label: "Call — +1 (646) 450-8840", tag: "Contact", anchor: "#begin" },
  { label: "Email sales@stantonkingdom.com", tag: "Contact", anchor: "#begin" },
];

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconBubble() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <circle cx="8.3" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // Only turn the header white once we've scrolled past the hero track
      // (into the next section). While panning through the hero, keep it transparent.
      const track = document.querySelector(".hero-track") as HTMLElement | null;
      const threshold = track
        ? track.offsetTop + track.offsetHeight - window.innerHeight - 20
        : 60;
      setScrolled(y > threshold);
      if (Math.abs(y - lastY) > 8) {
        setMenuOpen(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setContactOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 350);
    else setQ("");
  }, [searchOpen]);

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    return query
      ? SEARCH_INDEX.filter(
          (i) => i.label.toLowerCase().includes(query) || i.tag.toLowerCase().includes(query),
        )
      : SEARCH_INDEX;
  }, [q]);

  const go = (anchor: string) => {
    setSearchOpen(false);
    setMenuOpen(false);
    setContactOpen(false);
    document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header id="header" className={scrolled ? "scrolled" : ""}>
      <nav className="nav">
        <div className="nav-zone nav-zone-left">
          <button
            className="icon-btn burger"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
          <button
            className="icon-btn"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <IconSearch />
          </button>
        </div>

        <a href="#top" className="brand" aria-label="Stanton Kingdom home" onClick={(e) => { e.preventDefault(); go("#top"); }}>
          <img
            className="brand-logo"
            src={wordmarkUrl}
            alt="Stanton Kingdom"
          />
        </a>

        <div className="nav-zone nav-zone-right">
          <button
            className="icon-btn"
            aria-label="Contact"
            aria-expanded={contactOpen}
            onClick={() => setContactOpen((v) => !v)}
          >
            <IconBubble />
          </button>
          <button
            className="icon-btn"
            aria-label="Bag (coming soon)"
            onClick={() => { /* wired to Shopify later */ }}
          >
            <span
              className="icon-glyph icon-bag"
              style={{
                WebkitMaskImage: `url(${bagIconUrl})`,
                maskImage: `url(${bagIconUrl})`,
                width: "18px",
                height: "17px",
                marginTop: "-3px",
              }}
              aria-hidden="true"
            />

          </button>
        </div>
      </nav>

      <div className={"search-overlay" + (searchOpen ? " open" : "")}>
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search the Kingdom…"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="search-close" aria-label="Close search" onClick={() => setSearchOpen(false)}>×</button>
        </div>
        <div className="search-results">
          {matches.length ? (
            matches.map((m) => (
              <div key={m.label} className="search-result" onClick={() => go(m.anchor)}>
                <span className="search-result-label">{m.label}</span>
                <span className="search-result-tag">{m.tag}</span>
              </div>
            ))
          ) : (
            <div className="search-empty">No matches — try Collections, Heritage, or Contact.</div>
          )}
        </div>
      </div>

      <div className={"mobile-menu" + (menuOpen ? " open" : "")}>
        <a href="#collections" onClick={(e) => { e.preventDefault(); go("#collections"); }}>Collections</a>
        <a href="#heritage" onClick={(e) => { e.preventDefault(); go("#heritage"); }}>Heritage</a>
        <a href="#journey" onClick={(e) => { e.preventDefault(); go("#journey"); }}>The Journey</a>
        <a href="#faq" onClick={(e) => { e.preventDefault(); go("#faq"); }}>FAQ</a>
        <a href="#begin" onClick={(e) => { e.preventDefault(); go("#begin"); }}>Start Your Story</a>
      </div>

      {/* Contact drawer */}
      <div
        className={"contact-scrim" + (contactOpen ? " open" : "")}
        onClick={() => setContactOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={"contact-drawer" + (contactOpen ? " open" : "")}
        role="dialog"
        aria-label="Contact"
        aria-hidden={!contactOpen}
      >
        <div className="contact-drawer-head">
          <span className="contact-drawer-eyebrow">Get in touch</span>
          <button
            className="contact-drawer-close"
            aria-label="Close contact"
            onClick={() => setContactOpen(false)}
          >×</button>
        </div>
        <div className="contact-drawer-body">
          <a className="contact-row" href="https://wa.me/16464508840" target="_blank" rel="noreferrer">
            <span className="contact-row-label">WhatsApp</span>
            <span className="contact-row-value">+1 (646) 450-8840</span>
          </a>
          <a className="contact-row" href="tel:+16464508840">
            <span className="contact-row-label">Call</span>
            <span className="contact-row-value">+1 (646) 450-8840</span>
          </a>
          <a className="contact-row" href="mailto:sales@stantonkingdom.com">
            <span className="contact-row-label">Email</span>
            <span className="contact-row-value">sales@stantonkingdom.com</span>
          </a>
        </div>
      </aside>
    </header>
  );
}
