import { env } from "@/env";
import { MailerSend, EmailParams, Recipient, Sender } from "mailersend";

export default class EmailService {
  private readonly mailerSend: MailerSend;

  constructor() {
    this.mailerSend = new MailerSend({
      apiKey: env.MAILERSEND_API_KEY,
    });
  }

  public async sendEmail(email: string, subject: string, body: string) {
    const recipientList = [new Recipient(email)];
    const sender: Sender = {
      email: "contato@ankatech.com.br",
      name: "Powered by Anka Tech",
    };

    const emailParams = new EmailParams({
      from: sender,
      to: recipientList,
      subject: subject,
      html: body,
    });

    await this.mailerSend.email.send(emailParams);
  }
}
