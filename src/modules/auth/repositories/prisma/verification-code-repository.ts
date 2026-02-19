import {
  PrismaClient,
  VerificationCode,
  VerificationCodeType,
} from "@prisma/client";
import AbstractVerificationCodeRepository, {
  IVerificationCodeRepository,
  VerificationCodeCreateDTO,
  VerificationCodeIncludeOptions,
  VerificationCodeWithRelations,
} from "../IVerificationCodeRepository";
import { VerificationCodeUpdateDTO } from "../IVerificationCodeRepository";
import { DateTime } from "luxon";

export default class PrismaVerificationCodeRepository extends AbstractVerificationCodeRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(code: VerificationCodeCreateDTO): Promise<VerificationCode> {
    return this.prisma.verificationCode.create({ data: code });
  }

  async findById(id: number) {
    return this.prisma.verificationCode.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findByCodeAndType(
    code: string,
    type: VerificationCodeType,
    options?: VerificationCodeIncludeOptions,
  ): Promise<VerificationCodeWithRelations | null> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.verificationCode.findFirst({
      where: {
        code,
        type,
        consumed: false,
        expiresAt: { gt: DateTime.utc().toJSDate() },
      },
      include,
      relationLoadStrategy,
    });
  }

  async findByUserIdAndType(
    userId: string,
    type: VerificationCodeType,
    options?: VerificationCodeIncludeOptions,
  ): Promise<VerificationCodeWithRelations[]> {
    const include = options ? this.buildIncludeFromOptions(options) : {};
    const relationLoadStrategy = include ? "join" : undefined;
    return this.prisma.verificationCode.findMany({
      where: {
        userId,
        type,
        consumed: false,
        expiresAt: { gt: DateTime.utc().toJSDate() },
      },
      include,
      relationLoadStrategy,
    });
  }

  async updateById(code: VerificationCodeUpdateDTO): Promise<VerificationCode> {
    return this.prisma.verificationCode.update({
      where: { id: code.id },
      data: code.data,
    });
  }

  async deleteById(id: VerificationCode["id"]): Promise<void> {
    await this.prisma.verificationCode.delete({ where: { id } });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: { expiresAt: { lt: DateTime.utc().toJSDate() } },
    });
  }
}
