/** Structured, machine-applicable interpretation of a customer's reply. */
export type RevisionDirectives = {
  /** Colours the customer explicitly wants added/increased. */
  addColors: string[];
  /** Colours the customer explicitly wants kept. */
  keepColors: string[];
  /** Colours the customer explicitly wants removed. */
  removeColors: string[];
  /** Relative change to the heading scale, e.g. -0.1 for "mindre rubrik". */
  headingScale: number;
  /** Explicit light/dark wish. */
  mode?: "dark" | "light";
  /** Section ids the customer asked to remove. */
  dropSections: string[];
  /** Customer asked for more imagery. */
  moreImages: boolean;
  /** Human readable, sanitised summary shown in admin only. */
  summary: string[];
  /** True when nothing actionable could be extracted. */
  unparsed: boolean;
};

export const EMPTY_DIRECTIVES: RevisionDirectives = {
  addColors: [],
  keepColors: [],
  removeColors: [],
  headingScale: 0,
  dropSections: [],
  moreImages: false,
  summary: [],
  unparsed: true,
};

/** Minimal shape of an inbound email, provider agnostic. */
export type InboundEmail = {
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[] | null;
  to?: string[] | null;
  cc?: string[] | null;
  from?: string | null;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
};
