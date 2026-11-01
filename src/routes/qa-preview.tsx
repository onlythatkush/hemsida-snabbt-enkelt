import { createFileRoute } from "@tanstack/react-router";
import { PreviewRenderer } from "@/components/preview/PreviewRenderer";
import { composeDesignSpec } from "@/lib/design/compose";

export const Route = createFileRoute("/qa-preview")({
  head: () => ({ meta: [
    { title: "Designkontroll — Din Webbpartner" },
    { name: "description", content: "Intern kontroll av Din Webbpartners designmotor." },
    { property: "og:title", content: "Designkontroll — Din Webbpartner" },
    { property: "og:description", content: "Intern kvalitetskontroll av genererade webbplatser." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => (
    <PreviewRenderer
      spec={composeDesignSpec({
        reference: "ORD-PREMIUMCARS",
        company: "Premium Cars",
        description:
          "Vi hyr ut lyxbilar och premiumbilar till privatpersoner och företag i Stockholm. Exklusiv och modern känsla.",
        website_type: "Biluthyrning",
        colors: "rött, svart",
        extra_requests: "Lyxig design med stadsljus och två bilar i bakgrunden på förstasidan. Mörk stil.",
        file_names: [],
      })}
    />
  ),
});
