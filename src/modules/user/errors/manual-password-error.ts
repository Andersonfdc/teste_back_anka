import { AppError } from "@/core/errors/app-error";

export class ManualPasswordError extends AppError {
  constructor() {
    super("Para redefinição manual, a nova senha deve ser preenchida", 400);
  }
}
