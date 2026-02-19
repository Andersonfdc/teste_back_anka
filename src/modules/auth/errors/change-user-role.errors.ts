import { AppError } from "@/core/errors/app-error";

export class SelfRoleChangeError extends AppError {
  constructor() {
    super("Você não pode alterar seu próprio papel", 403);
  }
}

export class UserRoleChangeError extends AppError {
  constructor() {
    super("Você não pode alterar o papel deste usuário", 403);
  }
}
