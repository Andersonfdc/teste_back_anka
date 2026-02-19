import { describe, it, expect, vi } from "vitest";
import { UploadMultipartFileToS3UseCase } from "@/modules/files/services/usecases/upload-multipart-file-to-s3";
import { S3BucketService } from "@/modules/files/services/s3-bucket.service";

describe("UploadMultipartFileToS3UseCase (unit)", () => {
  it("throws when request is not multipart", async () => {
    const s3Service = { uploadFile: vi.fn() } as unknown as S3BucketService;
    const uc = new UploadMultipartFileToS3UseCase(s3Service);
    const request = {
      isMultipart: () => false,
    } as any;

    await expect(uc.execute({ request })).rejects.toBeDefined();
  });
});
