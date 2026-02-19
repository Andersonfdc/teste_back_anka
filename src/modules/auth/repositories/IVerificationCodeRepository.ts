import { Prisma, VerificationCode, VerificationCodeType } from "@prisma/client";
import { AbstractPrismaRepository } from "@/core/abstractions/AbstractPrismaRepository";

export type VerificationCodeCreateDTO = Prisma.VerificationCodeCreateInput;
export type VerificationCodeUpdateDTO = {
  id: VerificationCode["id"];
  data: Prisma.VerificationCodeUpdateInput;
};

export type VerificationCodeIncludeOptions = Prisma.VerificationCodeInclude;
export type VerificationCodeWithRelations = Prisma.VerificationCodeGetPayload<{
  include: VerificationCodeIncludeOptions;
}>;

export interface IVerificationCodeRepository {
  create(code: VerificationCodeCreateDTO): Promise<VerificationCode>;
  findById(id: number): Promise<VerificationCodeWithRelations | null>;
  findByCodeAndType(
    code: string,
    type: VerificationCodeType,
    options?: VerificationCodeIncludeOptions,
  ): Promise<VerificationCodeWithRelations | null>;
  findByUserIdAndType(
    userId: string,
    type: VerificationCodeType,
    options?: VerificationCodeIncludeOptions,
  ): Promise<VerificationCodeWithRelations[]>;
  updateById(code: VerificationCodeUpdateDTO): Promise<VerificationCode>;
  deleteById(id: VerificationCode["id"]): Promise<void>;
  deleteExpired(): Promise<void>;
}

export default abstract class AbstractVerificationCodeRepository
  extends AbstractPrismaRepository<
    VerificationCodeIncludeOptions,
    VerificationCodeWithRelations
  >
  implements IVerificationCodeRepository
{
  abstract create(code: VerificationCodeCreateDTO): Promise<VerificationCode>;
  abstract findById(id: number): Promise<VerificationCodeWithRelations | null>;
  abstract findByCodeAndType(
    code: string,
    type: VerificationCodeType,
    options?: VerificationCodeIncludeOptions,
  ): Promise<VerificationCodeWithRelations | null>;
  abstract findByUserIdAndType(
    userId: string,
    type: VerificationCodeType,
    options?: VerificationCodeIncludeOptions,
  ): Promise<VerificationCodeWithRelations[]>;
  abstract updateById(
    code: VerificationCodeUpdateDTO,
  ): Promise<VerificationCode>;
  abstract deleteById(id: VerificationCode["id"]): Promise<void>;
  abstract deleteExpired(): Promise<void>;
}
