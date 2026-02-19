import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "@/modules/user/repositories/prisma/user-repository";
import PrismaVerificationCodeRepository from "../../repositories/prisma/verification-code-repository";
import VerifyOtpUseCase from "../usecases/verify-otp";

export default async function makeVerifyOtpUseCase() {
  const usersRepository = new PrismaUserRepository(prisma);
  const verificationCodeRepository = new PrismaVerificationCodeRepository(
    prisma,
  );

  const verifyOtpUseCase = new VerifyOtpUseCase(
    verificationCodeRepository,
    usersRepository,
  );

  return verifyOtpUseCase;
}
