import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCssHref from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/SiteHeader";
import { ConciergeWidget } from "../components/ConciergeWidget";
import { ScrollProgress } from "../components/ScrollProgress";
import { CartDrawer, CartLauncher } from "../components/CartDrawer";
import { CartProvider } from "../lib/cart";

// Build-time cache-buster. `__BUILD_ID__` is injected via Vite `define` in
// vite.config.ts and changes on every build, so browsers and the preview
// iframe cannot serve a stale copy of the stylesheet or same-URL assets.
declare const __BUILD_ID__: string;
const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : String(Date.now());
export const withVersion = (url: string, version: string = BUILD_ID) =>
  `${url}${url.includes("?") ? "&" : "?"}v=${version}`;
const appCss = withVersion(appCssHref);
// BUILD_ID above is frozen once per dev-server process start (it's a plain
// module-level const), so it does NOT change as files are edited during a
// dev session — every reload kept refetching the exact same "?v=..." URL,
// which browsers are free to serve from cache, showing stale CSS even after
// real edits landed. In dev, recompute the version fresh on every request
// instead so a reload always gets the current file. Production keeps the
// stable per-build BUILD_ID, which is what you want for real caching.
const getAppCssHref = () =>
  import.meta.env.DEV ? withVersion(appCssHref, Date.now().toString(36)) : appCss;

function NotFoundComponent() {
  return (
    <div
      style={{ background: "var(--ivory)" }}
      className="flex min-h-screen items-center justify-center px-4"
    >
      <div className="max-w-md text-center">
        <h1 className="serif" style={{ fontSize: "5rem", color: "var(--navy)" }}>
          404
        </h1>
        <p className="mt-2" style={{ color: "var(--ink-mute)" }}>
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn btn-gold"
            style={{ borderColor: "var(--gold)", color: "var(--navy)" }}
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div
      style={{ background: "var(--ivory)" }}
      className="flex min-h-screen items-center justify-center px-4"
    >
      <div className="max-w-md text-center">
        <h1 className="serif" style={{ fontSize: "1.8rem", color: "var(--navy)" }}>
          This page didn't load
        </h1>
        <p className="mt-2" style={{ color: "var(--ink-mute)" }}>
          Something went wrong. Please try again.
        </p>
        <div className="mt-6">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn btn-gold"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Stanton Kingdom" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Stanton Kingdom" },
      { name: "twitter:card", content: "summary_large_image" },
      // Prevent preview iframe / browser from serving a stale HTML shell.
      { httpEquiv: "Cache-Control", content: "no-cache, no-store, must-revalidate" },
      { httpEquiv: "Pragma", content: "no-cache" },
      { httpEquiv: "Expires", content: "0" },
      { name: "build-id", content: BUILD_ID },
    ],
    links: [
      { rel: "stylesheet", href: getAppCssHref() },
      {
        rel: "icon",
        // Served from this site, not hot-linked from the old WordPress host.
        // Byte-identical copy of the file that URL returned — the site has to
        // stand on its own the moment the old host is retired.
        href: "/favicon-stanton.webp",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Jost:wght@200;300;400;500&family=Pinyon+Script&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,600&family=Tangerine:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <ScrollProgress />
        <SiteHeader />
        <Outlet />
        <ConciergeWidget />
        <CartLauncher />
        <CartDrawer />
      </CartProvider>
    </QueryClientProvider>
  );
}
