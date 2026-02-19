import prisma from "@/core/lib/prisma/client";
import PrismaPasswordResetTokenRepository from "../../repositories/prisma/password-reset-token-repository";
import { ValidatePasswordResetTokenUseCase } from "../usecases/validate-password-reset-token";

export default async function makeValidatePasswordResetTokenUseCase() {
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );

  const validatePasswordResetTokenUseCase =
    new ValidatePasswordResetTokenUseCase(passwordResetTokenRepository);

  return validatePasswordResetTokenUseCase;
}
