import prisma from "@/core/lib/prisma/client";
import PrismaUserRepository from "../../repositories/prisma/user-repository";
import FetchUsers from "../usecase/fetch-users";

export default async function makeFetchUsers(): Promise<FetchUsers> {
  const userRepository = new PrismaUserRepository(prisma);
  const fetchUsersUseCase = new FetchUsers(userRepository);
  return fetchUsersUseCase;
}
