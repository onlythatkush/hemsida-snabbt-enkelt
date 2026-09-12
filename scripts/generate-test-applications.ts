/**
 * QA test battery for the design engine.
 * Generates 20 clearly marked [TEST] demo applications with design specs,
 * and prints SQL that can be applied to the database.
 * Run: bun scripts/generate-test-applications.ts > /tmp/test-apps.sql
 */
import { composeDesignSpec } from "../src/lib/design/compose";
import { TEST_CASES } from "../src/lib/design/test-cases";

export { TEST_CASES };


function esc(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return "NULL";
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function token(reference: string) {
  // Deterministic 64-char token so re-running the script keeps preview links stable.
  let out = "";
  let h = 2166136261;
  for (const chunk of [reference, reference + "#2", reference + "#3", reference + "#4"]) {
    h = 2166136261;
    for (let i = 0; i < chunk.length; i++) {
      h ^= chunk.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    out += (h >>> 0).toString(16).padStart(8, "0").repeat(2);
  }
  return out;
}

const origin = process.env.PREVIEW_ORIGIN || "https://dinwebbpartner.com";
const rows: string[] = [];
const summary: Array<Record<string, string>> = [];

for (const testCase of TEST_CASES) {
  const spec = composeDesignSpec(testCase);
  const tok = token(testCase.reference);
  const previewUrl = `${origin}/kund-preview/${encodeURIComponent(testCase.reference)}?token=${tok}`;
  summary.push({
    ref: testCase.reference,
    company: testCase.company,
    family: spec.family,
    industry: spec.industry,
    mode: spec.palette.mode,
    primary: spec.palette.primary,
    sections: String(spec.sections.length),
  });
  rows.push(`(
  ${esc(testCase.reference)}, ${esc(testCase.company)}, ${esc(testCase.email)}, ${esc(testCase.phone)},
  ${esc(testCase.company)}, ${esc(testCase.address)}, ${esc(testCase.description)}, ${esc(testCase.social_links)},
  ${esc(testCase.website_type)}, ${esc(testCase.colors)}, ${esc(testCase.extra_requests)}, false, '{}'::text[],
  'archived', ${esc(previewUrl)}, ${esc(tok)},
  ${process.env.SKIP_SPEC ? "NULL" : esc(JSON.stringify(spec)) + "::jsonb"}, ${esc(spec.family)}, false
)`);
}

const sql = `INSERT INTO public.project_applications
(reference, name, email, phone, company, address, description, social_links,
 website_type, colors, extra_requests, wants_support, file_names,
 status, preview_url, preview_token, design_spec, design_family, design_locked)
VALUES
${rows.join(",\n")}
ON CONFLICT DO NOTHING;`;

console.log(sql);
console.error(JSON.stringify(summary, null, 2));
