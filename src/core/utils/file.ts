export async function readStreamToBase64(
  stream: NodeJS.ReadableStream,
  maxBytes: number,
) {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(buf);
  }
  const buffer = Buffer.concat(chunks);
  return { base64: buffer.toString("base64"), size: buffer.length };
}

export type AllowedExtension =
  | "pdf"
  | "png"
  | "jpg"
  | "jpeg"
  | "xlsx"
  | "xls"
  | "csv";

export const allowedExtensions: ReadonlySet<AllowedExtension> = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "xlsx",
  "xls",
  "csv",
]);

export function parseFilenameParts(originalName: string) {
  const safeName = (originalName || "file").trim();
  const segments = safeName.split(".");
  const ext = (segments.length > 1 ? segments.pop() : "") || "";
  const name = segments.join(".") || "file";
  return { name, ext: ext.toLowerCase() };
}

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return allowedExtensions.has(ext as AllowedExtension);
}

export function extractArrayIndexFromField(
  fieldName: string,
  base: string,
): number | null {
  // Prefer algorithmic parsing over regex to avoid ReDoS
  if (!fieldName || !base) return null;
  if (fieldName.length > 128 || base.length > 64) return null; // length guard
  if (!fieldName.startsWith(base)) return null;
  const openBracketIndex = base.length;
  if (fieldName[openBracketIndex] !== "[") return null;
  if (fieldName[fieldName.length - 1] !== "]") return null;
  const inner = fieldName.slice(openBracketIndex + 1, -1);
  if (inner.length < 1 || inner.length > 9) return null; // bounded
  // Ensure all chars are digits without regex
  for (let i = 0; i < inner.length; i++) {
    const code = inner.charCodeAt(i);
    if (code < 48 || code > 57) return null;
  }
  const index = Number(inner);
  return Number.isFinite(index) ? index : null;
}

export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
