import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "@/modules/user/repositories/prisma/user-repository";
import PrismaPasswordResetTokenRepository from "../../repositories/prisma/password-reset-token-repository";
import { ForgotPasswordUseCase } from "../usecases/forgot-password";
import EmailService from "../email-service";

export default async function makeForgotPasswordUseCase() {
  const usersRepository = new PrismaUserRepository(prisma);
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );
  const emailService = new EmailService();

  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    usersRepository,
    passwordResetTokenRepository,
    emailService,
  );

  return forgotPasswordUseCase;
}
