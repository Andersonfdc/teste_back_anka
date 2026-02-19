import { PrismaClient } from "@prisma/client";

export type IncludeOptionsBase = Record<string, boolean | object | undefined>;

export abstract class AbstractPrismaRepository<
  TInclude extends IncludeOptionsBase,
  TPayload,
> {
  constructor(protected readonly prisma: PrismaClient) {}

  protected buildIncludeFromOptions(includeOptions: TInclude): TInclude {
    const include = {} as TInclude;
    for (const key in includeOptions) {
      if (includeOptions[key as keyof TInclude] === true) {
        include[key as keyof TInclude] = includeOptions[key as keyof TInclude];
      }
    }
    return include;
  }
}
