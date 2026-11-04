/** The order form sends the order number in `source`, e.g. "Ny projektansökan (ORD-ABC123)". */
export function referenceFromSource(source: string | undefined, fallbackId: string): string {
  const match = /ORD-[A-Z0-9]{4,12}/i.exec(source || '')
  return match ? match[0].toUpperCase() : `KONTAKT-${fallbackId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}
