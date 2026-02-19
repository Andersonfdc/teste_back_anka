import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Buffer } from "buffer";
import crypto from "crypto";
import { Readable, Transform, TransformCallback } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { env } from "@/env";
import { s3 } from "@/core/lib/aws/client";
import {
  GetAllFilesInPathResponse,
  InsertBase64FileInBucketParams,
  InsertFilesInBucketParams,
  InsertStreamInBucketParams,
} from "./types";

export default class AwsS3BucketProvider {
  private readonly bucketName: string;
  private s3Client: S3Client;

  constructor() {
    this.bucketName = env.AWS_S3_BUCKET;
    this.s3Client = s3;
  }

  public async insertFilesInBucket(
    downloadedFiles: InsertFilesInBucketParams[],
  ): Promise<void> {
    try {
      if (downloadedFiles.length === 0) {
        return;
      }

      // Create an array of upload promises to execute in parallel
      const uploadPromises = downloadedFiles.map((file) => {
        const contentType = this.getContentTypeFromExtension(
          file.fileExtension,
        );

        const params = {
          Bucket: this.bucketName,
          Key: file.path,
          Body: file.buffer,
          ContentType: contentType,
        };

        const command = new PutObjectCommand(params);
        return this.s3Client.send(command);
      });

      // Execute all uploads in parallel
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error(`Failed to upload files to S3:`, error);
      throw new Error(`Failed to upload files to S3: ${error}`);
    }
  }

  public async insertBase64FileInBucket(
    downloadedFile: InsertBase64FileInBucketParams,
  ): Promise<void> {
    try {
      // Normalize potential data URI prefixes and convert base64 to raw bytes
      const normalized = downloadedFile.base64.replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(normalized, "base64");

      // Determine content type from file extension if provided, or from the path
      const fileExtension =
        downloadedFile.fileExtension ||
        downloadedFile.path.split(".").pop() ||
        "";
      const contentType = this.getContentTypeFromExtension(fileExtension);
      const contentMd5 = crypto
        .createHash("md5")
        .update(buffer)
        .digest("base64");

      const params = {
        Bucket: this.bucketName,
        Key: downloadedFile.path,
        Body: buffer, // Use buffer instead of base64 string
        ContentType: contentType,
        ContentLength: buffer.length,
        ContentMD5: contentMd5,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Failed to upload file to S3:`, error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  public async insertStreamInBucket(
    params: InsertStreamInBucketParams,
  ): Promise<{ sizeBytes: number }> {
    const { path, stream, contentType } = params;
    const startTime = Date.now();

    // Counting transform to measure uploaded size while streaming to S3
    let totalBytes = 0;
    const counting = new Transform({
      transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
        totalBytes += chunk.length;
        cb(null, chunk);
      },
    });

    try {
      const nodeStream = isWebReadableStream(stream)
        ? Readable.fromWeb(stream)
        : stream;
      const body = nodeStream.pipe(counting);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      });

      await this.s3Client.send(command);

      return { sizeBytes: totalBytes };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(
        `Failed to upload stream to S3 after ${totalTime}ms:`,
        error,
      );
      throw new Error(`Failed to upload stream to S3: ${error}`);
    }
  }

  public async getDownloadedFile(fileKey: string): Promise<Buffer> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
      };

      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);

      // Verify if the response body is a readable stream
      if (response.Body instanceof Readable) {
        const fileBuffer = await this.streamToBuffer(response.Body);
        return fileBuffer;
      } else {
        throw new Error("Unexpected response body format");
      }
    } catch (error) {
      console.error(`Failed to download file from S3:`, error);
      throw new Error(`Failed to download file from S3: ${error}`);
    }
  }

  public async listPaths(prefix: string): Promise<string[]> {
    try {
      const params = { Bucket: this.bucketName, Prefix: prefix };
      const command = new ListObjectsV2Command(params);
      const resp = await this.s3Client.send(command);

      return (resp.Contents ?? [])
        .map(
          (obj) =>
            obj.Key!.replace(prefix, "").split("/", 3).slice(0, 3).join("/") +
            "/",
        )
        .filter(Boolean);
    } catch (error) {
      console.error(`Failed to list paths from S3:`, error);
      throw new Error(`Failed to list paths from S3: ${error}`);
    }
  }

  public async deleteFile(fileKey: string): Promise<void> {
    try {
      const params = { Bucket: this.bucketName, Key: fileKey };
      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Failed to delete file from S3:`, error);
      throw new Error(`Failed to delete file from S3: ${error}`);
    }
  }

