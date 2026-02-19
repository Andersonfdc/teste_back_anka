import { Prisma, User, type $Enums } from "@prisma/client";
import { AbstractPrismaRepository } from "@/core/abstractions/AbstractPrismaRepository";

export type UserCreateInput = Prisma.UserCreateInput;

export type UserIncludeOptions = Prisma.UserInclude;
export type UserWithRelations = Prisma.UserGetPayload<{
  include: UserIncludeOptions;
}>;

export interface IUserRepository {
  create(user: UserCreateInput): Promise<User>;
  findByEmail(
    email: string,
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations | null>;
  findById(
    id: string,
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations | null>;
  findAll(options?: UserIncludeOptions): Promise<UserWithRelations[]>;
  findAllWithPagination(
    limit: number,
    page: number,
    orderBy: "asc" | "desc",
    options?: UserIncludeOptions,
  ): Promise<{
    data: UserWithRelations[];
    pagination: {
      total: number;
      totalPages: number;
      page: number;
      limit: number;
    };
  }>;
  updatePasswordById(id: string, password: string): Promise<User>;
  updateRoleById(id: string, role: $Enums.UserRole): Promise<User>;
  toggleActiveById(id: string): Promise<User | null>;
  updateLastLoginAt(id: string, lastLoginAt: Date): Promise<User>;
  delete(id: string): Promise<void>;
}

export default abstract class AbstractUserRepository
  extends AbstractPrismaRepository<UserIncludeOptions, UserWithRelations>
  implements IUserRepository
{
  abstract create(user: UserCreateInput): Promise<User>;
  abstract findByEmail(
    email: string,
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations | null>;
  abstract findById(
    id: string,
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations | null>;
  abstract findAll(options?: UserIncludeOptions): Promise<UserWithRelations[]>;
  abstract findAllWithPagination(
    limit: number,
    page: number,
    orderBy: "asc" | "desc",
    options?: UserIncludeOptions,
  ): Promise<{
    data: UserWithRelations[];
    pagination: {
      total: number;
      totalPages: number;
      page: number;
      limit: number;
    };
  }>;
  abstract updatePasswordById(id: string, password: string): Promise<User>;
  abstract updateRoleById(id: string, role: $Enums.UserRole): Promise<User>;
  abstract toggleActiveById(id: string): Promise<User | null>;
  abstract updateLastLoginAt(id: string, lastLoginAt: Date): Promise<User>;
  abstract delete(id: string): Promise<void>;
}
