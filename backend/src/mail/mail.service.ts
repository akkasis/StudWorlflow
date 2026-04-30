import { Injectable, Logger } from '@nestjs/common';
import { appConfig } from '../config/app.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor() {
    if (!appConfig.resendApiKey) {
      this.logger.warn(
        'Resend API is not configured. Email actions will be logged instead of sent.',
      );
    }
  }

  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    verificationCode: string,
  ) {
    const subject = 'Подтверждение почты в Skillent';
    const text = [
      'Подтверди свою почту, чтобы завершить регистрацию в Skillent.',
      '',
      `Код подтверждения: ${verificationCode}`,
      '',
      verificationUrl,
      '',
      'Если ты не создавал аккаунт, просто проигнорируй это письмо.',
    ].join('\n');

    await this.sendMail(email, subject, text, verificationUrl);
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    resetCode: string,
  ) {
    const subject = 'Сброс пароля в Skillent';
    const text = [
      'Мы получили запрос на сброс пароля в Skillent.',
      '',
      `Код для сброса пароля: ${resetCode}`,
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
    if (!appConfig.resendApiKey) {
      this.logger.log(`${subject} for ${email}: ${actionUrl}`);
      return;
    }

    const html = text
      .split('\n')
      .map((line) => (line ? `<p>${line}</p>` : '<br/>'))
      .join('');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appConfig.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: appConfig.emailFrom,
        to: [email],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Resend request failed with status ${response.status}: ${errorText}`,
      );
      throw new Error('Не удалось отправить письмо. Проверь настройки Resend.');
    }
  }
}
