/**
 * Build a WhatsApp deep link (wa.me). Pure + testable. V1 WhatsApp is deep-link
 * only — no API, no cost (see CLAUDE.md §6). The number is reduced to digits;
 * the message is URL-encoded.
 */
export function buildWaLink(rawNumber: string, message: string): string {
  const digits = (rawNumber ?? "").replace(/\D/g, "");
  const text = encodeURIComponent(message ?? "");
  return `https://wa.me/${digits}?text=${text}`;
}
