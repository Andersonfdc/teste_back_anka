import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AuthController } from "./auth.controller";
import { authSchemas } from "./auth.schemas";
import { FastifyInstance } from "fastify";
import { verifyApiKey } from "@/core/middlewares/verify-api-key";
import { verifyToken } from "@/core/middlewares/verify-token";

export default async function AuthRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.withTypeProvider<ZodTypeProvider>();

  // POST /auth/login: Autenticar usuário e enviar código OTP
  fastify.post("/login", {
    schema: authSchemas.login,
    preValidation: verifyApiKey,
    handler: AuthController.login,
  });

  // POST /auth/otp/verify: Verificar código OTP e completar login
  fastify.post("/otp/verify", {
    schema: authSchemas.verifyOtp,
    preValidation: verifyApiKey,
    handler: AuthController.verifyOtp,
  });

  // POST /auth/otp/resend: Reenviar código OTP com cooldown de 60 segundos
  fastify.post("/otp/resend", {
    schema: authSchemas.resendOtp,
    preValidation: verifyApiKey,
    handler: AuthController.resendOtp,
  });

  // POST /auth/password/forgot: Iniciar fluxo de recuperação de senha
  fastify.post("/password/forgot", {
    schema: authSchemas.forgotPassword,
    preValidation: verifyApiKey,
    handler: AuthController.forgotPassword,
  });

  // GET /auth/password/validate: Validar token de recuperação de senha
  fastify.get("/password/validate", {
    schema: authSchemas.validateToken,
    handler: AuthController.validatePasswordResetToken,
  });

  // POST /auth/password/reset: Completar redefinição de senha
  fastify.post("/password/reset", {
    schema: authSchemas.resetPassword,
    preValidation: verifyApiKey,
    handler: AuthController.resetPassword,
  });

  // GET /auth/me: Retorna usuário autenticado
  fastify.get(
    "/me",
    { schema: authSchemas.me, preHandler: verifyToken },
    AuthController.me,
  );

  // POST /auth/refresh-token: Renovar token de acesso
  fastify.post("/refresh-token", {
    schema: authSchemas.refreshToken,
    preValidation: verifyApiKey,
    handler: AuthController.refreshToken,
  });
}