  public async getAllFilesInPath(
    pathPrefix: string,
    filenamePrefix?: string,
  ): Promise<Array<GetAllFilesInPathResponse>> {
    try {
      // Make sure the path prefix ends with a trailing slash
      const prefix = pathPrefix.endsWith("/") ? pathPrefix : `${pathPrefix}/`;

      // List all objects with the given prefix
      const params = { Bucket: this.bucketName, Prefix: prefix };
      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      // Filter files by filename prefix if provided
      let filteredContents = response.Contents;
      if (filenamePrefix) {
        filteredContents = response.Contents.filter((object) => {
          if (!object.Key) return false;
          const filename = object.Key.split("/").pop() || "";
          return filename.startsWith(filenamePrefix);
        });
      }

      if (filteredContents.length === 0) {
        return [];
      }

      // Create download promises for each file
      const downloadPromises = filteredContents.map(async (object) => {
        if (!object.Key) return null;

        try {
          const fileBuffer = await this.getDownloadedFile(object.Key);
          const filename = object.Key.split("/").pop() || object.Key;

          return {
            filename,
            content: fileBuffer,
            key: object.Key,
          };
        } catch (error) {
          console.error(`Failed to download file ${object.Key}:`, error);
          return null;
        }
      });

      // Execute all downloads in parallel and filter out null results
      const downloadResults = await Promise.all(downloadPromises);
      const successfulDownloads = downloadResults.filter(
        (
          result,
        ): result is { filename: string; content: Buffer; key: string } =>
          result !== null,
      );

      return successfulDownloads;
    } catch (error) {
      console.error(`Failed to get all files in path:`, error);
      throw new Error(`Failed to get all files in path: ${error}`);
    }
  }

  // Fetch only the list of keys under a prefix without downloading contents
  public async listAllKeysInPath(pathPrefix: string): Promise<string[]> {
    try {
      const prefix = pathPrefix.endsWith("/") ? pathPrefix : `${pathPrefix}/`;
      const params = { Bucket: this.bucketName, Prefix: prefix } as const;
      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);
      return (response.Contents ?? []).map((o) => o.Key!).filter(Boolean);
    } catch (error) {
      console.error(`Failed to list keys from S3:`, error);
      throw new Error(`Failed to list keys from S3: ${error}`);
    }
  }

  // Stream a file from S3 as a Node readable stream
  public async getFileStream(fileKey: string): Promise<Readable> {
    try {
      const params = { Bucket: this.bucketName, Key: fileKey };
      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);
      if (!(response.Body instanceof Readable)) {
        const maybeWeb = response.Body as unknown as
          | WebReadableStream
          | undefined;
        if (maybeWeb && typeof (maybeWeb as any).getReader === "function") {
          // Cast to WebReadableStream to satisfy typings
          return Readable.fromWeb(maybeWeb);
        }
        throw new Error("Unexpected response body stream type");
      }
      return response.Body;
    } catch (error) {
      console.error(`Failed to stream file from S3:`, error);
      throw new Error(`Failed to stream file from S3: ${error}`);
    }
  }

  public async deleteAllInPath(pathPrefix: string): Promise<void> {
    try {
      // Make sure the path prefix ends with a trailing slash
      const prefix = pathPrefix.endsWith("/") ? pathPrefix : `${pathPrefix}/`;

      // List all objects with the given prefix
      const params = { Bucket: this.bucketName, Prefix: prefix };
      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        return;
      }

      // Create delete promises for each object
      const deletePromises = response.Contents.map((object) => {
        const deleteParams = {
          Bucket: this.bucketName,
          Key: object.Key,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        return this.s3Client.send(deleteCommand);
      });

      // Execute all deletions in parallel
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Failed to delete files in path:`, error);
      throw new Error(`Failed to delete files in path: ${error}`);
    }
  }

  private getContentTypeFromExtension(fileExtension: string): string {
    const ext = fileExtension.toLowerCase();
    switch (ext) {
      case "pdf":
        return "application/pdf";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "xls":
        return "application/vnd.ms-excel";
      case "csv":
        return "text/csv";
      case "zip":
        return "application/zip";
      default:
        return "application/octet-stream";
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      stream.on("end", () => {
        resolve(Buffer.concat(chunks as Uint8Array[]));
      });
      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
  }
}

function isWebReadableStream(stream: unknown): stream is WebReadableStream {
  return !!stream && typeof (stream as any).getReader === "function";
}
