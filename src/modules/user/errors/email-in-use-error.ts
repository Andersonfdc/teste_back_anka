import { AppError } from "@/core/errors/app-error";

export class EmailInUserError extends AppError {
  constructor() {
    super("Email já está em uso", 400);
  }
}
