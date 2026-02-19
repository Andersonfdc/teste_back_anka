import { env } from "@/env";
import { S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;
export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: env.AWS_S3_ENDPOINT,
      region: env.AWS_S3_REGION,
      forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
    });
  }
  return s3Client;
}

export const s3 = getS3Client();
