import { PasswordResetToken } from "@prisma/client";
import AbstractPasswordResetTokenRepository, {
  PasswordResetTokenCreateDTO,
  PasswordResetTokenIncludeOptions,
  PasswordResetTokenUpdateDTO,
  PasswordResetTokenWithRelations,
} from "../IPasswordResetTokenRepository";
import { DateTime } from "luxon";

export default class PrismaPasswordResetTokenRepository extends AbstractPasswordResetTokenRepository {
  async create(
    token: PasswordResetTokenCreateDTO,
  ): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data: token });
  }

  async findByToken(
    token: string,
    options?: PasswordResetTokenIncludeOptions,
  ): Promise<PasswordResetTokenWithRelations | null> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: DateTime.utc().toJSDate() },
      },
      include,
      relationLoadStrategy,
    });
  }

  async findByUserId(
    userId: string,
    options?: PasswordResetTokenIncludeOptions,
  ): Promise<PasswordResetTokenWithRelations[]> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.passwordResetToken.findMany({
      where: {
        userId,
        used: false,
        expiresAt: { gt: DateTime.utc().toJSDate() },
      },
      include,
      relationLoadStrategy,
    });
  }

  async updateById({
    id,
    data,
  }: PasswordResetTokenUpdateDTO): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data,
    });
  }

  async deleteById(id: PasswordResetToken["id"]): Promise<void> {
    await this.prisma.passwordResetToken.delete({ where: { id } });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: DateTime.utc().toJSDate() } },
    });
  }
}
