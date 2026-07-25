/**
 * SHA-256 over the decoded frame bytes, computed at capture time. The report
 * prints the first 16 hex characters, labeled as truncated.
 *
 * crypto.subtle needs a secure context. localhost qualifies, and so does the
 * cloudflared tunnel; plain http on a LAN IP does not, which is why the tunnel
 * matters for anything that hashes on the phone.
 */

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Decode a data URI's base64 payload to bytes. */
export function dataUriToBytes(dataUri: string): Uint8Array {
  const comma = dataUri.indexOf(',');
  const b64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return 'unavailable';
  const view = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', view.buffer as ArrayBuffer);
  return toHex(digest);
}

export async function sha256OfDataUri(dataUri: string): Promise<string> {
  try {
    return await sha256Hex(dataUriToBytes(dataUri));
  } catch {
    return 'unavailable';
  }
}

export async function sha256OfText(text: string): Promise<string> {
  try {
    return await sha256Hex(new TextEncoder().encode(text));
  } catch {
    return 'unavailable';
  }
}

/** First 16 hex chars, the form printed in the report. */
export function truncateHash(hex: string): string {
  return hex === 'unavailable' ? hex : hex.slice(0, 16);
}
