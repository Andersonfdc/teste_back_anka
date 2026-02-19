import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "../../repositories/prisma/user-repository";
import EmailService from "@/modules/auth/services/email-service";
import EditUser from "../usecase/edit-user";
import PrismaPasswordResetTokenRepository from "@/modules/auth/repositories/prisma/password-reset-token-repository";

export default async function makeEditUser(): Promise<EditUser> {
  const userRepository = new PrismaUserRepository(prisma);
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );

  const emailService = new EmailService();
  const editUserUseCase = new EditUser(
    userRepository,
    passwordResetTokenRepository,
    emailService,
  );

  return editUserUseCase;
}
