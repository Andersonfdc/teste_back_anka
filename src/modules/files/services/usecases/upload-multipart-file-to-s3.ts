import type { FastifyRequest } from "fastify";
import { S3BucketService } from "../s3-bucket.service";
import { mapFileToS3Path } from "@/core/providers/aws-s3/mappers";
import {
  readStreamToBase64,
  parseFilenameParts,
  isAllowedExtension,
  extractArrayIndexFromField,
} from "@/core/utils/file";
import { AppError } from "@/core/errors/app-error";
import {
  FileTooLargeError,
  MultipartRequiredError,
  UnsupportedFileTypeError,
} from "@/modules/files/errors/file-upload.errors";

export type UploadMultipartFileToS3UseCaseInput = {
  request: FastifyRequest;
};

export type UploadedFormItemFile = {
  filename: string;
  fileExtension: string;
  fileKey: string;
};
export type UploadedFormItemEntry = {
  itemId: number;
  files: Array<UploadedFormItemFile>;
};

export type UploadMultipartFileToS3UseCaseOutput = {
  items: Array<UploadedFormItemEntry>;
};

export class UploadMultipartFileToS3UseCase {
  private readonly MAX_FILE_BYTES = 50 * 1024 * 1024; // must align with multipart limits
  constructor(private readonly s3BucketService: S3BucketService) {}

  async execute(
    input: UploadMultipartFileToS3UseCaseInput,
  ): Promise<UploadMultipartFileToS3UseCaseOutput> {
    const { request } = input;

    if (!request.isMultipart()) {
      throw new MultipartRequiredError();
    }

    const parts = request.parts();

    const formItemsMap = new Map<number, UploadedFormItemEntry>();
    const maxFileBytes = this.MAX_FILE_BYTES;

    for await (const part of parts) {
      if (part.type === "file") {
        const requestItemId = extractArrayIndexFromField(
          part.fieldname,
          "files",
        );
        if (requestItemId === null) {
          // Drain unexpected file streams to move on
          for await (const _ of part.file) {
          }
          continue;
        }

        const { name, ext } = parseFilenameParts(part.filename || "file");
        if (!isAllowedExtension(ext)) {
          try {
            for await (const _ of part.file) {
            }
          } catch {}
          throw new UnsupportedFileTypeError(ext);
        }

        try {
          const { base64 } = await readStreamToBase64(part.file, maxFileBytes);
          const body = Buffer.from(base64, "base64");
          const fileKey = mapFileToS3Path({
            file: { filename: name, fileExtension: ext },
            basePrefix: "",
          });
          const contentType = (part as any).mimetype as string | undefined;
          await this.s3BucketService.uploadFile({ body, fileKey, contentType });

          const entry = formItemsMap.get(requestItemId) ?? {
            itemId: requestItemId,
            files: [],
          };
          entry.files.push({ filename: name, fileExtension: ext, fileKey });
          formItemsMap.set(requestItemId, entry);
        } catch (err: any) {
          if (err && err.message === "PAYLOAD_TOO_LARGE") {
            throw new FileTooLargeError(maxFileBytes);
          }
          throw err;
        }
      }
    }

    const items = Array.from(formItemsMap.values());
    if (items.length === 0) {
      throw new AppError("Nenhuma alteração enviada", 400, "NO_CHANGES");
    }

    return { items };
  }
}
