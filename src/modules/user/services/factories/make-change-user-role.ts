import prisma from "@/core/lib/prisma/client";
import {
  ChangeUserRole,
  type ChangeUserRole as ChangeUserRoleService,
} from "../usecase/change-user-role";
import PrismaUserRepository from "../../repositories/prisma/user-repository";

export default async function makeChangeUserRole(): Promise<ChangeUserRoleService> {
  const userRepository = new PrismaUserRepository(prisma);
  const changeUserRoleUseCase = new ChangeUserRole(userRepository);

  return changeUserRoleUseCase;
}
