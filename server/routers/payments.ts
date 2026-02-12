import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

/**
 * Payments and Invoices Router
 * Handles payment processing, invoice generation, and refunds
 */
export const paymentsRouter = router({
  /**
   * Create a payment for subscription
   */
  createPayment: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        paymentMethod: z.enum(["credit_card", "bank_transfer", "wallet", "other"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const payment = await db.createPayment({
          userId: ctx.user.id,
          amount: input.amount.toString(),
          paymentMethod: input.paymentMethod,
          description: input.description,
        });

        return {
          success: true,
          paymentId: payment.id,
          status: "pending",
        };
      } catch (error) {
        console.error("Payment creation error:", error);
        throw new Error("Failed to create payment");
      }
    }),

  /**
   * Get user's payment history
   */
  getPaymentHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const payments = await db.getUserPayments(ctx.user.id, input.limit, input.offset);
        return {
          payments: payments || [],
          total: payments?.length || 0,
        };
      } catch (error) {
        console.error("Payment history error:", error);
        return { payments: [], total: 0 };
      }
    }),

  /**
   * Get payment details
   */
  getPayment: publicProcedure
    .input(z.object({ paymentId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const payment = await db.getPaymentById(input.paymentId);
        if (!payment || payment.userId !== ctx.user.id) {
          throw new Error("Payment not found");
        }
        return payment;
      } catch (error) {
        console.error("Get payment error:", error);
        throw new Error("Failed to retrieve payment");
      }
    }),

  /**
   * Update payment status
   */
  updatePaymentStatus: publicProcedure
    .input(
      z.object({
        paymentId: z.number(),
        status: z.enum(["pending", "completed", "failed", "refunded"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const payment = await db.getPaymentById(input.paymentId);
        if (!payment || payment.userId !== ctx.user.id) {
          throw new Error("Payment not found");
        }

        const updated = await db.updatePaymentStatus(input.paymentId, input.status);
        return {
          success: true,
          payment: updated,
        };
      } catch (error) {
        console.error("Update payment status error:", error);
        throw new Error("Failed to update payment status");
      }
    }),

  /**
   * Create invoice for subscription
   */
  createInvoice: publicProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        amount: z.number().positive(),
        taxAmount: z.number().default(0),
        billingPeriodStart: z.date(),
        billingPeriodEnd: z.date(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const invoice = await db.createInvoice({
          userId: ctx.user.id,
          invoiceNumber,
          amount: input.amount.toString(),
          taxAmount: input.taxAmount.toString(),
          totalAmount: (input.amount + input.taxAmount).toString(),
          billingPeriodStart: input.billingPeriodStart,
          billingPeriodEnd: input.billingPeriodEnd,
          dueDate: input.dueDate,
        });

        return {
          success: true,
          invoiceId: invoice.id,
          invoiceNumber: invoiceNumber,
        };
      } catch (error) {
        console.error("Invoice creation error:", error);
        throw new Error("Failed to create invoice");
      }
    }),

  /**
   * Get user's invoices
   */
  getInvoices: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
        status: z.enum(["draft", "issued", "paid", "overdue", "cancelled"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const invoices = await db.getUserInvoices(ctx.user.id);
        return {
          invoices: invoices || [],
          total: invoices?.length || 0,
        };
      } catch (error) {
        console.error("Get invoices error:", error);
        return { invoices: [], total: 0 };
      }
    }),

  /**
   * Get invoice details
   */
  getInvoice: publicProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        return invoice;
      } catch (error) {
        console.error("Get invoice error:", error);
        throw new Error("Failed to retrieve invoice");
      }
    }),

  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid: publicProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        paymentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }

        const updated = await db.updateInvoiceStatus(input.invoiceId, "paid");
        return {
          success: true,
          invoice: updated,
        };
      } catch (error) {
        console.error("Mark invoice as paid error:", error);
        throw new Error("Failed to mark invoice as paid");
      }
    }),

  /**
   * Add payment method
   */
  addPaymentMethod: publicProcedure
    .input(
      z.object({
        methodType: z.enum(["credit_card", "debit_card", "bank_account", "wallet"]),
        last4: z.string().length(4).optional(),
        cardBrand: z.string().optional(),
        expiryMonth: z.number().optional(),
        expiryYear: z.number().optional(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const paymentMethod = await db.addPaymentMethod({
          userId: ctx.user.id,
          methodType: input.methodType,
          last4: input.last4,
          cardBrand: input.cardBrand,
          expiryMonth: input.expiryMonth,
          expiryYear: input.expiryYear,
          isDefault: input.isDefault,
        });

        return {
          success: true,
          paymentMethodId: paymentMethod.id,
        };
      } catch (error) {
        console.error("Add payment method error:", error);
        throw new Error("Failed to add payment method");
      }
    }),

  /**
   * Get user's payment methods
   */
  getPaymentMethods: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    try {
      const methods = await db.getUserPaymentMethods(ctx.user.id);
      return methods || [];
    } catch (error) {
      console.error("Get payment methods error:", error);
      return [];
    }
  }),

  /**
   * Delete payment method
   */
  deletePaymentMethod: publicProcedure
    .input(z.object({ paymentMethodId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const method = await db.getPaymentMethodById(input.paymentMethodId);
        if (!method || method.userId !== ctx.user.id) {
          throw new Error("Payment method not found");
        }

        await db.deletePaymentMethod(input.paymentMethodId);
        return { success: true };
      } catch (error) {
        console.error("Delete payment method error:", error);
        throw new Error("Failed to delete payment method");
      }
    }),

  /**
   * Request refund
   */
  requestRefund: publicProcedure
    .input(
      z.object({
        paymentId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const payment = await db.getPaymentById(input.paymentId);
        if (!payment || payment.userId !== ctx.user.id) {
          throw new Error("Payment not found");
        }

        const refund = await db.createRefund({
          paymentId: input.paymentId,
          userId: ctx.user.id,
          amount: payment.amount,
          reason: input.reason,
          refundStatus: "pending",
        });

        return {
          success: true,
          refundId: refund.id,
          status: "pending",
        };
      } catch (error) {
        console.error("Request refund error:", error);
        throw new Error("Failed to request refund");
      }
    }),

  /**
   * Get refund status
   */
  getRefund: publicProcedure
    .input(z.object({ refundId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const refund = await db.getRefundById(input.refundId);
        if (!refund || refund.userId !== ctx.user.id) {
          throw new Error("Refund not found");
        }
        return refund;
      } catch (error) {
        console.error("Get refund error:", error);
        throw new Error("Failed to retrieve refund");
      }
    }),

  /**
   * Apply coupon code
   */
  applyCoupon: publicProcedure
    .input(
      z.object({
        couponCode: z.string(),
        amount: z.number().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const coupon = await db.getCouponByCode(input.couponCode);
        if (!coupon || !coupon.isActive) {
          throw new Error("Coupon not found or inactive");
        }

        // Check coupon validity
        const now = new Date();
        if (coupon.validFrom && new Date(coupon.validFrom) > now) {
          throw new Error("Coupon is not yet valid");
        }
        if (coupon.validUntil && new Date(coupon.validUntil) < now) {
          throw new Error("Coupon has expired");
        }

        // Check usage limits
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          throw new Error("Coupon usage limit reached");
        }

        // Check amount limits
        if (coupon.minAmount && input.amount < parseFloat(coupon.minAmount.toString())) {
          throw new Error(`Minimum amount required: ${coupon.minAmount}`);
        }
        if (coupon.maxAmount && input.amount > parseFloat(coupon.maxAmount.toString())) {
          throw new Error(`Maximum amount allowed: ${coupon.maxAmount}`);
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
          discountAmount = (input.amount * parseFloat(coupon.discountValue.toString())) / 100;
        } else {
          discountAmount = parseFloat(coupon.discountValue.toString());
        }

        return {
          success: true,
          couponCode: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          finalAmount: input.amount - discountAmount,
        };
      } catch (error) {
        console.error("Apply coupon error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to apply coupon");
      }
    }),
});
