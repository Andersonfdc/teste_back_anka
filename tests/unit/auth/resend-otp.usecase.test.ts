import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResendOtpUseCase } from "@/modules/auth/services/usecases/resend-otp";
import type { IVerificationCodeRepository } from "@/modules/auth/repositories/IVerificationCodeRepository";
import EmailService from "@/modules/auth/services/email-service";
import { DateTime } from "luxon";

describe("ResendOtpUseCase (unit)", () => {
  const verificationCodeRepository = {
    findById: vi.fn(),
    updateById: vi.fn(),
  } as unknown as IVerificationCodeRepository;

  const emailService = {
    sendEmail: vi.fn(),
  } as unknown as EmailService;

  const usecase = new ResendOtpUseCase(
    verificationCodeRepository,
    emailService as any,
  );

  beforeEach(() => vi.restoreAllMocks());

  it("resends code if older than 60 seconds", async () => {
    (verificationCodeRepository.findById as any) = vi.fn().mockResolvedValue({
      id: 1,
      consumed: false,
      createdAt: DateTime.utc().minus({ minutes: 2 }).toJSDate(),
      user: { email: "a@b.com" },
    });

    await usecase.execute({ challengeId: 1 });
    expect(verificationCodeRepository.updateById).toHaveBeenCalled();
  });
});
