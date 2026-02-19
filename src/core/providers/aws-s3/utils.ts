import { env } from "@/env";

export function joinPathSegments(
  ...segments: Array<string | number | undefined | null>
): string {
  return segments
    .filter(
      (seg) => seg !== undefined && seg !== null && String(seg).length > 0,
    )
    .map((seg) => String(seg).replace(/^\/+|\/+$/g, ""))
    .join("/");
}

export function sanitizeExtension(fileExtension: string): string {
  const cleaned = fileExtension
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return cleaned.length > 0 ? cleaned : "bin";
}

export function sanitizeFilename(filename: string): string {
  const withoutDiacritics = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const trimmed = withoutDiacritics.trim().toLowerCase();
  const replaced = trimmed.replace(/\s+/g, "-");
  const cleaned = replaced.replace(/[^a-z0-9._-]/g, "");
  return cleaned.length > 0 ? cleaned : "file";
}

export function buildBasePrefix(): string {
  return joinPathSegments(env.NODE_ENV, "files");
}
