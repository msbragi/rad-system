import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { MailerService } from './mailer.service'; // <-- your custom wrapper

@Module({
  imports: [ConfigModule],
  providers: [MailerService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}