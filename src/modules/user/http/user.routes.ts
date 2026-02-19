import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import UserController from "./user.controller";
import { userSchemas } from "./user.schemas";
import { verifyToken } from "@/core/middlewares/verify-token";
import { verifyAdmin } from "@/core/middlewares/verify-admin";

export default async function UserRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.withTypeProvider<ZodTypeProvider>();

  fastify.addHook("preValidation", verifyToken);
  fastify.addHook("preHandler", verifyAdmin);

  fastify.get(
    "/",
    {
      schema: userSchemas.fetchAllUsersByPagination,
    },
    UserController.fetchUsers,
  );

  fastify.post(
    "/",
    {
      schema: userSchemas.createUser,
    },
    UserController.createUser,
  );

  fastify.post(
    "/:id/edit/change-role",
    {
      schema: userSchemas.changeUserRole,
    },
    UserController.changeUserRole,
  );

  fastify.post(
    "/:id/edit/toggle-status",
    {
      schema: userSchemas.toggleUserStatus,
    },
    UserController.toggleUserStatus,
  );

  fastify.post(
    "/:id/edit",
    {
      schema: userSchemas.editUser,
    },
    UserController.editUser,
  );
}
