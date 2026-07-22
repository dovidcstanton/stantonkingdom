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
import { SiteFooter } from "../components/SiteFooter";
import { ConciergeWidget } from "../components/ConciergeWidget";
import { ScrollProgress } from "../components/ScrollProgress";

// Build-time cache-buster. `__BUILD_ID__` is injected via Vite `define` in
// vite.config.ts and changes on every build, so browsers and the preview
// iframe cannot serve a stale copy of the stylesheet or same-URL assets.
declare const __BUILD_ID__: string;
const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : String(Date.now());
export const withVersion = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}v=${BUILD_ID}`;
const appCss = withVersion(appCssHref);

function NotFoundComponent() {
  return (
    <div style={{ background: "var(--ivory)" }} className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="serif" style={{ fontSize: "5rem", color: "var(--navy)" }}>404</h1>
        <p className="mt-2" style={{ color: "var(--ink-mute)" }}>
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn btn-gold" style={{ borderColor: "var(--gold)", color: "var(--navy)" }}>
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
    <div style={{ background: "var(--ivory)" }} className="flex min-h-screen items-center justify-center px-4">
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
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "https://stantonkingdom.com/wp-content/uploads/2023/10/cropped-Favicon-270x270.webp",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Jost:wght@200;300;400;500&family=Pinyon+Script&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,600&family=Tangerine:wght@400;700&display=swap",
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
      <ScrollProgress />
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <ConciergeWidget />
    </QueryClientProvider>
  );
}
