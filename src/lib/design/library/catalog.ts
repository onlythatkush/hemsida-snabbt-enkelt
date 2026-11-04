/** Design library catalog. Only vetted, rights-cleared templates may be reused for customers. */
export type TemplateStatus = "candidate" | "approved" | "retired";
export type TemplateRecord = {
  id: string;
  category: string;
  tags: string[];
  status: TemplateStatus;
  source: { provider: "lovable" | "internal"; projectId?: string; sourceCommit?: string };
  version: number;
  brandNeutral: boolean;
  sourceImported: boolean;
  assetRightsReviewed: boolean;
  qualityReviewed: boolean;
  customerContentRemoved: boolean;
  notes: string;
};

/** Candidates must NOT be offered for automated customer delivery. */
export const DESIGN_LIBRARY: readonly TemplateRecord[] = [
  {
    id: "flytt-stad-modern-001",
    category: "flytt-stad",
    tags: ["flytt", "flyttstadning", "hemstadning", "karlskrona", "modern", "bilddriven", "gul-accent"],
    status: "candidate",
    source: { provider: "lovable", projectId: "7b974a6b-2781-4f1b-9847-d58ad76e6c2b", sourceCommit: "026ad86ec92fba8de104a7554ad786bbb5be2003" },
    version: 1,
    brandNeutral: false,
    sourceImported: false,
    assetRightsReviewed: false,
    qualityReviewed: false,
    customerContentRemoved: false,
    notes: "Order ORD-WUAKBW design experiment. User approved visual direction. Source and image assets are not yet imported; replace customer contact details, remove platform branding, review licenses and QA before approval.",
  },
];

export function approvedTemplates(category?: string): TemplateRecord[] {
  return DESIGN_LIBRARY.filter(t => t.status === "approved" && t.brandNeutral && t.sourceImported && t.assetRightsReviewed && t.qualityReviewed && t.customerContentRemoved && (!category || t.category === category));
}
