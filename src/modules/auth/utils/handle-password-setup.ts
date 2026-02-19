import { createPasswordHash } from "@/core/utils/security";
import { env } from "@/env";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";

interface PasswordConfig {
  sendResetEmail?: boolean;
  resetManually?: boolean;
  password?: string;
}

interface PreparePasswordOptions {
  name: string;
  email: string;
  userId?: string;
  usecase: "create" | "edit";
  passwordConfig: PasswordConfig;
  saveResetToken: (
    userId: string,
    token: string,
    expiresAt: Date,
  ) => Promise<void>;
}

export const generateTmpPassword = (): string => {
  const length = 12;
  return randomBytes(length).toString("base64").slice(0, length);
};

export async function generateAndHashPassword(): Promise<string> {
  const mockPassword = generateTmpPassword();
  return createPasswordHash(mockPassword);
}

function mailContent(
  mailType: "reset" | "create" | "manual-create",
  usecase: "create" | "edit",
  resetLink: string,
  name: string,
  password?: string,
) {
  const commonContent = `
  <p>
    <strong>Olá ${name}, como vai?</strong>
    <br><br>
  </p>
  `;

  const footerContent = `
  <p>
    <strong>Este é um e-mail automático, por favor não responda.</strong>
  </p>
  `;

  const headerContent =
    usecase === "create"
      ? "Seu perfil de acesso foi criado com sucesso."
      : "Seu perfil foi atualizado com sucesso.";

  if (mailType === "create" && usecase === "create") {
    return `${commonContent}
    <p>
      ${headerContent}
      <br><br>
      
      Para ativar seu acesso, defina uma senha clicando no link abaixo:
      <br>
      <a href="${resetLink}">${resetLink}</a>
    </p>
    ${footerContent}
    `;
  }

  if (mailType === "manual-create" && usecase === "create" && password) {
    return `${commonContent}
    <p>
      ${headerContent}
      <br><br>
      Entre em contato com o suporte para obter sua senha.
      <br>
    </p>
    ${footerContent}
    `;
  }

  if (mailType === "reset" && usecase === "edit") {
    return `${commonContent}
    <p>
      ${headerContent}
      <br><br>

      Por motivos de segurança, você deve criar uma nova senha para acessar o sistema.
      <br>

      Clique no link abaixo para definir sua nova senha:
      <br>
      <a href="${resetLink}">${resetLink}</a>
    </p>
    ${footerContent}
    `;
  }

  return `${commonContent}
  <p>Não foi possível gerar o conteúdo do e-mail.</p>
  ${footerContent}
  `;
}

export async function handlePasswordSetup({
  name,
  email,
  userId,
  usecase,
  saveResetToken,
  passwordConfig,
}: PreparePasswordOptions): Promise<{
  email: string;
  subject: string;
  body: string;
}> {
  const { sendResetEmail, resetManually, password } = passwordConfig;

  //sendResetEmail mean password that was defined and reset email gonna be sent;
  //instead, resetManually mean password that was defined manually and will be sent to the user;
  const emailType: "reset" | "create" | "manual-create" = sendResetEmail
    ? "create"
    : resetManually
      ? "manual-create"
      : "reset";
  const token = randomBytes(32).toString("hex");
  const expiresAt = DateTime.utc().plus({ minutes: 30 }).toJSDate();

  if (userId) {
    await saveResetToken(userId, token, expiresAt);
  }

  const firstName = name.split(" ")[0];
  const resetLink = `${env.WEB_APP_URL}/auth/redefine-password?token=${token}`;

  const body = mailContent(
    emailType,
    usecase,
    resetLink,
    firstName,
    password,
  );
  return {
    email,
    subject: "Seu acesso ao Sistema",
    body,
  };
}
