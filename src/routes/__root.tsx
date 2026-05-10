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
<div aria-hidden className="fixed inset-0 -z-50 bg-[url('https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&w=2400&q=80')] bg-cover bg-center bg-no-repeat" style={{ backgroundAttachment: "fixed" }} />
        <div aria-hidden className="fixed inset-0 -z-45 bg-black/50" />
        <div aria-hidden className="fixed inset-0 -z-40 bg-[linear-gradient(180deg,rgba(4,6,12,0.6),rgba(4,6,12,0.85))]" />
        <div aria-hidden className="fixed inset-0 -z-30 bg-[radial-gradient(ellipse_60%_45%_at_50%_15%,oklch(0.55_0.18_280_/_0.28),transparent_70%),radial-gradient(ellipse_55%_40%_at_20%_80%,oklch(0.65_0.2_30_/_0.22),transparent_70%),radial-gradient(ellipse_55%_40%_at_80%_70%,oklch(0.6_0.18_260_/_0.22),transparent_70%)]" />
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
