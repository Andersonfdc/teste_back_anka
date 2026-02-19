import { AppError } from "@/core/errors/app-error";

export class PasswordResetTokenNotFoundError extends AppError {
  constructor() {
    super("Token de recuperação não encontrado", 404);
  }
}

export class PasswordResetTokenExpiredError extends AppError {
  constructor() {
    super("Token de recuperação expirado", 410);
  }
}

export class PasswordResetTokenAlreadyUsedError extends AppError {
  constructor() {
    super("Token de recuperação já foi utilizado", 410);
  }
}

export class InvalidPasswordResetTokenError extends AppError {
  constructor() {
    super("Token de recuperação inválido ou expirado", 410);
  }
}

export class PasswordsDoNotMatchError extends AppError {
  constructor() {
    super("As senhas não coincidem", 400);
  }
}
