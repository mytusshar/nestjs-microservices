// email.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { formatDate, generateEmailTemplate } from '../utils/email.utils';
import { SalesReport } from '../interfaces/report.interface';

@Injectable()
export class EmailService {
  private readonly receiverEmail: string;

  constructor(private readonly mailerService: MailerService) {
    this.receiverEmail = process.env.RECEIVER_EMAIL;
  }

  async sendEmail(report: SalesReport) {
    const emailBodyHtml: string = generateEmailTemplate(report);
    await this.mailerService.sendMail({
      to: this.receiverEmail,
      subject: `Daily Sales Summary for ${formatDate(report.date)}`,
      html: emailBodyHtml,
    });

    console.log(`$$$ EmailService: Email sent to ${this.receiverEmail}`);
  }
}
