import { UserRole } from "@prisma/client";
import type { IUserRepository } from "../../repositories/IUserRepository";
import {
  SelfRoleChangeError,
  UserNotFoundError,
  UserRoleChangeError,
} from "@/modules/auth/errors";
import prisma from "@/core/lib/prisma/client";
import {
  generateAndHashPassword,
  handlePasswordSetup,
} from "../../utils/handle-password-setup";
import type EmailService from "@/modules/auth/services/email-service";
import type { IPasswordResetTokenRepository } from "@/modules/auth/repositories/IPasswordResetTokenRepository";
import { createPasswordHash } from "@/core/utils/security";
import { ManualPasswordError } from "../../errors/manual-password-error";

export type EditUserInput = {
  currentUserId: string;
  targetUserId: string;
  name?: string;
  email?: string;
  role?: UserRole;
  toggleStatus: boolean;
  passwordConfig?: {
    sendResetEmail?: boolean;
    resetManually?: boolean;
    password?: string;
  };
};

export default class EditUser {
  constructor(
    private userRepository: IUserRepository,
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private emailService: EmailService,
  ) {}

  async execute(data: EditUserInput) {
    const { currentUserId, targetUserId } = data;

    const currentUser = await this.userRepository.findById(currentUserId);
    if (!currentUser) {
      throw new UserNotFoundError();
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new UserRoleChangeError();
    }

    // First, fetch the target user to check permissions against
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError();
    }

    if (data.passwordConfig?.resetManually && !data.passwordConfig?.password) {
      throw new ManualPasswordError();
    }

    // Additional checks for self-editing (admins can't change their own role)
    if (
      currentUser.id === targetUserId &&
      data.role &&
      data.role !== targetUser.role
    ) {
      throw new SelfRoleChangeError();
    }

    const dataToUpdate = Object.fromEntries(
      Object.entries({
        name: data.name,
        email: data.email,
        role: data.role,
      }).filter(([_, value]) => value !== undefined),
    );

    let passwordHash = "";
    if (data.passwordConfig) {
      if (
        !data.passwordConfig?.resetManually &&
        data.passwordConfig?.sendResetEmail
      ) {
        passwordHash = await generateAndHashPassword();
      }

      if (
        data.passwordConfig?.resetManually &&
        data.passwordConfig.password &&
        !data.passwordConfig?.sendResetEmail
      ) {
        passwordHash = await createPasswordHash(data.passwordConfig.password);
      }
    }

    if (data.toggleStatus) {
      await this.userRepository.toggleActiveById(targetUserId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...dataToUpdate,
        ...(passwordHash && { passwordHash }),
      },
    });

    if (
      data.passwordConfig &&
      (data.passwordConfig.sendResetEmail || data.passwordConfig.resetManually)
    ) {
      const { email, subject, body } = await handlePasswordSetup({
        usecase: "edit",
        passwordConfig: data.passwordConfig,
        name: data.name ?? targetUser.name,
        email: data.email ?? targetUser.email,
        saveResetToken: async (
          userId: string,
          token: string,
          expiresAt: Date,
        ) => {
          await this.passwordResetTokenRepository.create({
            user: { connect: { id: userId } },
            token,
            expiresAt,
          });
        },
        userId: targetUser.id,
      });

      await this.emailService.sendEmail(email, subject, body);
    }

    return updatedUser;
  }
}
