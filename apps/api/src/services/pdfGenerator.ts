import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface QuoteData {
  quoteNumber: string;
  date: Date;
  validUntil: Date;
  company: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  client: {
    name: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    email?: string;
    phone?: string;
  };
  property?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terms?: string;
  notes?: string;
}

export class PDFGenerator {
  generateQuote(data: QuoteData): Buffer {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: 50,
        });
        
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        
        // Header
        this.addHeader(doc, data);
        
        // Quote details
        this.addQuoteDetails(doc, data);
        
        // Client info
        this.addClientInfo(doc, data);
        
        // Property info
        if (data.property) {
          this.addPropertyInfo(doc, data);
        }
        
        // Line items table
        this.addLineItems(doc, data);
        
        // Totals
        this.addTotals(doc, data);
        
        // Terms and notes
        this.addTermsAndNotes(doc, data);
        
        // Footer
        this.addFooter(doc, data);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private addHeader(doc: PDFKit.PDFDocument, data: QuoteData) {
    // Company name
    doc.fontSize(24)
       .fillColor('#00A8A8')
       .text(data.company.name, 50, 50);
    
    // Company details
    doc.fontSize(10)
       .fillColor('#666666');
    
    let y = 80;
    if (data.company.address) {
      doc.text(data.company.address, 50, y);
      y += 15;
    }
    if (data.company.city && data.company.state) {
      doc.text(`${data.company.city}, ${data.company.state} ${data.company.zip}`, 50, y);
      y += 15;
    }
    if (data.company.phone) {
      doc.text(`Phone: ${data.company.phone}`, 50, y);
      y += 15;
    }
    if (data.company.email) {
      doc.text(`Email: ${data.company.email}`, 50, y);
      y += 15;
    }
    
    // Quote title
    doc.fontSize(20)
       .fillColor('#0B0E0F')
       .text('QUOTE', 400, 50, { align: 'right' });
    
    doc.moveDown();
  }
  
  private addQuoteDetails(doc: PDFKit.PDFDocument, data: QuoteData) {
    const startY = 150;
    
    doc.fontSize(10)
       .fillColor('#0B0E0F');
    
    // Quote number
    doc.font('Helvetica-Bold')
       .text('Quote #:', 350, startY)
       .font('Helvetica')
       .text(data.quoteNumber, 420, startY);
    
    // Date
    doc.font('Helvetica-Bold')
       .text('Date:', 350, startY + 15)
       .font('Helvetica')
       .text(data.date.toLocaleDateString(), 420, startY + 15);
    
    // Valid until
    doc.font('Helvetica-Bold')
       .text('Valid Until:', 350, startY + 30)
       .font('Helvetica')
       .text(data.validUntil.toLocaleDateString(), 420, startY + 30);
  }
  
  private addClientInfo(doc: PDFKit.PDFDocument, data: QuoteData) {
    const startY = 220;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#00A8A8')
       .text('Bill To:', 50, startY);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#0B0E0F');
    
    let y = startY + 20;
    doc.text(data.client.name, 50, y);
    y += 15;
    
    if (data.client.company) {
      doc.text(data.client.company, 50, y);
      y += 15;
    }
    
    if (data.client.address) {
      doc.text(data.client.address, 50, y);
      y += 15;
    }
    
    if (data.client.city && data.client.state) {
      doc.text(`${data.client.city}, ${data.client.state} ${data.client.zip}`, 50, y);
      y += 15;
    }
    
    if (data.client.email) {
      doc.text(data.client.email, 50, y);
      y += 15;
    }
    
    if (data.client.phone) {
      doc.text(data.client.phone, 50, y);
    }
  }
  
  private addPropertyInfo(doc: PDFKit.PDFDocument, data: QuoteData) {
    if (!data.property) return;
    
    const startY = 220;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#00A8A8')
       .text('Service Location:', 300, startY);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#0B0E0F');
    
    let y = startY + 20;
    doc.text(data.property.address, 300, y);
    y += 15;
    doc.text(`${data.property.city}, ${data.property.state} ${data.property.zip}`, 300, y);
  }
  
  private addLineItems(doc: PDFKit.PDFDocument, data: QuoteData) {
    const tableTop = 380;
    const tableLeft = 50;
    const tableRight = 550;
    
    // Table header
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#00A8A8');
    
    doc.text('Description', tableLeft, tableTop)
       .text('Qty', 350, tableTop, { width: 50, align: 'right' })
       .text('Unit Price', 410, tableTop, { width: 70, align: 'right' })
       .text('Total', 490, tableTop, { width: 60, align: 'right' });
    
    // Draw header line
    doc.moveTo(tableLeft, tableTop + 15)
       .lineTo(tableRight, tableTop + 15)
       .strokeColor('#00A8A8')
       .stroke();
    
    // Table rows
    doc.font('Helvetica')
       .fillColor('#0B0E0F');
    
    let y = tableTop + 25;
    data.lineItems.forEach(item => {
      doc.text(item.description, tableLeft, y, { width: 290 })
         .text(item.quantity.toString(), 350, y, { width: 50, align: 'right' })
         .text(`$${item.unitPrice.toFixed(2)}`, 410, y, { width: 70, align: 'right' })
         .text(`$${item.total.toFixed(2)}`, 490, y, { width: 60, align: 'right' });
      y += 20;
    });
    
    // Draw bottom line
    doc.moveTo(tableLeft, y + 5)
       .lineTo(tableRight, y + 5)
       .strokeColor('#CCCCCC')
       .stroke();
  }
  
  private addTotals(doc: PDFKit.PDFDocument, data: QuoteData) {
    const startX = 400;
    let y = 500 + (data.lineItems.length * 20);
    
    doc.fontSize(10)
       .font('Helvetica');
    
    // Subtotal
    doc.text('Subtotal:', startX, y, { width: 80, align: 'right' })
       .text(`$${data.subtotal.toFixed(2)}`, 490, y, { width: 60, align: 'right' });
    y += 20;
    
    // Discount
    if (data.discount > 0) {
      doc.text('Discount:', startX, y, { width: 80, align: 'right' })
         .text(`-$${data.discount.toFixed(2)}`, 490, y, { width: 60, align: 'right' });
      y += 20;
    }
    
    // Tax
    if (data.tax > 0) {
      doc.text('Tax:', startX, y, { width: 80, align: 'right' })
         .text(`$${data.tax.toFixed(2)}`, 490, y, { width: 60, align: 'right' });
      y += 20;
    }
    
    // Total
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#00A8A8')
       .text('Total:', startX, y + 5, { width: 80, align: 'right' })
       .text(`$${data.total.toFixed(2)}`, 490, y + 5, { width: 60, align: 'right' });
  }
  
  private addTermsAndNotes(doc: PDFKit.PDFDocument, data: QuoteData) {
    let y = 600;
    
    if (data.terms) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#0B0E0F')
         .text('Terms & Conditions:', 50, y);
      
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#666666')
         .text(data.terms, 50, y + 15, { width: 500 });
      
      y += 60;
    }
    
    if (data.notes) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#0B0E0F')
         .text('Notes:', 50, y);
      
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#666666')
         .text(data.notes, 50, y + 15, { width: 500 });
    }
  }
  
  private addFooter(doc: PDFKit.PDFDocument, data: QuoteData) {
    doc.fontSize(9)
       .fillColor('#999999')
       .text('Thank you for your business!', 50, 720, { align: 'center', width: 500 });
    
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 50, 735, { align: 'center', width: 500 });
  }
  
  // Similar methods for generating invoices
  generateInvoice(data: any): Buffer {
    // Similar implementation with invoice-specific fields
    return this.generateQuote(data); // Simplified for now
  }
}