import { sites } from "@/lib/dwp-library/templates";
import type { Site } from "@/lib/dwp-library/types";
import type { ApplicationInput } from "./types";

const matches: Array<[RegExp,string]> = [
  [/rekond|bilvård|bilspa|detailing|lackskydd|polering|biltvätt/i,"bilrekond"],
  [/biluthyr|hyrbil|hyra bil|rental car/i,"biluthyrning"],
  [/bilverkstad|bilservice|mekaniker|däckverkstad/i,"bilverkstad"],
  [/elektriker|elinstallation|elfirma/i,"elektriker"],
  [/rörmokare|vvs|värmepump/i,"vvs"],
  [/taklägg|takfirma|takrenovering/i,"taklaggare"],
  [/måler|målare|måleri/i,"maleri"],
  [/flyttfirma|flytthjälp|flyttjänst/i,"flyttfirma"],
  [/städfirma|hemstäd|kontorsstäd|lokalvård|flyttstäd/i,"stadfirma"],
  [/frisör|barberare|hårsalong/i,"frisor"],
  [/skönhet|nagelsalong|hudvård|fransar/i,"skonhetssalong"],
  [/restaurang|pizzeria|bistro|sushi/i,"restaurang"],
  [/café|kafé|bageri|konditori/i,"cafe-bageri"],
  [/gym|personlig tränare|träningsstudio/i,"gym-pt"],
  [/fastighet|mäklare|hyresrätt/i,"fastighetsbolag"],
  [/åkeri|transportbolag|lastbilstransport/i,"akeri-transport"],
  [/telekom|telefonväxel|mobilabonnemang|it-support/i,"it-telekom"],
  [/webbshop|e-handel|nätbutik/i,"e-handel"],
  [/konsult|rådgivning|redovisning/i,"konsultforetag"],
  [/bygg|snickare|renovering|entreprenad/i,"byggfirma"],
];
export function matchLibraryTemplate(app: ApplicationInput): Site | undefined {
  const text=[app.website_type,app.company,app.description,app.extra_requests].filter(Boolean).join(" ");
  const id=matches.find(([re])=>re.test(text))?.[1];
  return id ? sites.find(s=>s.id===id) : undefined;
}
export function buildCustomerLibrarySite(app:ApplicationInput,revision:number):Site|undefined {
  const base=matchLibraryTemplate(app);
  if(!base) return undefined;
  const site:Site=structuredClone(base);
  site.id=app.reference;
  site.brand=app.company;
  site.hero.eyebrow=base.industry;
  site.hero.title=app.company;
  site.hero.lead=(app.description||base.hero.lead).slice(0,260);
  site.contact={...site.contact,heading:"Kontakta "+app.company,text:"Kontakta oss för att diskutera dina behov.",phone:app.phone||"",address:app.address||""};
  // The templates are demonstrations, not customer facts: never publish their fictional
  // testimonials, qualifications, case studies, prices or contact information as real.
  site.references=[];
  if(site.offer.kind==="quote") site.offer={kind:"quote",heading:"Begär en offert",projects:[],credentials:[]};
  if(site.offer.kind==="appointment") site.offer={kind:"appointment",heading:"Boka en tid",rows:[]};
  if(site.offer.kind==="package") site.offer={kind:"package",heading:"Våra tjänster",tiers:[]};
  if(site.offer.kind==="product") site.offer={kind:"product",heading:"Kontakta oss om sortimentet",items:[]};
  if(site.offer.kind==="property") site.offer={kind:"property",heading:"Kontakta oss om lediga objekt",listings:[]};
  // Explicitly preserve customer-provided colour while varying visual treatment by revision.
  const variants:Site["theme"][]=["noir","warm","blueprint","nordic","signal"];
  site.theme=revision<=1?base.theme:variants[(variants.indexOf(base.theme)+revision-1)%variants.length];
  site.accent=undefined;
  return site;
}
