import { env } from "@/env";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type UploadFileRequest = {
  body: Buffer;
  fileKey: string;
  contentType?: string;
};

export class S3BucketService {
  private readonly bucketName = env.AWS_S3_BUCKET;

  constructor(private readonly s3Client: S3Client) {}

  public async uploadFile(request: UploadFileRequest): Promise<string> {
    const { body, fileKey, contentType } = request;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
    return fileKey;
  }
}
