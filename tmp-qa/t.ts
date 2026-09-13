import { composeDesignSpec } from "../src/lib/design/compose";
const app = {
  reference: "ORD-3M8NUN", company: "Premium Cars",
  description: "Vi hyr ut lyxbilar och premiumbilar till privatpersoner och företag. Biluthyrning med exklusiva bilar.",
  website_type: "Företagssida", colors: "rött, svart",
  extra_requests: "Lyxig design, stadsljus i bakgrunden, två bilar som blickfång, mörk nattkänsla, röd accentfärg",
  file_names: ["ORD-3M8NUN/Skärmavbild 2026-09-13 kl. 22.12.34.png","ORD-3M8NUN/vercel-dashboard.png","ORD-3M8NUN/bil-front.jpg","ORD-3M8NUN/bil-natt.jpg"],
  email:"a@b.se", phone:"070", address:"Göteborg",
};
for (const rev of [1,2,3]) {
  const s = composeDesignSpec(app as any, { revision: rev });
  console.log(rev, s.industry, s.family, s.palette.mode, s.palette.primary, s.variant, JSON.stringify(s.engine));
  if (rev===1) console.log(s.brand.heroTitle, "|", s.brand.tagline, "|", s.brand.ctaPrimary, "| qa", s.qa?.status, s.qa?.score, s.qa?.checks.filter(c=>c.level!=="pass").map(c=>c.id).join(","));
}
const s2 = composeDesignSpec(app as any, { revision: 2 });
console.log("deterministic:", s2.variant === composeDesignSpec(app as any,{revision:2}).variant);
