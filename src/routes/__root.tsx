import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import stockholmBg from "@/assets/stockholm-skyline-night.jpg";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
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
      { title: "Lovable App" },
      { name: "description", content: "Din Webbpartner låter dig beställa professionella webbplatser för företag och privatpersoner online." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Din Webbpartner låter dig beställa professionella webbplatser för företag och privatpersoner online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Din Webbpartner låter dig beställa professionella webbplatser för företag och privatpersoner online." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6bc9d059-098a-44ab-9920-4662d3da3b4f/id-preview-aba42772--8a0c0a81-a321-4dcd-9565-e272b589a530.lovable.app-1778364480403.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6bc9d059-098a-44ab-9920-4662d3da3b4f/id-preview-aba42772--8a0c0a81-a321-4dcd-9565-e272b589a530.lovable.app-1778364480403.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <div aria-hidden className="fixed inset-0 -z-50 overflow-hidden">
          <div className="absolute inset-[-8%] bg-cover bg-center bg-no-repeat animate-city-pan will-change-transform" style={{ backgroundImage: `url(${stockholmBg})` }} />
        </div>
        <div aria-hidden className="fixed inset-0 -z-45 bg-[linear-gradient(180deg,rgba(8,14,28,0.65),rgba(4,8,18,0.85))]" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-35">
          <span className="absolute top-[22%] left-[18%] h-1 w-1 rounded-full bg-sky-200 shadow-[0_0_8px_2px_rgba(186,230,253,0.7)] animate-twinkle" style={{ animationDelay: "0s" }} />
          <span className="absolute top-[28%] left-[42%] h-[3px] w-[3px] rounded-full bg-slate-100 shadow-[0_0_10px_3px_rgba(241,245,249,0.6)] animate-twinkle" style={{ animationDelay: "0.8s" }} />
          <span className="absolute top-[35%] left-[68%] h-1 w-1 rounded-full bg-sky-300 shadow-[0_0_8px_2px_rgba(125,211,252,0.7)] animate-twinkle" style={{ animationDelay: "1.6s" }} />
          <span className="absolute top-[44%] left-[12%] h-[2px] w-[2px] rounded-full bg-blue-200 shadow-[0_0_6px_2px_rgba(191,219,254,0.7)] animate-twinkle" style={{ animationDelay: "2.2s" }} />
          <span className="absolute top-[50%] left-[55%] h-1 w-1 rounded-full bg-slate-200 shadow-[0_0_10px_3px_rgba(226,232,240,0.6)] animate-twinkle" style={{ animationDelay: "1.1s" }} />
          <span className="absolute top-[58%] left-[80%] h-[3px] w-[3px] rounded-full bg-sky-100 shadow-[0_0_10px_3px_rgba(224,242,254,0.7)] animate-twinkle" style={{ animationDelay: "0.4s" }} />
          <span className="absolute top-[40%] left-[90%] h-1 w-1 rounded-full bg-blue-100 shadow-[0_0_8px_2px_rgba(219,234,254,0.7)] animate-twinkle" style={{ animationDelay: "2.8s" }} />
          <span className="absolute top-[33%] left-[5%] h-[2px] w-[2px] rounded-full bg-sky-200 shadow-[0_0_6px_2px_rgba(186,230,253,0.7)] animate-twinkle" style={{ animationDelay: "3.2s" }} />
        </div>
        <div aria-hidden className="fixed inset-0 -z-40 bg-[linear-gradient(180deg,rgba(4,6,12,0.6),rgba(4,6,12,0.85))]" />
        <div aria-hidden className="fixed inset-0 -z-30 bg-[radial-gradient(ellipse_60%_45%_at_50%_15%,oklch(0.6_0.18_240_/_0.32),transparent_70%),radial-gradient(ellipse_55%_40%_at_20%_80%,oklch(0.55_0.16_220_/_0.26),transparent_70%),radial-gradient(ellipse_55%_40%_at_80%_70%,oklch(0.5_0.14_260_/_0.22),transparent_70%)]" />
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
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
