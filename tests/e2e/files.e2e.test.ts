import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "@/app";
import prisma from "@/core/lib/prisma/client";
import { createPasswordHash } from "@/core/utils/security";
import FormData from "form-data";

describe("Files routes (e2e)", () => {
  const email = `e2e.${Date.now()}@example.com`;

  beforeAll(async () => {
    await app.ready();
    await prisma.user.deleteMany({ where: { email } });
    await prisma.user.create({
      data: {
        email,
        name: "E2E",
        role: "ADMIN",
        isActive: true,
        passwordHash: await createPasswordHash("StrongP@ssw0rd!"),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it("POST /files/forms/:formId/submit should return 401 without token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/files/forms/1/submit",
      headers: { "x-api-key": process.env.API_KEY! },
    });
    expect(res.statusCode).toBe(401);
  });
});
