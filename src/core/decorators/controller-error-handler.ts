import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "@/core/errors/app-error";

/**
 * Method decorator to wrap Fastify controller handlers with a standardized
 * try/catch that handles AppError and unexpected errors consistently.
 *
 * Usage:
 *   class MyController {
 *     @HandleAppContollerError()
 *     static async handle(req: FastifyRequest, res: FastifyReply) { ... }
 *   }
 */
export function HandleAppContollerError<
  Req extends FastifyRequest = FastifyRequest,
  Res extends FastifyReply = FastifyReply,
  R = unknown,
>() {
  return (
    _target: unknown,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(req: Req, res: Res) => Promise<R> | R>,
  ) => {
    const originalMethod = descriptor.value;

    if (!originalMethod) return descriptor;

    descriptor.value = async function (this: unknown, req: Req, res: Res) {
      try {
        return await Promise.resolve(originalMethod.apply(this, [req, res]));
      } catch (error: unknown) {
        // Known application error
        if (
          error instanceof AppError &&
          res &&
          typeof (res as any).status === "function"
        ) {
          return (res as FastifyReply).status(error.statusCode).send({
            status: false,
            message: (error as AppError).message,
            ...((error as AppError).code && { code: (error as AppError).code }),
            ...((error as AppError).details && {
              details: (error as AppError).details,
            }),
          }) as unknown as R;
        }

        if (res && typeof (res as any).status === "function") {
          return (res as FastifyReply).status(500).send({
            status: false,
            message: "Erro interno do servidor",
            code: "INTERNAL_SERVER_ERROR",
          }) as unknown as R;
        }

        // If we cannot reply here, rethrow and let global handler catch it
        throw error;
      }
    } as typeof originalMethod;

    return descriptor;
  };
}
