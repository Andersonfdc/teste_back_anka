import { z } from "zod/v4";
import { tokenModel } from "@/core/schemas/token.schema";
import { errorModel } from "@/core/schemas/error.schema";

export const authSchemas = {
  // POST /auth/login
  login: {
    summary: "Login do Usuário",
    description:
      "Autentica as credenciais do usuário e, em caso de sucesso, envia um código OTP (One-Time Password) para o e-mail cadastrado como segunda etapa de verificação.",
    tags: ["Autenticação"],
    body: z.object({
      email: z.email("O e-mail fornecido não é válido."),
      password: z.string().min(1, "A senha é obrigatória."),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z
          .string()
          .default("Código de verificação enviado com sucesso."),
        challengeId: z
          .number()
          .int()
          .positive()
          .describe("ID do desafio para a verificação do código OTP."),
      }),
      401: errorModel,
    },
  },

  // POST /auth/otp/verify
  verifyOtp: {
    summary: "Verificar Código OTP",
    description:
      "Verifica o código OTP fornecido pelo usuário para finalizar a autenticação e obter os tokens de acesso (JWT e Refresh Token).",
    tags: ["Autenticação"],
    body: z.object({
      challengeId: z.number().int().positive("O ID do desafio é inválido."),
      code: z.string().length(6, "O código OTP deve ter exatamente 6 dígitos."),
      rememberMe: z
        .boolean()
        .optional()
        .default(false)
        .describe("Marcar para manter a sessão ativa por 30 dias."),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Usuário autenticado com sucesso."),
        user: tokenModel,
        accessToken: z
          .string()
          .describe("Token de acesso JWT para autorização."),
        refreshToken: z
          .string()
          .describe(
            "Token para renovar a sessão sem precisar de novas credenciais.",
          ),
      }),
      400: errorModel,
      404: errorModel,
      410: errorModel,
      429: errorModel,
    },
  },

  // POST /auth/otp/resend
  resendOtp: {
    summary: "Reenviar Código OTP",
    description:
      "Solicita o reenvio de um novo código OTP para o e-mail associado ao desafio. Este endpoint possui um cooldown de 60 segundos para prevenir abuso.",
    tags: ["Autenticação"],
    body: z.object({
      challengeId: z.number().int().positive(),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Código reenviado com sucesso."),
      }),
      404: errorModel,
      410: errorModel,
      429: errorModel,
    },
  },

  // POST /auth/password/forgot
  forgotPassword: {
    summary: "Esqueci Minha Senha",
    description:
      "Inicia o fluxo de recuperação de senha. Um e-mail contendo um link com um token de redefinição será enviado. Este endpoint sempre retorna uma resposta de sucesso para evitar a enumeração de usuários.",
    tags: ["Recuperação de Senha"],
    body: z.object({
      email: z.string().email(),
    }),
    response: {
      202: z.object({
        status: z.literal(true),
        message: z
          .string()
          .default(
            "Se o e-mail estiver cadastrado, um link de recuperação foi enviado.",
          ),
      }),
    },
  },

  // GET /auth/password/validate
  validateToken: {
    summary: "Validar Token de Recuperação",
    description:
      "Verifica a validade de um token de recuperação de senha enviado por e-mail, garantindo que ele não expirou ou já foi utilizado.",
    tags: ["Recuperação de Senha"],
    querystring: z.object({
      token: z.string().min(1, "O token é obrigatório."),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Token válido."),
      }),
      410: errorModel,
    },
  },

  // POST /auth/password/reset
  resetPassword: {
    summary: "Redefinir Senha",
    description:
      "Define uma nova senha para o usuário utilizando um token de recuperação válido.",
    tags: ["Recuperação de Senha"],
    body: z
      .object({
        token: z.string().min(1, "O token é obrigatório."),
        newPassword: z
          .string()
          .min(6, "A nova senha deve ter no mínimo 6 caracteres."),
        confirmPassword: z.string(),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
      }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Senha redefinida com sucesso."),
      }),
      400: errorModel,
      404: errorModel,
      410: errorModel,
    },
  },

  // GET /auth/me
  me: {
    summary: "Obter usuário autenticado",
    description:
      "Retorna os dados do usuário autenticado com base no JWT fornecido.",
    tags: ["Autenticação"],
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Usuário autenticado."),
        user: tokenModel,
      }),
      401: errorModel,
      403: errorModel,
    },
  },
  // POST /auth/refresh-token
  refreshToken: {
    summary: "Renovar Token de Acesso",
    description:
      "Gera um novo access token a partir de um refresh token válido.",
    tags: ["Autenticação"],
    body: z.object({
      token: z.string().min(1, "O refresh token é obrigatório."),
      userId: z.uuid("ID de usuário inválido."),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Token renovado com sucesso."),
        token: z.string(),
      }),
      401: errorModel,
    },
  },
};
