import { $Enums } from "@prisma/client";
import { z } from "zod/v4";

export const UserRoleEnum = z.enum($Enums.UserRole);

export const passwordConfigSchema = z
  .object({
    resetManually: z.boolean().optional(),
    sendResetEmail: z.boolean().optional(),
    password: z.string().optional(),
  })
  .optional();

export const createUserModel = z.object({
  name: z.string().min(5),
  email: z.email(),
  role: UserRoleEnum,
  passwordConfig: passwordConfigSchema,
});

export const userModel = z.object({
  id: z.uuid().default("ID inválido."),
  role: UserRoleEnum,
  name: z.string().min(1, "Nome é obrigatório."),
  email: z.email().default("E-mail inválido."),
  isActive: z.boolean(),
  emailVerifiedAt: z.date().nullable().optional(),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
