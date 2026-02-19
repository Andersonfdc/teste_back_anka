import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "@/modules/user/repositories/prisma/user-repository";
import PrismaPasswordResetTokenRepository from "../../repositories/prisma/password-reset-token-repository";
import { ResetPasswordUseCase } from "../usecases/reset-password";

export default async function makeResetPasswordUseCase() {
  const usersRepository = new PrismaUserRepository(prisma);
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    passwordResetTokenRepository,
    usersRepository,
  );

  return resetPasswordUseCase;
}
