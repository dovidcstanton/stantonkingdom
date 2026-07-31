import { useEffect, useRef, useState } from "react";
import { SIGNATURE_STROKES, SIGNATURE_VIEWBOX } from "./signaturePaths";

const SIG_SRC = "/signature-dcs.png";
// 3800, not 3000: a real signature, with a flourish and a date beneath it,
// doesn't land in three seconds flat — that read a shade brisker than an
// actual hand. A quarter more time, spread the same way (by stroke length,
// see below), is the difference between a pen moving and a pen hurrying.
const WRITE_MS = 3800; // total time for the whole signature to be written
// Was 700: a visible fade-in once the writing finished, patching whatever the
// round stroke missed. That fade was a second, separate event on top of an
// animation that was already legible — every stroke reaches full colour and
// shadow the instant it is drawn, but this settle then made the SIGNATURE
// keep visibly changing for another 700ms after the pen had, by every other
// signal, already finished — which read as "getting clearer," not settling.
// Instant removes the event rather than hiding it: the patch still lands
// (nothing about ink coverage changed, only its timing), it simply lands on
// the same frame the last stroke does, so there is nothing left to notice.
const FILL_MS = 0;

/**
 * The founder's signature, written on first sight.
 *
 * The artwork itself is never redrawn. The traced centrelines animate a MASK
 * that uncovers the original image along the pen's route, so what appears is
 * the real signature — copperplate thick-and-thin intact — rather than a
 * uniform stroke approximating it. A stroke wide enough to cover the heaviest
 * downstroke does the uncovering, with round caps so each stroke opens and
 * closes like a nib rather than a chisel.
 *
 * Two masks are intersected: `ink` (the signature's own alpha, so nothing
 * outside the letterforms can ever show) and `write` (the growing strokes).
 * When the writing finishes, the fully-filled signature snaps in underneath —
 * instantly, not a fade — to pick up anything the round stroke didn't quite
 * reach: hairline exits, the thinnest parts of the flourish. It used to fade
 * in over 700ms, which made the signature visibly keep resolving after the
 * pen had already finished; snapping it in on the same frame the last stroke
 * lands means nothing changes after the writing looks done, because nothing
 * does.
 */
