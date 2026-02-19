import { IPasswordResetTokenRepository } from "../../repositories/IPasswordResetTokenRepository";
import { InvalidPasswordResetTokenError } from "../../errors";
import { DateTime } from "luxon";

export class ValidatePasswordResetTokenUseCase {
  constructor(
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
  ) {}

  async execute({ token }: { token: string }): Promise<void> {
    const passwordResetToken =
      await this.passwordResetTokenRepository.findByToken(token);

    if (
      !passwordResetToken ||
      passwordResetToken.used ||
      passwordResetToken.expiresAt < DateTime.utc().toJSDate()
    ) {
      throw new InvalidPasswordResetTokenError();
    }
  }
}
