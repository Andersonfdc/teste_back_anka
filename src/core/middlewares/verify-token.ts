import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "@/core/lib/prisma/client";
import {
  UserNotFoundInTokenError,
  UserInactiveInTokenError,
  TokenMissingError,
  TokenInvalidError,
  TokenExpiredError,
} from "@/core/errors/verify-token-errors";
import { isFastifyJwtError } from "../utils/app-error-handler";

export async function verifyToken(request: FastifyRequest, res: FastifyReply) {
  try {
    await request.jwtVerify();

    // Carregar informações completas do usuário
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
    });

    if (!user) {
      throw new UserNotFoundInTokenError();
    }

    if (!user.isActive) {
      throw new UserInactiveInTokenError();
    }

    // Adicionar informações completas ao request.user usando a interface do fastify-jwt
    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      iat: request.user.iat,
      exp: request.user.exp,
    };
  } catch (err) {
    // Map only Fastify JWT errors to domain-specific errors
    if (isFastifyJwtError(err)) {
      const code = err.code;

      if (
        code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER" ||
        code === "FST_JWT_NO_AUTHORIZATION_IN_COOKIE"
      ) {
        const appErr = new TokenMissingError();
        res.status(appErr.statusCode).send({
          status: false,
          message: appErr.message,
          code: appErr.code,
        });
        return res;
      }

      if (code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
        const appErr = new TokenExpiredError();
        res.status(appErr.statusCode).send({
          status: false,
          message: appErr.message,
          code: appErr.code,
        });
        return res;
      }

      if (
        code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" ||
        code === "FST_JWT_BAD_REQUEST" ||
        code === "FST_JWT_BAD_COOKIE_REQUEST" ||
        code === "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED"
      ) {
        const appErr = new TokenInvalidError();
        res.status(appErr.statusCode).send({
          status: false,
          message: appErr.message,
          code: appErr.code,
        });
        return res;
      }

      // Unknown JWT error code: treat as invalid
      const appErr = new TokenInvalidError();
      res.status(appErr.statusCode).send({
        status: false,
        message: appErr.message,
        code: appErr.code,
      });
      return res;
    }

    if (err instanceof UserNotFoundInTokenError) {
      res.status(404).send({
        status: false,
        message: err.message,
      });
    } else if (err instanceof UserInactiveInTokenError) {
      res.status(403).send({
        status: false,
        message: err.message,
      });
    } else {
      console.log("❌ verifyToken: Unknown error", err);
      res.status(401).send({
        status: false,
        message: "Token inválido ou expirado",
      });
    }
    return res;
  }
}
