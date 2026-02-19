import { Prisma, PasswordResetToken, PrismaClient } from "@prisma/client";
import { AbstractPrismaRepository } from "@/core/abstractions/AbstractPrismaRepository";

export type PasswordResetTokenCreateDTO = Prisma.PasswordResetTokenCreateInput;
export type PasswordResetTokenUpdateDTO = {
  id: PasswordResetToken["id"];
  data: Prisma.PasswordResetTokenUpdateInput;
};

export type PasswordResetTokenIncludeOptions = Prisma.PasswordResetTokenInclude;
export type PasswordResetTokenWithRelations =
  Prisma.PasswordResetTokenGetPayload<{
    include: PasswordResetTokenIncludeOptions;
  }>;

export interface IPasswordResetTokenRepository {
  create(token: PasswordResetTokenCreateDTO): Promise<PasswordResetToken>;
  findByToken(
    token: string,
    options?: PasswordResetTokenIncludeOptions,
  ): Promise<PasswordResetTokenWithRelations | null>;
  findByUserId(
    userId: string,
    options?: PasswordResetTokenIncludeOptions,
  ): Promise<PasswordResetTokenWithRelations[]>;
  updateById(token: PasswordResetTokenUpdateDTO): Promise<PasswordResetToken>;
  deleteById(id: PasswordResetToken["id"]): Promise<void>;
  deleteExpired(): Promise<void>;
}

export default abstract class AbstractPasswordResetTokenRepository
  extends AbstractPrismaRepository<
    PasswordResetTokenIncludeOptions,
    PasswordResetTokenWithRelations
  >
  implements IPasswordResetTokenRepository
{
  abstract create(
    token: PasswordResetTokenCreateDTO,
  ): Promise<PasswordResetToken>;
  abstract findByToken(
    token: string,
    options?: PasswordResetTokenIncludeOptions,
  ): Promise<PasswordResetTokenWithRelations | null>;
  abstract findByUserId(
    userId: string,
    options?: PasswordResetTokenIncludeOptions,
  ): Promise<PasswordResetTokenWithRelations[]>;
  abstract updateById(
    token: PasswordResetTokenUpdateDTO,
  ): Promise<PasswordResetToken>;
  abstract deleteById(id: PasswordResetToken["id"]): Promise<void>;
  abstract deleteExpired(): Promise<void>;
}
