import { User, type $Enums } from "@prisma/client";
import AbstractUserRepository, {
  UserCreateInput,
  UserIncludeOptions,
  UserWithRelations,
} from "../IUserRepository";

export default class PrismaUserRepository extends AbstractUserRepository {
  public async create(user: UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data: user });
  }

  public async findByEmail(
    email: string,
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations | null> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.user.findUnique({
      where: { email },
      include,
      relationLoadStrategy,
    });
  }

  public async findById(
    id: string,
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations | null> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.user.findUnique({
      where: { id },
      include,
      relationLoadStrategy,
    });
  }

  public async findAll(
    options?: UserIncludeOptions,
  ): Promise<UserWithRelations[]> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.user.findMany({ include, relationLoadStrategy });
  }

  public async findAllWithPagination(
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
  }> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    const total = await this.prisma.user.count();
    const totalPages = Math.ceil(total / limit);
    const safePage = Math.max(0, Math.min(page, totalPages - 1));

    const users = await this.prisma.user.findMany({
      take: limit,
      skip: safePage * limit,
      orderBy: { createdAt: orderBy },
      include,
      relationLoadStrategy,
    });

    return {
      data: users,
      pagination: {
        total,
        totalPages,
        page: safePage,
        limit,
      },
    };
  }

  public async updatePasswordById(
    id: string,
    passwordHash: string,
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  public async updateLastLoginAt(id: string, lastLoginAt: Date): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt } });
  }

  public updateRoleById(id: string, role: $Enums.UserRole): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  public async toggleActiveById(id: string): Promise<User | null> {
    const user = await this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id },
      });

      if (!current) {
        return null;
      }

      const result = await tx.user.update({
        where: { id, isActive: current.isActive },
        data: { isActive: !current.isActive },
      });

      return result;
    });

    return user;
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
