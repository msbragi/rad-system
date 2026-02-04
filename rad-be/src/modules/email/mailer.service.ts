import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as hbs from 'handlebars';
import * as fs from 'fs';
import { join, extname } from 'path';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;
  private templateBasePath: string;
  private emailSubjects: Record<string, any>;
  private supportedLanguages: string[];
  private defaultLanguage = 'en';
  private emailBcc: string = '';

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('MAIL_HOST'),
      port: configService.get<number>('MAIL_PORT'),
      secure: configService.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: configService.get<string>('MAIL_USER'),
        pass: configService.get<string>('MAIL_PASSWORD'),
      },
    });
    this.templateBasePath = configService.get<string>('EMAIL_TEMPLATE_PATH') || join(__dirname, 'templates');

    // Load supported languages from .env
    const langs = configService.get<string>('MAIL_LANGUAGES', 'en');
    this.supportedLanguages = langs.split(',').map(l => l.trim()).filter(Boolean);

    // Load email subjects from JSON
    const subjectsPath = join(this.templateBasePath, 'email-subjects.json');
    try {
      this.emailSubjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8'));
      this.logger.log(`Loaded email subjects for languages: ${Object.keys(this.emailSubjects).join(', ')}`);
    } catch (err) {
      this.logger.error(`Failed to load email subjects: ${err.message}`);
      this.emailSubjects = {};
    }

    const bccEmail = configService.get<string>('MAIL_BCC', '');
    this.emailBcc = this.validateBccEmail(bccEmail);
  }

  /**
   * Centralized send method: receives to, type, data, language
   */
  async send(options: {
    to: string;
    type: string; // e.g. 'passwordReset'
    data: any;
    language?: string;
  }) {
    const language = this.getSupportedLanguage(options.language);
    const subject = this.emailSubjects?.[language]?.[options.type] || this.emailSubjects?.[this.defaultLanguage]?.[options.type] || options.type;
    const templateFile = `${language}/${options.type}.hbs`;
    const templatePath = join(this.templateBasePath, templateFile);

    let html = '';
    try {
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const compiled = hbs.compile(templateSource);
      html = compiled(options.data);
    } catch (err) {
      this.logger.error(`Template rendering failed: ${err.message} (path: ${templatePath})`);
      throw err;
    }

    return this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM', 'noreply@yourapp.com'),
      to: options.to,
      bcc: this.emailBcc,
      subject,
      html,
    });
  }

  private getSupportedLanguage(language?: string): string {
    if (!language || !this.supportedLanguages.includes(language)) {
      return this.defaultLanguage;
    }
    return language;
  }

  private validateBccEmail(bccEmail: string): string {
    if (!bccEmail) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bccEmail.trim())) {
      this.logger.warn(`Invalid BCC email address: ${bccEmail}, BCC disabled`);
      return '';
    }
    return bccEmail.trim();
  }
}