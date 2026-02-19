import { AppError } from "@/core/errors/app-error";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Credenciais inválidas", 401);
  }
}

export class DisabledAccountError extends AppError {
  constructor(supportEmail?: string) {
    let message = "Conta desabilitada";
    if (supportEmail) {
      message += `, entre em contato com o suporte ${supportEmail}`;
    }

    super(message, 403);
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super("Usuário não encontrado", 404);
  }
}
