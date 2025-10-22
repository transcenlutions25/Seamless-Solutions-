import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { config } from '../config';
import { prisma } from '../index';
import { InvoiceStatus } from '@prisma/client';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export async function webhookRoutes(fastify: FastifyInstance) {
  // Stripe webhook handler
  fastify.post('/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as string,
        sig,
        config.stripe.webhookSecret
      );
    } catch (err: any) {
      fastify.log.error(`Webhook signature verification failed: ${err.message}`);
      return reply.status(400).send(`Webhook Error: ${err.message}`);
    }

    fastify.log.info({ eventType: event.type, eventId: event.id }, 'Received Stripe webhook');

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        
        default:
          fastify.log.info(`Unhandled event type: ${event.type}`);
      }

      reply.send({ received: true });
    } catch (error) {
      fastify.log.error(error, 'Error processing webhook');
      reply.status(500).send({ error: 'Webhook processing failed' });
    }
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata.invoiceId;
  
  if (!invoiceId) {
    console.error('No invoiceId in payment intent metadata');
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      contact: true,
      job: true,
    },
  });

  if (!invoice) {
    console.error(`Invoice not found: ${invoiceId}`);
    return;
  }

  // Update invoice status to paid
  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        action: 'invoice_paid',
        entity: 'Invoice',
        entityId: invoiceId,
        invoiceId: invoiceId,
        contactId: invoice.contactId,
        jobId: invoice.jobId,
        details: {
          paidAt: new Date(),
          amount: invoice.totalAmount,
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge,
        },
        orgId: invoice.orgId,
      },
    });
  });

  console.log(`Invoice ${invoice.invoiceNumber} marked as paid`);
  
  // Here you could trigger additional actions like:
  // - Send payment confirmation email
  // - Update analytics
  // - Trigger success chime in UI (via WebSocket)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata.invoiceId;
  
  if (!invoiceId) {
    console.error('No invoiceId in payment intent metadata');
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    console.error(`Invoice not found: ${invoiceId}`);
    return;
  }

  // Log the failed payment attempt
  await prisma.activityLog.create({
    data: {
      action: 'payment_failed',
      entity: 'Invoice',
      entityId: invoiceId,
      invoiceId: invoiceId,
      contactId: invoice.contactId,
      jobId: invoice.jobId,
      details: {
        failedAt: new Date(),
        paymentIntentId: paymentIntent.id,
        lastPaymentError: paymentIntent.last_payment_error,
      },
      orgId: invoice.orgId,
    },
  });

  console.log(`Payment failed for invoice ${invoice.invoiceNumber}`);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata.invoiceId;
  
  if (!invoiceId) {
    console.error('No invoiceId in payment intent metadata');
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    console.error(`Invoice not found: ${invoiceId}`);
    return;
  }

  // Log the canceled payment
  await prisma.activityLog.create({
    data: {
      action: 'payment_canceled',
      entity: 'Invoice',
      entityId: invoiceId,
      invoiceId: invoiceId,
      contactId: invoice.contactId,
      jobId: invoice.jobId,
      details: {
        canceledAt: new Date(),
        paymentIntentId: paymentIntent.id,
      },
      orgId: invoice.orgId,
    },
  });

  console.log(`Payment canceled for invoice ${invoice.invoiceNumber}`);
}