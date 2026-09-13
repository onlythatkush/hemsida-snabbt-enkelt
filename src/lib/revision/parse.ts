import { extractColors } from "@/lib/design/color";
import { EMPTY_DIRECTIVES, type RevisionDirectives } from "./types";

/**
 * Turns a Swedish natural-language reply into concrete design directives.
 *
 * The raw text is NEVER shown on the public preview — it only steers
 * generation. Everything that cannot be interpreted is kept as an admin-only
 * note so a human can act on it.
 */

const KEEP_WORDS = ["behåll", "behålla", "ha kvar", "ha kvar", "samma", "oförändrad", "gärna kvar"];
const ADD_WORDS = ["lägg till", "mer ", "mera ", "inslag av", "gärna mer", "öka", "komplettera med", "mixa in"];
const REMOVE_WORDS = ["ta bort", "mindre av", "slopa", "utan ", "inte ha", "skippa"];

const SECTION_WORDS: { id: string; words: string[] }[] = [
  { id: "gallery", words: ["galleri", "galleriet", "bildgalleri"] },
  { id: "process", words: ["processen", "så går det till", "stegen"] },
  { id: "why", words: ["varför oss", "fördelar"] },
  { id: "local", words: ["lokalt", "lokalsektionen"] },
  { id: "highlight", words: ["highlight", "mellansektionen"] },
];

function clauses(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/[.;\n!?]+|,| men | och | samt /gi)
    .map((c) => c.trim())
    .filter(Boolean);
}

function has(clause: string, words: string[]) {
  return words.some((w) => clause.includes(w));
}

export function parseRevisionRequest(raw: string | null | undefined): RevisionDirectives {
  const text = (raw || "").toLowerCase().trim();
  if (!text) return { ...EMPTY_DIRECTIVES };

  const directives: RevisionDirectives = {
    addColors: [],
    keepColors: [],
    removeColors: [],
    headingScale: 0,
    dropSections: [],
    moreImages: false,
    summary: [],
    unparsed: true,
  };

  for (const clause of clauses(text)) {
    const colors = extractColors(clause);
    if (colors.length) {
      if (has(clause, KEEP_WORDS)) {
        directives.keepColors.push(...colors);
        directives.summary.push(`Behåll färger: ${colors.join(", ")}`);
      } else if (has(clause, REMOVE_WORDS)) {
        directives.removeColors.push(...colors);
        directives.summary.push(`Ta bort färger: ${colors.join(", ")}`);
      } else if (has(clause, ADD_WORDS) || /\bmer\b|\bmera\b/.test(clause)) {
        directives.addColors.push(...colors);
        directives.summary.push(`Mer av färger: ${colors.join(", ")}`);
      } else {
        directives.addColors.push(...colors);
        directives.summary.push(`Färgönskemål: ${colors.join(", ")}`);
      }
    }

    if (/rubrik|titel|heading/.test(clause) || /text(en)?\b/.test(clause)) {
      if (/mindre|minska|mindre stor|ner i storlek/.test(clause)) {
        directives.headingScale -= 0.1;
        directives.summary.push("Mindre rubriker");
      } else if (/större|öka storlek|stora rubriker/.test(clause)) {
        directives.headingScale += 0.1;
        directives.summary.push("Större rubriker");
      }
    }

    if (/mörkare|mörkt tema|dark mode|svart bakgrund/.test(clause)) {
      directives.mode = "dark";
      directives.summary.push("Mörkare uttryck");
    } else if (/ljusare|ljust tema|vit bakgrund|luftigare/.test(clause)) {
      directives.mode = "light";
      directives.summary.push("Ljusare uttryck");
    }

    if (/fler bilder|mer bilder|större bilder|mer bildyta/.test(clause)) {
      directives.moreImages = true;
      directives.summary.push("Mer bildyta");
    }

    if (has(clause, REMOVE_WORDS)) {
      for (const section of SECTION_WORDS) {
        if (has(clause, section.words)) {
          directives.dropSections.push(section.id);
          directives.summary.push(`Ta bort sektion: ${section.id}`);
        }
      }
    }
  }

  directives.addColors = unique(directives.addColors);
  directives.keepColors = unique(directives.keepColors);
  directives.removeColors = unique(directives.removeColors);
  directives.dropSections = unique(directives.dropSections);
  directives.summary = unique(directives.summary);
  directives.unparsed =
    !directives.summary.length &&
    !directives.addColors.length &&
    !directives.keepColors.length &&
    !directives.dropSections.length;

  return directives;
}

function unique(list: string[]) {
  return Array.from(new Set(list));
}

/** Strips quoted history and signatures so only the new customer text is stored. */
export function cleanReplyText(raw: string | null | undefined): string {
  if (!raw) return "";
  const lines = raw.replace(/\r/g, "").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (/^>/.test(line.trim())) break;
    if (/^(den|on|from:|skrivet av|-{2,}\s*$)/i.test(line.trim()) && kept.length) break;
    kept.push(line);
  }
  return kept.join("\n").trim().slice(0, 8000);
}
