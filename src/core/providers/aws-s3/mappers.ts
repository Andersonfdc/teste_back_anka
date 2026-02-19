import {
  buildBasePrefix,
  joinPathSegments,
  sanitizeFilename,
  sanitizeExtension,
} from "./utils";

export interface FileParams {
  filename: string;
  fileExtension: string;
}

export interface MapFileToS3PathParams {
  file: FileParams;
  basePrefix: string;
}

// Main helper to build the full object key including the final filename
// Overwrite behavior is achieved by using the same key (no versioning in the path)
export function mapFileToS3Path({
  file: { filename, fileExtension },
  basePrefix,
}: MapFileToS3PathParams): string {
  const safeFilename = sanitizeFilename(filename);
  const safeFileExtension = sanitizeExtension(fileExtension);
  const prefix = buildBasePrefix();
  return joinPathSegments(prefix, `${safeFilename}.${safeFileExtension}`);
}
