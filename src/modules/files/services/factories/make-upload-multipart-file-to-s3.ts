import { s3 } from "@/core/lib/aws/client";
import { S3BucketService } from "../s3-bucket.service";
import { UploadMultipartFileToS3UseCase } from "../usecases/upload-multipart-file-to-s3";

export async function makeUploadMultipartFileToS3() {
  const s3BucketService = new S3BucketService(s3);
  const uploadMultipartFileToS3UseCase = new UploadMultipartFileToS3UseCase(
    s3BucketService,
  );
  return uploadMultipartFileToS3UseCase;
}
