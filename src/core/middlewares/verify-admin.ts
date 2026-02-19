import { UserRole } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error";

export const verifyAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { user } = request;
  if (user.role !== UserRole.ADMIN) {
    throw new AppError("Apenas administradores podem executar esta ação", 403);
  }
};
