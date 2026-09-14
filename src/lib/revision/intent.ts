/**
 * Conservative classification of a customer's reply to a design email.
 *
 * Safety rule: an approval is only ever declared when the customer says so
 * clearly and asks for nothing else. Anything ambiguous becomes "unclear" and
 * is queued for a human — never treated as an approval.
 */

export type ReplyIntent = "approved" | "changes" | "unclear";

export type IntentResult = {
  intent: ReplyIntent;
  /** Short Swedish explanation for the admin panel. */
  reason: string;
  /** Phrases that triggered the classification. */
  signals: string[];
};

const APPROVAL_PHRASES = [
  "godkänner",
  "godkänt",
  "godkänd",
  "jag godkänner",
  "vi godkänner",
  "ser jättebra ut",
  "ser jätte bra ut",
  "ser bra ut",
  "ser perfekt ut",
  "helt nöjd",
  "mycket nöjd",
  "jag är nöjd",
  "vi är nöjda",
  "perfekt som den är",
  "bra som det är",
  "kör på den",
  "kör på det",
  "kör vidare",
  "inga ändringar",
  "ingen ändring",
  "inget att ändra",
  "klart för mig",
  "det är klart",
  "go for it",
  "looks great",
];

const CHANGE_PHRASES = [
  "ändra",
  "ändring",
  "ändringar",
  "byt",
  "byta",
  "ta bort",
  "lägg till",
  "lägga till",
  "mindre",
  "större",
  "flytta",
  "justera",
  "korrigera",
  "fel",
  "saknas",
  "annan färg",
  "annan bild",
  "mörkare",
  "ljusare",
  "vill ha",
  "önskar",
  "gärna",
  "kan ni",
  "skulle vilja",
  "istället",
  "i stället",
  "uppdatera",
  "rubriken",
  "texten",
  "bilden",
  "bilderna",
  "logga",
  "logotyp",
];

/** Phrases that explicitly say no change is wanted. */
const NEGATED_CHANGE_PHRASES = [
  "inga ändringar",
  "ingen ändring",
  "inget att ändra",
  "inget som behöver ändras",
  "behöver inte ändras",
];

/** Negations that cancel a would-be approval, e.g. "ser bra ut men ändra ...". */
const APPROVAL_BLOCKERS = [" men ", " dock ", " förutom ", " fast ", "en sak", "ett önskemål"];

function normalise(raw: string) {
  return ` ${(raw || "").toLowerCase().replace(/\s+/g, " ").trim()} `;
}

export function classifyReply(raw: string | null | undefined): IntentResult {
  const text = normalise(raw || "");
  const stripped = text.trim();
  if (!stripped) {
    return { intent: "unclear", reason: "Tomt svar", signals: [] };
  }

  const approvals = APPROVAL_PHRASES.filter((p) => text.includes(p));
  // "inga ändringar" must not be read as a change request.
  const withoutNegations = NEGATED_CHANGE_PHRASES.reduce((acc, p) => acc.split(p).join(" "), text);
  const changes = CHANGE_PHRASES.filter((p) => withoutNegations.includes(p));
  const blockers = APPROVAL_BLOCKERS.filter((p) => text.includes(p));

  if (changes.length) {
    return {
      intent: "changes",
      reason: "Kunden ber om ändringar",
      signals: changes.slice(0, 5),
    };
  }

  if (approvals.length && !blockers.length) {
    return {
      intent: "approved",
      reason: "Tydligt godkännande utan reservationer",
      signals: approvals.slice(0, 5),
    };
  }

  if (approvals.length && blockers.length) {
    return {
      intent: "unclear",
      reason: "Positivt svar men med reservation – behöver granskas",
      signals: [...approvals.slice(0, 3), ...blockers.slice(0, 2)],
    };
  }

  return {
    intent: "unclear",
    reason: "Kunde inte tolkas säkert – behöver granskas manuellt",
    signals: [],
  };
}
