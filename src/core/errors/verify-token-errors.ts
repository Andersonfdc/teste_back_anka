import { AppError } from "./app-error";

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token expirado") {
    super(message, 401, "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED");
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = "Token inválido ou malformado") {
    super(message, 401, "FST_JWT_AUTHORIZATION_TOKEN_INVALID");
  }
}

export class TokenMissingError extends AppError {
  constructor(message: string = "Token não fornecido") {
    super(message, 401, "FST_JWT_AUTHORIZATION_TOKEN_MISSING");
  }
}

export class UserNotFoundInTokenError extends AppError {
  constructor(message: string = "Usuário não encontrado no sistema") {
    super(message, 404, "FST_JWT_USER_NOT_FOUND");
  }
}

export class UserInactiveInTokenError extends AppError {
  constructor(message: string = "Usuário inativo no sistema") {
    super(message, 403, "FST_JWT_USER_INACTIVE");
  }
}
