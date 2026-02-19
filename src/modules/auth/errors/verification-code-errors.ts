import { AppError } from "@/core/errors/app-error";

export class VerificationCodeNotFoundError extends AppError {
  constructor() {
    super("Código de verificação não encontrado", 404);
  }
}

export class VerificationCodeExpiredError extends AppError {
  constructor() {
    super("Código de verificação expirado", 410);
  }
}

export class VerificationCodeAlreadyUsedError extends AppError {
  constructor() {
    super("Código de verificação já foi utilizado", 410);
  }
}

export class InvalidVerificationCodeError extends AppError {
  constructor() {
    super("Código de verificação incorreto", 400);
  }
}

export class TooManyAttemptsError extends AppError {
  constructor() {
    super("Muitas tentativas inválidas. Solicite um novo código", 429);
  }
}

export class ResendCooldownError extends AppError {
  constructor() {
    super("Aguarde 60 segundos antes de solicitar um novo código", 429);
  }
}
