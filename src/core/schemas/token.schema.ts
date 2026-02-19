import { z } from "zod/v4";
import { UserRole } from "@prisma/client";

export const tokenModel = z.object({
  id: z.uuid().describe("ID do usuário."),
  name: z.string().describe("Nome do usuário."),
  email: z.email().describe("E-mail do usuário."),
  role: z.enum(UserRole).describe("Papel do usuário."),
  isActive: z.boolean().describe("Status do usuário."),
  exp: z.number().describe("Tempo de expiração do token."),
  iat: z.number().describe("Tempo de criação do token."),
});

export type TokenModel = z.infer<typeof tokenModel>;
