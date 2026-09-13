import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { composeDesignSpec } from "../src/lib/design/compose";
import { PreviewRenderer } from "../src/components/preview/PreviewRenderer";

const spec = composeDesignSpec({
  reference: "ORD-PREMIUMCARS",
  company: "Premium Cars",
  description: "Vi hyr ut lyxbilar och premiumbilar till privatpersoner och företag i Stockholm. Exklusiv och modern känsla.",
  website_type: "Biluthyrning",
  colors: "rött, svart",
  extra_requests: "Lyxig design med stadsljus och två bilar i bakgrunden på förstasidan. Mörk stil.",
  file_names: [],
});
console.log(JSON.stringify({ family: spec.family, mode: spec.palette.mode, primary: spec.palette.primary, stockSet: spec.stockSet, art: spec.art, qa: spec.qa?.status, checks: spec.qa?.checks.filter(c=>c.level!=="pass") }, null, 2));
const html = renderToStaticMarkup(React.createElement(PreviewRenderer, { spec }));
await Bun.write("/tmp/browser/dwp/out.html", `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style>${html}`);
