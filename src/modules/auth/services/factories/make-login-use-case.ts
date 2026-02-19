import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "@/modules/user/repositories/prisma/user-repository";
import PrismaVerificationCodeRepository from "../../repositories/prisma/verification-code-repository";
import EmailService from "../email-service";
import { LoginUseCase } from "../usecases/login";

export default async function makeLoginUseCase() {
  const usersRepository = new PrismaUserRepository(prisma);
  const verificationCodeRepository = new PrismaVerificationCodeRepository(
    prisma,
  );
  const emailService = new EmailService();

  const loginUseCase = new LoginUseCase(
    usersRepository,
    verificationCodeRepository,
    emailService,
  );

  return loginUseCase;
}
