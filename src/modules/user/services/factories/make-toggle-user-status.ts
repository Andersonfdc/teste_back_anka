import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "../../repositories/prisma/user-repository";
import ToggleUserStatus from "../usecase/toggle-user-status";

export default async function makeToggleUserStatus(): Promise<ToggleUserStatus> {
  const userRepository = new PrismaUserRepository(prisma);
  const toggleUserStatusUseCase = new ToggleUserStatus(userRepository);
  return toggleUserStatusUseCase;
}
