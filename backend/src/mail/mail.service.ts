import { Injectable, Logger } from '@nestjs/common';
import { appConfig } from '../config/app.config';

type MailTransporter = {
  sendMail: (options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: MailTransporter | null;

  constructor() {
    if (!appConfig.smtpHost) {
      this.transporter = null;
      this.logger.warn(
        'SMTP is not configured. Email actions will be logged instead of sent.',
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createTransport } = require('nodemailer') as {
      createTransport: (options: Record<string, unknown>) => MailTransporter;
    };

    this.transporter = createTransport({
      host: appConfig.smtpHost,
      port: appConfig.smtpPort,
      secure: appConfig.smtpPort === 465,
      auth: appConfig.smtpUser
        ? {
            user: appConfig.smtpUser,
            pass: appConfig.smtpPassword,
          }
        : undefined,
    });
  }

  async sendVerificationEmail(email: string, verificationUrl: string) {
    const subject = 'Подтверждение почты в Skillent';
    const text = [
      'Подтверди свою почту, чтобы завершить регистрацию в Skillent.',
      '',
      verificationUrl,
      '',
      'Если ты не создавал аккаунт, просто проигнорируй это письмо.',
    ].join('\n');

    await this.sendMail(email, subject, text, verificationUrl);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    const subject = 'Сброс пароля в Skillent';
    const text = [
      'Мы получили запрос на сброс пароля в Skillent.',
      '',
      resetUrl,
      '',
      'Если ты не запрашивал сброс, просто проигнорируй это письмо.',
    ].join('\n');

    await this.sendMail(email, subject, text, resetUrl);
  }

  private async sendMail(
    email: string,
    subject: string,
    text: string,
    actionUrl: string,
  ) {
    if (!this.transporter) {
      this.logger.log(`${subject} for ${email}: ${actionUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: appConfig.smtpFrom,
      to: email,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
    });
  }
}
