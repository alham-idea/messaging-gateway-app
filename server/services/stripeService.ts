import Stripe from 'stripe';
import { getDb } from '../db';
import { payments, invoices, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Remove apiVersion to use default latest version
});

/**
 * Stripe Payment Service
 * Handles all payment processing and webhook events
 */

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export class StripeService {
  /**
   * Create a payment intent for subscription
   */
  async createPaymentIntent(
    userId: number,
    amount: number,
    currency: string = 'USD',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          userId: userId.toString(),
          ...metadata,
        },
      });

      return {
        id: intent.id,
        amount: intent.amount / 100,
        currency: intent.currency,
        status: intent.status,
        clientSecret: intent.client_secret || undefined,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentIntent> {
    try {
      const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        id: intent.id,
        amount: intent.amount / 100,
        currency: intent.currency,
        status: intent.status,
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(
    cardToken: string,
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: cardToken,
        },
        billing_details: billingDetails,
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : undefined,
      };
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(
    userId: number,
    email: string,
    name?: string
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString(),
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
      });

      return subscription.id;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: intent.id,
        amount: intent.amount / 100,
        currency: intent.currency,
        status: intent.status,
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  /**
   * List payment methods for customer
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return methods.data.map(method => ({
        id: method.id,
        type: method.type,
        card: method.card ? {
          brand: method.card.brand,
          last4: method.card.last4,
          expMonth: method.card.exp_month,
          expYear: method.card.exp_year,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw error;
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, db);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, db);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, db);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, db);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription, db);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    db: any
  ): Promise<void> {
    try {
      const userId = parseInt(paymentIntent.metadata?.userId || '0');
      if (!userId) return;

      // Record payment in database
      await db.insert(payments).values({
        userId,
        amount: (paymentIntent.amount / 100).toString(),
        currency: paymentIntent.currency.toUpperCase(),
        paymentStatus: 'completed',
        transactionId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Payment succeeded for user ${userId}: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    db: any
  ): Promise<void> {
    try {
      const userId = parseInt(paymentIntent.metadata?.userId || '0');
      if (!userId) return;

      // Record failed payment
      await db.insert(payments).values({
        userId,
        amount: (paymentIntent.amount / 100).toString(),
        currency: paymentIntent.currency.toUpperCase(),
        paymentStatus: 'failed',
        transactionId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Payment failed for user ${userId}: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
    db: any
  ): Promise<void> {
    try {
      console.log(`Invoice payment succeeded: ${invoice.id}`);
      // Update invoice status in database
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
    db: any
  ): Promise<void> {
    try {
      console.log(`Invoice payment failed: ${invoice.id}`);
      // Update invoice status in database
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCanceled(
    subscription: Stripe.Subscription,
    db: any
  ): Promise<void> {
    try {
      console.log(`Subscription canceled: ${subscription.id}`);
      // Update subscription status in database
    } catch (error) {
      console.error('Error handling subscription canceled:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
