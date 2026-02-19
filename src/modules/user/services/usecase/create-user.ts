import { UserRole } from "@prisma/client";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { EmailInUserError } from "../../errors/email-in-use-error";
import type EmailService from "@/modules/auth/services/email-service";
import type { IPasswordResetTokenRepository } from "@/modules/auth/repositories/IPasswordResetTokenRepository";
import {
  generateAndHashPassword,
  handlePasswordSetup,
} from "../../utils/handle-password-setup";
import { createPasswordHash } from "@/core/utils/security";
import { ManualPasswordError } from "../../errors/manual-password-error";

export type UserInput = {
  name: string;
  email: string;
  role: UserRole;
  passwordConfig?: {
    sendResetEmail?: boolean;
    resetManually?: boolean;
    password?: string;
  };
};

export class CreateUser {
  constructor(
    private userRepository: IUserRepository,
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private emailService: EmailService,
  ) {}

  public async execute(data: UserInput) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new EmailInUserError();
    }

    if (data.passwordConfig?.resetManually && !data.passwordConfig?.password) {
      throw new ManualPasswordError();
    }

    let passwordHash = "";
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

    const createdUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
    });

    if (
      data.passwordConfig &&
      (data.passwordConfig.sendResetEmail || data.passwordConfig.resetManually)
    ) {
      const { email, subject, body } = await handlePasswordSetup({
        usecase: "create",
        email: data.email,
        name: data.name,
        passwordConfig: data.passwordConfig,
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
        userId: createdUser.id,
      });

      await this.emailService.sendEmail(email, subject, body);
    }

    return createdUser;
  }
}
