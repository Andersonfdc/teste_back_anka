import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "@/modules/user/repositories/prisma/user-repository";
import { RefreshTokenUseCase } from "../usecases/refresh-token";

export default async function makeRefreshTokenUseCase() {
  const usersRepository = new PrismaUserRepository(prisma);

  const refreshTokenUseCase = new RefreshTokenUseCase(usersRepository);
  return refreshTokenUseCase;
}
