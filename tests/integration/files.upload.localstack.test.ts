import { describe, it, expect } from "vitest";
import AwsS3BucketProvider from "@/core/providers/aws-s3";

describe("S3 upload (integration - Localstack)", () => {
  it("uploads a .txt file and verifies it exists via listing", async () => {
    const provider = new AwsS3BucketProvider();
    const testContent = "Hello from integration test!";
    const filename = `test-${Date.now()}.txt`;
    const path = `test/${filename}`;

    // Upload the file using the provider
    await provider.insertBase64FileInBucket({
      path,
      base64: Buffer.from(testContent).toString("base64"),
      fileExtension: "txt",
    });

    // List all keys in the test prefix and verify our file exists
    const keys = await provider.listAllKeysInPath("test/");
    const found = keys.some((key) => key === path);
    expect(found).toBe(true);

    // Download the file and verify content
    const downloadedContent = await provider.getDownloadedFile(path);
    expect(downloadedContent.toString()).toBe(testContent);

    // Clean up
    await provider.deleteFile(path);
  });
});
