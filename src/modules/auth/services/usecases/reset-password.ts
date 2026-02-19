import { IPasswordResetTokenRepository } from "../../repositories/IPasswordResetTokenRepository";
import { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import {
  PasswordsDoNotMatchError,
  InvalidPasswordResetTokenError,
  UserNotFoundError,
} from "../../errors";
import { createPasswordHash } from "@/core/utils/security";
import { DateTime } from "luxon";

export class ResetPasswordUseCase {
  constructor(
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private usersRepository: IUserRepository,
  ) {}

  async execute({
    token,
    newPassword,
    confirmPassword,
  }: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    if (newPassword !== confirmPassword) {
      throw new PasswordsDoNotMatchError();
    }

    const passwordResetToken =
      await this.passwordResetTokenRepository.findByToken(token);

    if (
      !passwordResetToken ||
      passwordResetToken.used ||
      passwordResetToken.expiresAt < DateTime.utc().toJSDate()
    ) {
      throw new InvalidPasswordResetTokenError();
    }

    const user = await this.usersRepository.findById(passwordResetToken.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const newPasswordHash = await createPasswordHash(newPassword);

    await this.usersRepository.updatePasswordById(user.id, newPasswordHash);

    await this.passwordResetTokenRepository.updateById({
      id: passwordResetToken.id,
      data: { used: true },
    });
  }
}
