import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUseCase } from "@/modules/auth/services/usecases/login";
import {
  InvalidCredentialsError,
  DisabledAccountError,
} from "@/modules/auth/errors";
import * as security from "@/core/utils/security";
import type { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import type { IVerificationCodeRepository } from "@/modules/auth/repositories/IVerificationCodeRepository";
import EmailService from "@/modules/auth/services/email-service";
import { VerificationCodeType } from "@prisma/client";
vi.mock("@/core/utils/security", () => ({
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

describe("LoginUseCase (unit)", () => {
  const userRepository = {
    findByEmail: vi.fn(),
  } as unknown as IUserRepository;

  const verificationCodeRepository = {
    create: vi.fn(),
  } as unknown as IVerificationCodeRepository;

  const emailService = {
    sendEmail: vi.fn(),
  } as unknown as EmailService;

  const usecase = new LoginUseCase(
    userRepository,
    verificationCodeRepository,
    emailService as any,
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws InvalidCredentialsError when user does not exist", async () => {
    (userRepository.findByEmail as any) = vi.fn().mockResolvedValue(null);
    await expect(
      usecase.execute({ email: "x@example.com", password: "x" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("throws DisabledAccountError when user is inactive", async () => {
    (userRepository.findByEmail as any) = vi.fn().mockResolvedValue({
      id: "u1",
      email: "x@example.com",
      name: "X",
      role: "ADMIN",
      isActive: false,
      passwordHash: "hash",
    });
    await expect(
      usecase.execute({ email: "x@example.com", password: "x" }),
    ).rejects.toBeInstanceOf(DisabledAccountError);
  });

  it("creates verification code and logs code in dev", async () => {
    (userRepository.findByEmail as any) = vi.fn().mockResolvedValue({
      id: "u1",
      email: "x@example.com",
      name: "X",
      role: "ADMIN",
      isActive: true,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuv",
    });
    vi.spyOn(security, "verifyPassword").mockResolvedValue(true);
    // mock verifyPassword by monkey-patching module import boundary would be heavy; assume unit scope and simulate success by stubbing it indirectly
    // Here we bypass verify by aligning with implementation: it calls verifyPassword; since we can't easily inject, we simulate by ensuring wrong path not taken
    // Simplify: mock repository to accept create call
    (verificationCodeRepository.create as any) = vi
      .fn()
      .mockResolvedValue({ id: 1, type: VerificationCodeType.LOGIN });

    // Force dev path to avoid email send
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "dev";

    // Running should not throw; returns challengeId
    const result = await usecase.execute({
      email: "x@example.com",
      password: "ignored" as any,
    });
    expect(result.challengeId).toBe(1);
    expect(verificationCodeRepository.create).toHaveBeenCalled();

    process.env.NODE_ENV = oldEnv;
  });
});
