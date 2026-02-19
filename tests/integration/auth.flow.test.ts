import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import prisma from "@/core/lib/prisma/client";
import { DateTime } from "luxon";
import makeLoginUseCase from "@/modules/auth/services/factories/make-login-use-case";
import makeVerifyOtpUseCase from "@/modules/auth/services/factories/make-verify-otp-use-case";
import { createPasswordHash } from "@/core/utils/security";

describe("Auth flow (integration)", () => {
  const email = `int.${DateTime.now().toMillis()}@example.com`;
  const password = "StrongP@ssw0rd!";

  beforeAll(async () => {
    // ensure user exists
    await prisma.user.deleteMany({ where: { email } });
    await prisma.user.create({
      data: {
        email,
        name: "Integration User",
        role: "ADMIN",
        isActive: true,
        passwordHash: await createPasswordHash(password),
      },
    });
  });

  afterAll(async () => {
    await prisma.verificationCode.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
  });

  it("should login and verify OTP", async () => {
    const login = await makeLoginUseCase();
    const { challengeId } = await login.execute({ email, password });

    // read code from DB
    const code = await prisma.verificationCode.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });
    expect(code).toBeTruthy();

    const verify = await makeVerifyOtpUseCase();
    const { accessToken, refreshToken } = await verify.execute({
      challengeId: code!.id,
      code: code!.code,
      rememberMe: false,
    });
    expect(accessToken).toBeTypeOf("string");
    expect(refreshToken).toBeTypeOf("string");
  });
});
