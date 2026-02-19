import { IVerificationCodeRepository } from "../../repositories/IVerificationCodeRepository";
import {
  VerificationCodeNotFoundError,
  VerificationCodeAlreadyUsedError,
  ResendCooldownError,
} from "../../errors";
import EmailService from "../email-service";
import { DateTime } from "luxon";

export class ResendOtpUseCase {
  constructor(
    private verificationCodeRepository: IVerificationCodeRepository,
    private emailService: EmailService,
  ) {}

  async execute({ challengeId }: { challengeId: number }): Promise<void> {
    const verificationCode =
      await this.verificationCodeRepository.findById(challengeId);

    if (!verificationCode) {
      throw new VerificationCodeNotFoundError();
    }

    if (verificationCode.consumed) {
      throw new VerificationCodeAlreadyUsedError();
    }

    const sixtySecondsAgo = DateTime.utc().minus({ seconds: 60 }).toJSDate();
    if (verificationCode.createdAt > sixtySecondsAgo) {
      throw new ResendCooldownError();
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiresAt = DateTime.utc().plus({ minutes: 5 }).toJSDate(); // 5 minutes

    await this.verificationCodeRepository.updateById({
      id: verificationCode.id,
      data: {
        code: newCode,
        expiresAt: newExpiresAt,
        attempts: 0,
      },
    });

    await this.emailService.sendEmail(
      verificationCode.user.email,
      "Seu novo código de verificação",
      `<p>Seu novo código de verificação é: <strong>${newCode}</strong></p>`,
    );
  }
}
