import { AppError } from "@/core/errors/app-error";

export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super("Refresh token inválido", 401);
  }
}

export class UserInactiveOrNotFoundError extends AppError {
  constructor() {
    super("Usuário inativo ou não encontrado", 403);
  }
}
