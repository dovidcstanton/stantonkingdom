// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Build-time identifier used for cache-busting versioned asset URLs.
// Changes on every build/dev start so browsers cannot serve stale CSS or images.
const BUILD_ID = Date.now().toString(36);

// ---------------------------------------------------------------------------
// SITE_BASE — the public path the built site is served from.
//
// Read from .env (see .env.example) so moving the site between hosts is a
// one-line edit, never a code change. No VITE_ prefix on purpose: this is
// consumed at BUILD time only and must not be exposed to the browser bundle.
//
//   staging-v1.stantonkingdom.com/  -> SITE_BASE=/          (subdomain root)
//   stantonkingdom.com/            -> SITE_BASE=/          (apex root)
//   stantonkingdom.com/staging/    -> SITE_BASE=/staging/   (subfolder)
//
// Every asset URL in every emitted .html is written with this prefix, so it has
// to match where the files actually land. Wrong prefix => the stylesheet 404s
// and the page renders as unstyled HTML. Leading AND trailing slash required.
//
// loadEnv (rather than bare process.env) is what makes .env files work here —
// vite.config.ts runs before Vite's own env handling applies. The "" third
// argument disables the VITE_ prefix filter so an unprefixed name is visible.
// ---------------------------------------------------------------------------
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const SITE_BASE = env.SITE_BASE?.trim() || "/";

if (!SITE_BASE.startsWith("/") || !SITE_BASE.endsWith("/")) {
  throw new Error(
    `SITE_BASE must start and end with "/" (got "${SITE_BASE}"). ` +
      `Use "/" for a domain or subdomain root, "/folder/" for a subfolder.`,
  );
}

export default defineConfig({
  // Cloudflare Worker (SSR) build. Nitro is left at its default — the config
  // package targets cloudflare — so the build lands in .output/ as a Worker
  // entry plus a public/ asset directory, and emits no .html at all.
  //
  // That is the point. Every page is rendered by the Worker on request, so
  // /collection/rings/engagement and /piece/<handle> answer correctly whether
  // they are followed from the menu, opened cold from a pasted link, or
  // refreshed. The previous static build prerendered only / and /collection/,
  // which meant every deeper URL 404'd on a hard load — see the checkpoint
  // commit 588cffb, which set the static flags precisely so this branch could
  // reverse them.
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Set SITE_BASE in .env to change this — see the note at the top of the file.
    //
    // "./" is NOT a valid alternative to an absolute base: the prerenderer
    // writes the same relative prefix into every page regardless of depth, so
    // nested pages look for assets inside themselves, and the module preloads
    // come out malformed as "/./assets/...".
    base: SITE_BASE,
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
  },
});
