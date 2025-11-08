import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM;

    // Check if email is configured
    if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
      console.warn('Email service not configured. Password reset emails will not be sent.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort),
        secure: parseInt(emailPort) === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not available');
      return false;
    }

    const emailFrom = process.env.EMAIL_FROM;

    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text
      });

      console.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, baseUrl?: string): Promise<boolean> {
    // Use provided baseUrl or fallback to env variable or localhost
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/auth/reset?token=${token}`;

    const emailOptions: EmailOptions = {
      to: email,
      subject: 'Сброс пароля - Language Exercise',
      text: `Вы запросили сброс пароля. Перейдите по ссылке для сброса пароля: ${resetUrl}\n\nСсылка действительна в течение 1 часа.\n\nЕсли вы не запрашивали сброс пароля, проигнорируйте это письмо.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Сброс пароля</h2>
          <p>Вы запросили сброс пароля для вашей учетной записи.</p>
          <p>Нажмите на кнопку ниже, чтобы сбросить пароль:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Сбросить пароль
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Или скопируйте и вставьте эту ссылку в браузер:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Ссылка действительна в течение 1 часа.</p>
          <p style="color: #666; font-size: 14px;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        </div>
      `
    };

    return this.sendEmail(emailOptions);
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}

// Singleton instance
export const emailService = new EmailService();
