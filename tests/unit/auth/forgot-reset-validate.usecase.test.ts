import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordUseCase } from "@/modules/auth/services/usecases/forgot-password";
import { ResetPasswordUseCase } from "@/modules/auth/services/usecases/reset-password";
import { ValidatePasswordResetTokenUseCase } from "@/modules/auth/services/usecases/validate-password-reset-token";
import type { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import type { IPasswordResetTokenRepository } from "@/modules/auth/repositories/IPasswordResetTokenRepository";
import EmailService from "@/modules/auth/services/email-service";
import { DateTime } from "luxon";

describe("Password reset flows (unit)", () => {
  const userRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    updatePasswordById: vi.fn(),
  } as unknown as IUserRepository;
  const tokenRepository = {
    create: vi.fn(),
    findByToken: vi.fn(),
    updateById: vi.fn(),
  } as unknown as IPasswordResetTokenRepository;
  const emailService = { sendEmail: vi.fn() } as unknown as EmailService;

  beforeEach(() => vi.restoreAllMocks());

  it("forgot-password sends email when user exists", async () => {
    const usecase = new ForgotPasswordUseCase(
      userRepository,
      tokenRepository,
      emailService as any,
    );
    (userRepository.findByEmail as any) = vi
      .fn()
      .mockResolvedValue({ id: "u1", email: "a@b.com" });
    await usecase.execute({ email: "a@b.com" });
    expect(tokenRepository.create).toHaveBeenCalled();
    expect((emailService as any).sendEmail).toHaveBeenCalled();
  });

  it("validate token succeeds when token valid", async () => {
    const usecase = new ValidatePasswordResetTokenUseCase(tokenRepository);
    (tokenRepository.findByToken as any) = vi
      .fn()
      .mockResolvedValue({
        used: false,
        expiresAt: DateTime.utc().plus({ minutes: 5 }).toJSDate(),
      });
    await expect(usecase.execute({ token: "t" })).resolves.not.toThrow();
  });

  it("reset password updates user and marks token used", async () => {
    const usecase = new ResetPasswordUseCase(tokenRepository, userRepository);
    (tokenRepository.findByToken as any) = vi
      .fn()
      .mockResolvedValue({
        id: 1,
        userId: "u1",
        used: false,
        expiresAt: DateTime.utc().plus({ minutes: 5 }).toJSDate(),
      });
    (userRepository.findById as any) = vi
      .fn()
      .mockResolvedValue({ id: "u1", email: "a@b.com" });
    await usecase.execute({
      token: "t",
      newPassword: "StrongP@ss1",
      confirmPassword: "StrongP@ss1",
    });
    expect(userRepository.updatePasswordById).toHaveBeenCalled();
    expect(tokenRepository.updateById).toHaveBeenCalled();
  });
});
