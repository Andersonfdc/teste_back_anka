import { z } from "zod/v4";
import { passwordConfigSchema, userModel, UserRoleEnum } from "./user.models";
import { errorModel } from "@/core/schemas/error.schema";
import { paginationSchema } from "@/core/schemas/pagination.schema";

export const userSchemas = {
  createUser: {
    summary: "Criação de Usuário",
    description:
      "Cria um novo usuário no sistema com as configurações de autenticação e permissões definidas.",
    tags: ["Usuários"],
    body: z.object({
      name: z.string().min(5, "Nome é obrigatório."),
      email: z.email().describe("O e-mail fornecido não é válido."),
      role: UserRoleEnum,
      passwordConfig: passwordConfigSchema.optional(),
    }),
    response: {
      201: z.object({
        status: z.literal(true),
        message: z.string().default("Usuário criado com sucesso."),
        data: userModel,
      }),
      400: errorModel,
      401: errorModel,
    },
  },
  changeUserRole: {
    summary: "Atualização de Permissão",
    description: "Concede outra permissão para o Usuário.",
    tags: ["Usuários"],
    params: z.object({
      id: z.uuid().describe("ID de usuário inválido."),
    }),
    body: z.object({
      newRole: UserRoleEnum,
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Permissão alterada com sucesso."),
      }),
      400: errorModel,
      401: errorModel,
    },
  },
  fetchAllUsersByPagination: {
    summary: "Listagem de todos os usuários",
    description:
      "Listagem de todos os usuários registrados no sistema. Obs.: somente Admins da empresa Master podem acessar este recurso.",
    tags: ["Usuários"],
    querystring: paginationSchema,
    response: {
      200: z.object({
        status: z.literal(true),
        message: z
          .string()
          .default("Todos os usuários foram listados com sucesso"),
        data: z.array(userModel),
      }),
      400: errorModel,
      401: errorModel,
    },
  },
  toggleUserStatus: {
    summary: "Atualização do status do usuário",
    description:
      "Atualização do status do usuário. OS status definidos são: ACTIVE, INVITED e DISABLED",
    tags: ["Usuários"],
    params: z.object({
      id: z.uuid().describe("ID de usuário inválido."),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Status do usuário alterado com sucesso"),
      }),
      400: errorModel,
      401: errorModel,
    },
  },
  editUser: {
    summary: "Edição de Usuário",
    description:
      "Edita um usuário existente no sistema. Apenas os campos fornecidos serão atualizados.",
    tags: ["Usuários"],
    params: z.object({
      id: z.uuid().describe("ID do usuário inválido."),
    }),
    body: z.object({
      name: z
        .string()
        .min(5, "Nome deve ter ao menos 5 caracteres.")
        .optional(),
      email: z.email().describe("O e-mail fornecido não é válido.").optional(),
      toggleStatus: z.boolean().optional(),
      role: UserRoleEnum.optional(),
      passwordConfig: passwordConfigSchema.optional(),
    }),
    response: {
      200: z.object({
        status: z.literal(true),
        message: z.string().default("Usuário editado com sucesso."),
        data: userModel,
      }),
      400: errorModel,
      401: errorModel,
      404: errorModel,
    },
  },
};
