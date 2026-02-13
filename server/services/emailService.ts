import nodemailer from 'nodemailer';
import * as db from '../db';

/**
 * Email Service
 * Handles sending emails and managing email queue
 */

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  userId: number;
  notificationType?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter() {
    try {
      // Configure based on environment
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
      
      if (emailProvider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        this.isConfigured = true;
      } else if (emailProvider === 'sendgrid') {
        // TODO: Implement SendGrid integration
        console.warn('SendGrid integration not yet implemented');
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter || !this.isConfigured) {
        console.warn('Email service not configured');
        // Queue for later retry
        await db.createEmailQueueItem({
          userId: options.userId,
          recipientEmail: options.to,
          subject: options.subject,
          htmlContent: options.htmlContent,
          textContent: options.textContent,
          notificationType: options.notificationType,
        });
        return false;
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@messaginggateway.com',
        to: options.to,
        subject: options.subject,
        html: options.htmlContent,
        text: options.textContent,
      });

      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Queue for retry
      await db.createEmailQueueItem({
        userId: options.userId,
        recipientEmail: options.to,
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
        notificationType: options.notificationType,
      });
      
      return false;
    }
  }

  /**
   * Process email queue
   */
  async processEmailQueue(): Promise<number> {
    try {
      const queueItems = await db.getEmailQueue({ status: 'pending', limit: 10 });
      let processed = 0;

      for (const item of queueItems) {
        try {
          const success = await this.sendEmail({
            to: item.recipientEmail,
            subject: item.subject,
            htmlContent: item.htmlContent,
            textContent: item.textContent,
            userId: item.userId,
            notificationType: item.notificationType,
          });

          if (success) {
            await db.updateEmailQueueStatus(item.id, 'sent');
            processed++;
          } else {
            // Increment retry count
            const retryCount = (item.retryCount || 0) + 1;
            if (retryCount < (item.maxRetries || 3)) {
              await db.updateEmailQueueStatus(item.id, 'pending');
            } else {
              await db.updateEmailQueueStatus(item.id, 'failed');
            }
          }
        } catch (error) {
          console.error(`Error processing email queue item ${item.id}:`, error);
        }
      }

      return processed;
    } catch (error) {
      console.error('Error processing email queue:', error);
      return 0;
    }
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail(
    userEmail: string,
    userId: number,
    paymentData: {
      amount: string;
      paymentMethod: string;
      transactionId?: string;
      date: Date;
    }
  ): Promise<boolean> {
    const htmlContent = this.getPaymentReceiptTemplate(paymentData);
    
    return this.sendEmail({
      to: userEmail,
      subject: 'إيصال الدفع - Messaging Gateway',
      htmlContent,
      userId,
      notificationType: 'payment_receipt',
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    userEmail: string,
    userId: number,
    invoiceData: {
      invoiceNumber: string;
      amount: string;
      taxAmount: string;
      totalAmount: string;
      dueDate: Date;
    }
  ): Promise<boolean> {
    const htmlContent = this.getInvoiceTemplate(invoiceData);
    
    return this.sendEmail({
      to: userEmail,
      subject: `فاتورة ${invoiceData.invoiceNumber} - Messaging Gateway`,
      htmlContent,
      userId,
      notificationType: 'invoice',
    });
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmationEmail(
    userEmail: string,
    userId: number,
    subscriptionData: {
      planName: string;
      planPrice: string;
      billingCycle: string;
      startDate: Date;
      endDate: Date;
    }
  ): Promise<boolean> {
    const htmlContent = this.getSubscriptionConfirmationTemplate(subscriptionData);
    
    return this.sendEmail({
      to: userEmail,
      subject: 'تأكيد الاشتراك - Messaging Gateway',
      htmlContent,
      userId,
      notificationType: 'subscription_confirmation',
    });
  }

  /**
   * Get payment receipt email template
   */
  private getPaymentReceiptTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0a7ea4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; }
          .footer { background-color: #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .amount { font-size: 24px; font-weight: bold; color: #0a7ea4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>إيصال الدفع</h1>
          </div>
          <div class="content">
            <div class="detail-row">
              <span>المبلغ:</span>
              <span class="amount">${data.amount} ريال</span>
            </div>
            <div class="detail-row">
              <span>طريقة الدفع:</span>
              <span>${data.paymentMethod}</span>
            </div>
            <div class="detail-row">
              <span>التاريخ:</span>
              <span>${new Date(data.date).toLocaleDateString('ar-SA')}</span>
            </div>
            ${data.transactionId ? `
            <div class="detail-row">
              <span>رقم العملية:</span>
              <span>${data.transactionId}</span>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>شكراً لاستخدامك خدماتنا</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get invoice email template
   */
  private getInvoiceTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0a7ea4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; }
          .footer { background-color: #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
          th { background-color: #e5e7eb; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>فاتورة رقم ${data.invoiceNumber}</h1>
          </div>
          <div class="content">
            <table>
              <tr>
                <th>البند</th>
                <th>المبلغ</th>
              </tr>
              <tr>
                <td>الرسوم الأساسية</td>
                <td>${data.amount} ريال</td>
              </tr>
              <tr>
                <td>الضريبة (15%)</td>
                <td>${data.taxAmount} ريال</td>
              </tr>
              <tr class="total">
                <td>الإجمالي</td>
                <td>${data.totalAmount} ريال</td>
              </tr>
            </table>
            <p>تاريخ الاستحقاق: ${new Date(data.dueDate).toLocaleDateString('ar-SA')}</p>
          </div>
          <div class="footer">
            <p>شكراً لاستخدامك خدماتنا</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get subscription confirmation email template
   */
  private getSubscriptionConfirmationTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0a7ea4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; }
          .footer { background-color: #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>تأكيد الاشتراك</h1>
          </div>
          <div class="content">
            <p>تم تفعيل اشتراكك بنجاح!</p>
            <div class="detail-row">
              <span>الخطة:</span>
              <span>${data.planName}</span>
            </div>
            <div class="detail-row">
              <span>السعر:</span>
              <span>${data.planPrice} ريال</span>
            </div>
            <div class="detail-row">
              <span>دورة الفواتير:</span>
              <span>${data.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}</span>
            </div>
            <div class="detail-row">
              <span>تاريخ البداية:</span>
              <span>${new Date(data.startDate).toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="detail-row">
              <span>تاريخ الانتهاء:</span>
              <span>${new Date(data.endDate).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          <div class="footer">
            <p>شكراً لاستخدامك خدماتنا</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
