import prisma from "@/core/lib/prisma/client";
import PrismaVerificationCodeRepository from "../../repositories/prisma/verification-code-repository";
import { ResendOtpUseCase } from "../usecases/resend-otp";
import EmailService from "../email-service";

export default async function makeResendOtpUseCase() {
  const verificationCodeRepository = new PrismaVerificationCodeRepository(
    prisma,
  );
  const emailService = new EmailService();

  const resendOtpUseCase = new ResendOtpUseCase(
    verificationCodeRepository,
    emailService,
  );

  return resendOtpUseCase;
}
