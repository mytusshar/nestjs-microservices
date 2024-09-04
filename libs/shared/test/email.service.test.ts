// email.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from '../src/email/email.service';
import {
  SalesReport,
  TotalQuantityPerSKU,
} from '../src/interfaces/report.interface';
import { generateEmailTemplate, formatDate } from '../src/utils/email.utils';

// Mock implementations
jest.mock('../src/utils/email.utils', () => ({
  generateEmailTemplate: jest.fn(),
  formatDate: jest.fn(),
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    mailerService = { sendMail: jest.fn() } as any; // Mock MailerService

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mailerService },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    // Mock environment variable
    process.env.RECEIVER_EMAIL = 'test@example.com';
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email with the correct parameters', async () => {
      const totalQuantityPerSKU: TotalQuantityPerSKU = {
        'sku-1': 1,
      };
      const mockReport: SalesReport = {
        date: new Date('2024-09-01'),
        totalQuantityPerSKU: totalQuantityPerSKU,
        totalSales: 100,
      };

      const mockEmailBodyHtml = '<p>Mock email body</p>';
      const mockFormattedDate = '01 September 2024';

      // Mock the utility functions
      (generateEmailTemplate as jest.Mock).mockReturnValue(mockEmailBodyHtml);
      (formatDate as jest.Mock).mockReturnValue(mockFormattedDate);

      await emailService.sendEmail(mockReport);

      expect(generateEmailTemplate).toHaveBeenCalledWith(mockReport);
      expect(formatDate).toHaveBeenCalledWith(mockReport.date);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: `Daily Sales Summary for ${mockFormattedDate}`,
        html: mockEmailBodyHtml,
      });
    });

    it('should handle errors thrown by mailerService.sendMail', async () => {
      const totalQuantityPerSKU: TotalQuantityPerSKU = {
        'sku-1': 1,
      };
      const mockReport: SalesReport = {
        date: new Date('2024-09-01'),
        totalQuantityPerSKU: totalQuantityPerSKU,
        totalSales: 100,
      };

      (generateEmailTemplate as jest.Mock).mockReturnValue(
        '<p>Mock email body</p>',
      );
      (formatDate as jest.Mock).mockReturnValue('mock date');

      // Simulate an error in sendMail
      (mailerService.sendMail as jest.Mock).mockRejectedValue(
        new Error('Mail sending failed'),
      );

      await expect(emailService.sendEmail(mockReport)).rejects.toThrow(
        'Mail sending failed',
      );
    });
  });
});
