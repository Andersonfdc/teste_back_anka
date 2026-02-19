import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

export interface FileParams {
  filename: string;
  fileExtension: string;
}

export interface InsertFilesInBucketParams {
  path: string;
  buffer: Buffer;
  fileExtension: string;
}

export interface InsertBase64FileInBucketParams {
  path: string;
  base64: string;
  fileExtension?: string;
}

export interface InsertStreamInBucketParams {
  path: string;
  stream: Readable | WebReadableStream;
  contentType: string;
}

export interface GetAllFilesInPathResponse {
  filename: string;
  content: Buffer;
  key: string;
}
