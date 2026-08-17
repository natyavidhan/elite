/** crypto.randomUUID() requires a secure context (HTTPS, or the literal
 * host "localhost") — it's simply absent on a plain-HTTP LAN deployment
 * like `http://192.168.1.x:8080`, which is exactly how this app's Docker
 * image is meant to be reached. crypto.getRandomValues() has no such
 * restriction, so build a v4 UUID from it directly instead. */
export function generateUuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
