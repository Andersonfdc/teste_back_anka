import { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import { IVerificationCodeRepository } from "../../repositories/IVerificationCodeRepository";
import { verifyPassword } from "@/core/utils/security";
import EmailService from "../email-service";
import { InvalidCredentialsError } from "../../errors";
import { VerificationCodeType } from "@prisma/client";
import { DateTime } from "luxon";
import { DisabledAccountError } from "../../errors/authentication-errors";

export class LoginUseCase {
  constructor(
    private usersRepository: IUserRepository,
    private verificationCodeRepository: IVerificationCodeRepository,
    private emailService: EmailService,
  ) {}

  async execute({ email, password }: { email: string; password: string }) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Then check if user is disabled
    if (user.isActive === false) {
      throw new DisabledAccountError();
    }

    const isDev = process.env.NODE_ENV === "dev";
    const passwordMatch = await verifyPassword(password, user.passwordHash);

    if (!passwordMatch) {
      throw new InvalidCredentialsError();
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = DateTime.utc().plus({ minutes: 5 }).toJSDate(); // 5 minutes

    const verificationCode = await this.verificationCodeRepository.create({
      user: { connect: { id: user.id } },
      type: VerificationCodeType.LOGIN,
      code,
      expiresAt,
    });

    if (!isDev) {
      await this.emailService.sendEmail(
        user.email,
        "Seu código de verificação",
        `<p>Seu código de verificação é: <strong>${code}</strong></p>`,
      );
    } else {
      console.log("Código de verificação:", code);
    }

    return { challengeId: verificationCode.id };
  }
}
