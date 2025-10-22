import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransporter({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

interface QuoteEmailData {
  id: string;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  validUntil?: Date | null;
  contact: {
    firstName: string;
    lastName?: string | null;
    email: string;
  };
  org: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
}

export async function sendQuoteEmail(quote: QuoteEmailData): Promise<void> {
  const quoteUrl = `${config.cors.origin}/quotes/public/${quote.quoteNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote from ${quote.org.name}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00A8A8; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .quote-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .amount { font-size: 24px; font-weight: bold; color: #00A8A8; }
        .button { display: inline-block; background: #00A8A8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${quote.org.name}</h1>
          <p>Your Quote is Ready</p>
        </div>
        
        <div class="content">
          <p>Hello ${quote.contact.firstName},</p>
          
          <p>Thank you for your interest in our services. We're pleased to provide you with the following quote:</p>
          
          <div class="quote-details">
            <h3>${quote.title}</h3>
            <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>
            <p><strong>Total Amount:</strong> <span class="amount">$${quote.totalAmount.toFixed(2)}</span></p>
            ${quote.validUntil ? `<p><strong>Valid Until:</strong> ${quote.validUntil.toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteUrl}" class="button">View Quote Details</a>
            <a href="${quoteUrl}?action=accept" class="button">Accept Quote</a>
          </div>
          
          <p>If you have any questions about this quote, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>
          ${quote.org.name}<br>
          ${quote.org.email ? `Email: ${quote.org.email}<br>` : ''}
          ${quote.org.phone ? `Phone: ${quote.org.phone}` : ''}
          </p>
        </div>
        
        <div class="footer">
          <p>This quote was generated automatically. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${quote.org.name}" <${config.email.user}>`,
    to: quote.contact.email,
    subject: `Quote ${quote.quoteNumber} from ${quote.org.name}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ quoteId: quote.id, email: quote.contact.email }, 'Quote email sent successfully');
  } catch (error) {
    logger.error({ error, quoteId: quote.id, email: quote.contact.email }, 'Failed to send quote email');
    throw error;
  }
}

export async function sendInvoiceEmail(invoice: any): Promise<void> {
  // Implementation for invoice emails
  // Similar structure to quote emails
}

export async function sendReminderEmail(data: any): Promise<void> {
  // Implementation for reminder emails
}