import { describe, it, expect } from "vitest";
import { createPasswordHash, verifyPassword } from "@/core/utils/security";
import dotenv from "dotenv";

dotenv.config();

describe("security utils", () => {
  it("hashes and verifies password correctly", async () => {
    const plain = "StrongP@ssw0rd!";
    const hash = await createPasswordHash(plain);

    expect(hash).toBeTypeOf("string");
    expect(hash).not.toEqual(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
