import type { IUserRepository } from "../../repositories/IUserRepository";
import type { UserRole } from "@prisma/client";

export interface UserData {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  isActive: boolean;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type FetchUsersRequest = {
  limit: number;
  page: number;
};

export type FetchUsersResponse = {
  data: UserData[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
};

export default class FetchUsers {
  constructor(private userRepository: IUserRepository) {}

  public async execute({
    limit = 10,
    page = 0,
  }: FetchUsersRequest): Promise<FetchUsersResponse> {
    const result = await this.userRepository.findAllWithPagination(
      limit,
      page,
      "desc",
    );

    const data: UserData[] = result.data.map((user) => ({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt || null,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      data,
      pagination: result.pagination,
    };
  }
}
