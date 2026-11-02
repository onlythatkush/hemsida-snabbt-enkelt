import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { DwpPage } from "@/lib/dwp-library/components";
import { siteById } from "@/lib/dwp-library/templates";
import "@/lib/dwp-library/styles.css";
export const Route = createFileRoute("/design-test/$id")({loader:({params})=>{const site=siteById(params.id);if(!site)throw notFound();return site;},component:Demo});
function Demo(){const site=Route.useLoaderData();return <><div className="sticky top-0 z-50 flex items-center justify-between bg-slate-900 px-4 py-2 text-sm text-white"><Link to="/design-test" className="underline">← Alla 20 designer</Link><span>TEST · {site.industry}</span></div><DwpPage site={site}/></>}
