import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

export interface INotificationEmail {
  userId: number;
  userFullName: string;
  email: string;
  name?: string;
  title?: string;
  openDate?: string; // formatted date string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultLanguage = 'it';

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    // No more subject/template config here; all handled in MailerService
  }

  async sendPasswordResetEmail(email: string, resetToken: string, lang: string) {
    // Compose resetUrl and expiresIn for template
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const data = {
      name: email.split('@')[0],
      resetUrl,
      expiresIn: '1 ora',
    };
    await this.send(email, "passwordReset", data, lang);
  }

  /**
   * Send an email by type (centralized config in MailerService)
   * @param to Recipient email
   * @param type Email type (e.g. 'passwordReset')
   * @param data Data for template merge
   * @param language Language code (default 'en')
   */
  async send(to: string, type: string, data: any, language = this.defaultLanguage): Promise<void> {
    this.validateEmail(to);
    try {
      await this.mailerService.send({
        to,
        type,
        data,
        language,
      });
      this.logger.log(`Sent email type '${type}' to ${to} (${language})`);
    } catch (error) {
      this.logger.error(`Failed to send email type '${type}' to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Language support now handled in MailerService

  /**
   * Validate email format
   * @param email Email address to validate
   * @throws BadRequestException if email is invalid
   */
  private validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email address is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestException('Invalid email address format');
    }

    // Additional checks
    if (email.length > 254) { // RFC 5321 limit
      throw new BadRequestException('Email address too long');
    }
  }

  // BCC logic handled in MailerService

}