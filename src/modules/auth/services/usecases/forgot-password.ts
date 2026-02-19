import { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import { IPasswordResetTokenRepository } from "../../repositories/IPasswordResetTokenRepository";
import EmailService from "../email-service";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";
import { env } from "@/env";

export class ForgotPasswordUseCase {
  constructor(
    private usersRepository: IUserRepository,
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private emailService: EmailService,
  ) {}

  async execute({ email }: { email: string }): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      // Still return success to prevent email enumeration
      return;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = DateTime.utc().plus({ minutes: 30 }).toJSDate(); // 30 minutes

    await this.passwordResetTokenRepository.create({
      user: { connect: { id: user.id } },
      token,
      expiresAt,
    });

    const resetLink = `${env.WEB_APP_URL}/auth/redefine-password?token=${token}`;

    await this.emailService.sendEmail(
      user.email,
      "Recuperação de Senha",
      `<p>Para redefinir sua senha, clique no link: <a href="${resetLink}">${resetLink}</a></p>`,
    );
  }
}
