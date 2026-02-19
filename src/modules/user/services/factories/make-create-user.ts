import prisma from "@/core/lib/prisma/client";
import { CreateUser as CreateUserService } from "../usecase/create-user";
import PrismaPasswordResetTokenRepository from "@/modules/auth/repositories/prisma/password-reset-token-repository";
import EmailService from "@/modules/auth/services/email-service";
import PrismaUserRepository from "../../repositories/prisma/user-repository";

export default async function makeCreateUser(): Promise<CreateUserService> {
  const userRepository = new PrismaUserRepository(prisma);
  const emailService = new EmailService();
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );

  const createUserUseCase = new CreateUserService(
    userRepository,
    passwordResetTokenRepository,
    emailService,
  );

  return createUserUseCase;
}