export function SignatureMark({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [written, setWritten] = useState(false);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>(".sig-stroke"));
    if (!paths.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // No writing gesture — just present the finished signature.
      paths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
        p.style.opacity = "1";
      });
      setWritten(true);
      return;
    }

    // Budget the 3 seconds by stroke LENGTH, so the flourish's long sweep takes
    // proportionally longer than a dot. Counting strokes equally instead would
    // rush the flourish and dwell on specks.
    //
    // But length alone makes the punctuation invisible: the full stop after "C"
    // is about two units of a ~3000-unit total, which by pure proportion earns
    // roughly 2ms — it would be over before a screen could draw it. So the few
    // dot-sized marks are given a fixed beat each and the rest of the time is
    // shared by length among everything else. A floor on ALL 53 strokes would
    // not work: at 55ms each that is 2.9s of the 3s budget, which flattens the
    // weighting and turns the whole signature into an even stutter.
    const DOT_LEN = 8; // below this a stroke is a tap, not a stroke
    const DOT_MS = 95; // long enough to actually see land
    const lengths = paths.map((p) => p.getTotalLength());
    const dotTime = lengths.filter((l) => l < DOT_LEN).length * DOT_MS;
    const share = Math.max(0, WRITE_MS - dotTime);
    const flowing = lengths.reduce((a, l) => a + (l < DOT_LEN ? 0 : l), 0) || 1;

    // A stroke that simplified down to a single point has no length, and
    // stroke-dashoffset cannot hide something with nothing to offset — it would
    // sit there permanently as a round cap. Those are driven by opacity on the
    // same schedule instead, so the whole signature really does clear.
    const isPoint = (l: number) => l < 0.5;

    let elapsed = 0;
    const timings: string[] = [];
    paths.forEach((p, i) => {
      const len = lengths[i];
      const dur = len < DOT_LEN ? DOT_MS : (len / flowing) * share;
      const timing = isPoint(len)
        ? `opacity ${dur}ms linear ${elapsed}ms`
        : `stroke-dashoffset ${dur}ms linear ${elapsed}ms`;
      timings.push(timing);
      if (isPoint(len)) {
        p.style.opacity = "0";
      } else {
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      }
      p.style.transition = timing;
      elapsed += dur;
    });

    // Re-arms every time the signature leaves. Signing is a gesture, not a
    // fact to be established once — if you scroll back you should watch it
    // written again rather than find it already there.
    let running = false;
    let timer = 0;

    // Winding back has to be INSTANT. Leaving each stroke's timing in place
    // meant the reset itself animated — and animated in the same staggered
    // order, so returning part-way through caught most strokes still counting
    // down their delay and only the first one, whose delay is zero, ever
    // restarted. Clearing the transition first makes the signature vanish the
    // moment it leaves, which is also what should happen visually.
    const rewind = () => {
      running = false;
      window.clearTimeout(timer);
      setWritten(false);
      paths.forEach((p, i) => {
        p.style.transition = "none";
        if (isPoint(lengths[i])) p.style.opacity = "0";
        else p.style.strokeDashoffset = `${lengths[i]}`;
      });
    };

    const play = () => {
      running = true;
      // Commit the wound-back, untransitioned state before handing the timings
      // back, or the browser coalesces the reset and the replay into one change
      // and there is nothing to animate.
      void svg.getBoundingClientRect();
      paths.forEach((p, i) => { p.style.transition = timings[i]; });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          paths.forEach((p, i) => {
            if (isPoint(lengths[i])) p.style.opacity = "1";
            else p.style.strokeDashoffset = "0";
          });
        });
      });
      timer = window.setTimeout(() => setWritten(true), WRITE_MS + 60);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { if (!running) play(); }
        else if (running) rewind();
      },
      // Deliberately high: on a phone the signature sits below the passage it
      // signs, and it should be written once the reader has arrived at it —
      // not the instant its first pixel clears the fold.
      { threshold: 0.6 },
    );
    io.observe(svg);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, []);

  return (
    <svg
      ref={ref}
      className={(className ? className + " " : "") + "sig-svg" + (written ? " sig-written" : "")}
      viewBox={SIGNATURE_VIEWBOX}
      role="img"
      aria-label="David C. Stanton"
    >
      <defs>
        <mask id="sig-ink" maskUnits="userSpaceOnUse" x="0" y="0" width="560" height="257">
          {/* White-on-transparent artwork read as a luminance mask: the ink is
              the only thing that can ever be painted. */}
          <image href={SIG_SRC} x="0" y="0" width="560" height="257" />
        </mask>
        <mask id="sig-write" maskUnits="userSpaceOnUse" x="0" y="0" width="560" height="257">
          <g
            fill="none"
            stroke="#fff"
            /* Wide enough to uncover the pen's path, narrow enough that it
               follows it. At 17 the round caps uncovered a blob well wider than
               the stroke and the signature looked finished about a third of the
               way through; the trailing fill picks up the heaviest downstrokes
               this leaves slightly short. */
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {SIGNATURE_STROKES.map((d, i) => (
              <path key={i} className="sig-stroke" d={d} />
            ))}
          </g>
        </mask>
      </defs>

      {/* Written: real ink, uncovered along the pen's route. */}
      <g mask="url(#sig-ink)">
        <rect width="560" height="257" fill="currentColor" mask="url(#sig-write)" />
      </g>
      {/* Settled: the complete signature, faded in once the writing is done. */}
      <rect
        className="sig-fill"
        width="560"
        height="257"
        fill="currentColor"
        mask="url(#sig-ink)"
        style={{ transitionDuration: `${FILL_MS}ms` }}
      />
    </svg>
  );
}
