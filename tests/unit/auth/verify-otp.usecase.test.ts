import { describe, it, expect, vi, beforeEach } from "vitest";
import VerifyOtpUseCase from "@/modules/auth/services/usecases/verify-otp";
import type { IVerificationCodeRepository } from "@/modules/auth/repositories/IVerificationCodeRepository";
import type { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import { DateTime } from "luxon";

describe("VerifyOtpUseCase (unit)", () => {
  const verificationCodeRepository = {
    findById: vi.fn(),
    updateById: vi.fn(),
  } as unknown as IVerificationCodeRepository;

  const userRepository = {
    updateLastLoginAt: vi.fn(),
  } as unknown as IUserRepository;

  const usecase = new VerifyOtpUseCase(
    verificationCodeRepository,
    userRepository,
  );

  beforeEach(() => vi.restoreAllMocks());

  it("verifies code and returns tokens", async () => {
    (verificationCodeRepository.findById as any) = vi.fn().mockResolvedValue({
      id: 1,
      code: "123456",
      consumed: false,
      attempts: 0,
      expiresAt: DateTime.utc().plus({ minutes: 5 }).toJSDate(),
      user: {
        id: "u1",
        email: "a@b.com",
        name: "A",
        role: "ADMIN",
        isActive: true,
      },
    });

    const result = await usecase.execute({
      challengeId: 1,
      code: "123456",
      rememberMe: false,
    });
    expect(result.accessToken).toBeTypeOf("string");
    expect(result.refreshToken).toBeTypeOf("string");
  });
});
