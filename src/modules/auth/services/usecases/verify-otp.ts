import { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import { IVerificationCodeRepository } from "../../repositories/IVerificationCodeRepository";
import {
  VerificationCodeNotFoundError,
  VerificationCodeAlreadyUsedError,
  VerificationCodeExpiredError,
  TooManyAttemptsError,
  InvalidVerificationCodeError,
} from "../../errors";
import TokenProvider from "@/core/providers/token/token-provider";
import { DateTime } from "luxon";
import { TokenModel } from "@/core/schemas/token.schema";

export interface VerifyOtpRequest {
  challengeId: number;
  code: string;
  rememberMe: boolean;
}

export interface VerifyOtpResponse {
  user: TokenModel;
  accessToken: string;
  refreshToken: string;
}

export default class VerifyOtpUseCase {
  MAX_ATTEMPTS = 3;

  constructor(
    private verificationCodeRepository: IVerificationCodeRepository,
    private usersRepository: IUserRepository,
  ) {}

  async execute({
    challengeId,
    code,
    rememberMe,
  }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const verificationCode =
      await this.verificationCodeRepository.findById(challengeId);

    if (!verificationCode) {
      throw new VerificationCodeNotFoundError();
    }

    if (verificationCode.consumed) {
      throw new VerificationCodeAlreadyUsedError();
    }

    if (verificationCode.expiresAt < DateTime.utc().toJSDate()) {
      throw new VerificationCodeExpiredError();
    }

    if (verificationCode.attempts >= this.MAX_ATTEMPTS) {
      throw new TooManyAttemptsError();
    }

    if (verificationCode.code !== code) {
      await this.verificationCodeRepository.updateById({
        id: verificationCode.id,
        data: { attempts: { increment: 1 } },
      });
      throw new InvalidVerificationCodeError();
    }

    await this.verificationCodeRepository.updateById({
      id: verificationCode.id,
      data: { consumed: true },
    });

    const { user } = verificationCode;
    await this.usersRepository.updateLastLoginAt(
      user.id,
      DateTime.utc().toJSDate(),
    );

    const tokenPayload: Omit<TokenModel, "exp" | "iat"> = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    const {
      token: accessToken,
      iat,
      expiresAt,
    } = TokenProvider.generateToken(tokenPayload, rememberMe);

    const { token: refreshToken } = TokenProvider.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        exp: expiresAt,
        iat: iat,
      },
      accessToken,
      refreshToken,
    };
  }
}
