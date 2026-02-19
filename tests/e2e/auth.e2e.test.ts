import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { app } from "@/app";
import prisma from "@/core/lib/prisma/client";
import { createPasswordHash } from "@/core/utils/security";

describe("Auth routes (e2e)", () => {
  const email = `e2e.${Date.now()}@example.com`;
  const password = "StrongP@ssw0rd!";

  beforeAll(async () => {
    await app.ready();
    await prisma.user.deleteMany({ where: { email } });
    await prisma.user.create({
      data: {
        email,
        name: "E2E",
        role: "ADMIN",
        isActive: true,
        passwordHash: await createPasswordHash(password),
      },
    });
  });

  afterAll(async () => {
    await prisma.verificationCode.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it("POST /auth/login then /auth/otp/verify", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { "x-api-key": process.env.API_KEY! },
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
    const { challengeId } = loginRes.json();
    const code = await prisma.verificationCode.findUnique({
      where: { id: challengeId },
    });

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/otp/verify",
      headers: { "x-api-key": process.env.API_KEY! },
      payload: { challengeId, code: code!.code, rememberMe: false },
    });
    expect(verifyRes.statusCode).toBe(200);
  });
});
