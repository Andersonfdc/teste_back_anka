import { FastifyReply, FastifyRequest } from "fastify";
import { authSchemas } from "./auth.schemas";
import { z } from "zod/v4";
import makeLoginUseCase from "../services/factories/make-login-use-case";
import makeVerifyOtpUseCase from "../services/factories/make-verify-otp-use-case";
import makeResendOtpUseCase from "../services/factories/make-resend-otp-use-case";
import makeForgotPasswordUseCase from "../services/factories/make-forgot-password-use-case";
import makeValidatePasswordResetTokenUseCase from "../services/factories/make-validate-password-reset-token-use-case";
import makeResetPasswordUseCase from "../services/factories/make-reset-password-use-case";
import { HandleAppContollerError } from "@/core/decorators/controller-error-handler";
import makeRefreshTokenUseCase from "../services/factories/make-refresh-token-use-case";

// Extrai os tipos inferidos dos schemas para garantir type-safety nos handlers
type LoginRequest = FastifyRequest<{
  Body: z.infer<typeof authSchemas.login.body>;
}>;
type VerifyOtpRequest = FastifyRequest<{
  Body: z.infer<typeof authSchemas.verifyOtp.body>;
}>;
type ResendOtpRequest = FastifyRequest<{
  Body: z.infer<typeof authSchemas.resendOtp.body>;
}>;
type ForgotPasswordRequest = FastifyRequest<{
  Body: z.infer<typeof authSchemas.forgotPassword.body>;
}>;
type ValidateTokenRequest = FastifyRequest<{
  Querystring: z.infer<typeof authSchemas.validateToken.querystring>;
}>;
type ResetPasswordRequest = FastifyRequest<{
  Body: z.infer<typeof authSchemas.resetPassword.body>;
}>;
type RefreshTokenRequest = FastifyRequest<{
  Body: z.infer<typeof authSchemas.refreshToken.body>;
}>;

export class AuthController {
  @HandleAppContollerError()
  public static async login(req: LoginRequest, res: FastifyReply) {
    const loginUseCase = await makeLoginUseCase();
    // req.body já é validado e tipado pelo Fastify
    const result = await loginUseCase.execute(req.body);

    return res.status(200).send({
      status: true,
      message: "Código de verificação enviado",
      challengeId: result.challengeId,
    });
  }

  @HandleAppContollerError()
  public static async verifyOtp(req: VerifyOtpRequest, res: FastifyReply) {
    const verifyOtpUseCase = await makeVerifyOtpUseCase();
    const result = await verifyOtpUseCase.execute(req.body);

    return res.status(200).send({
      status: true,
      message: "Login realizado com sucesso",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  @HandleAppContollerError()
  public static async resendOtp(req: ResendOtpRequest, res: FastifyReply) {
    const resendOtpUseCase = await makeResendOtpUseCase();
    await resendOtpUseCase.execute(req.body);

    return res.status(200).send({
      status: true,
      message: "Código reenviado com sucesso",
    });
  }

  public static async forgotPassword(
    req: ForgotPasswordRequest,
    res: FastifyReply,
  ) {
    const forgotPasswordUseCase = await makeForgotPasswordUseCase();
    await forgotPasswordUseCase.execute(req.body);

    return res.status(202).send({
      status: true,
      message: "Se o e-mail existir, um link de recuperação foi enviado",
    });
  }

  @HandleAppContollerError()
  public static async validatePasswordResetToken(
    req: ValidateTokenRequest,
    res: FastifyReply,
  ) {
    const validateTokenUseCase = await makeValidatePasswordResetTokenUseCase();
    await validateTokenUseCase.execute(req.query);

    return res.status(200).send({
      status: true,
      message: "Token válido",
    });
  }

  @HandleAppContollerError()
  public static async resetPassword(
    req: ResetPasswordRequest,
    res: FastifyReply,
  ) {
    const resetPasswordUseCase = await makeResetPasswordUseCase();
    await resetPasswordUseCase.execute(req.body);

    return res.status(200).send({
      status: true,
      message: "Senha redefinida com sucesso",
    });
  }

  @HandleAppContollerError()
  public static async me(req: FastifyRequest, res: FastifyReply) {
    const user = req.user;

    return res.status(200).send({
      status: true,
      message: "Usuário autenticado.",
      user,
    });
  }

  @HandleAppContollerError()
  public static async refreshToken(
    req: RefreshTokenRequest,
    res: FastifyReply,
  ) {
    const refreshTokenUseCase = await makeRefreshTokenUseCase();
    const result = await refreshTokenUseCase.execute(req.body);

    return res.status(200).send({
      status: true,
      message: "Token renovado com sucesso.",
      token: result.token,
    });
  }
}
