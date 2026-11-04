/** Lovable Build-with-URL adapter. This is a HUMAN-INITIATED fallback, not an unattended API. */
export type BuildHandoff = {
  provider: 'lovable'
  mode: 'manual_confirmation_required'
  status: 'awaiting_operator'
  url: string
  reference: string
}

/** Never place private customer contact details or secrets into a shareable URL. */
export function createLovableHandoff(reference: string, publicBrief: string): BuildHandoff {
  if (!/^ORD-[A-Z0-9]{4,20}$/.test(reference)) throw new Error('Invalid order reference')
  if (!publicBrief.trim() || publicBrief.length > 12000) throw new Error('Public brief must be 1–12000 characters')
  const url = 'https://lovable.dev/#prompt=' + encodeURIComponent(publicBrief)
  return { provider: 'lovable', mode: 'manual_confirmation_required', status: 'awaiting_operator', url, reference }
}

export type BuildState = 'brief_ready' | 'awaiting_operator' | 'building' | 'import_pending' | 'qa_pending' | 'ready_for_preview' | 'customer_approved' | 'published' | 'failed'
export const ALLOWED_BUILD_TRANSITIONS: Record<BuildState, readonly BuildState[]> = {
  brief_ready: ['awaiting_operator', 'failed'],
  awaiting_operator: ['building', 'failed'],
  building: ['import_pending', 'failed'],
  import_pending: ['qa_pending', 'failed'],
  qa_pending: ['ready_for_preview', 'failed'],
  ready_for_preview: ['customer_approved', 'failed'],
  customer_approved: ['published', 'failed'],
  published: [],
  failed: ['brief_ready'],
}
export function canAdvanceBuild(from: BuildState, to: BuildState): boolean {
  return ALLOWED_BUILD_TRANSITIONS[from].includes(to)
}
