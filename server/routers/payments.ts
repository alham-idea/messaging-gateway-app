import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { trpcHandler, verifyOwnership } from "../_core/router-utils";

/**
 * Payments and Invoices Router
 * Handles payment processing, invoice generation, and refunds
 */
export const paymentsRouter = router({
  /**
   * Create a payment for subscription
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        paymentMethod: z.enum(["credit_card", "bank_transfer", "wallet", "other"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
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
      }, "Failed to create payment");
    }),

  /**
   * Get user's payment history
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const payments = await db.getUserPayments(ctx.user.id, input.limit, input.offset);
        return {
          payments: payments || [],
          total: payments?.length || 0,
        };
      }, "Failed to fetch payment history");
    }),

  /**
   * Get payment details
   */
  getPayment: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const payment = await db.getPaymentById(input.paymentId);
        verifyOwnership(payment, ctx.user.id, "Payment");
        return payment;
      }, "Failed to retrieve payment");
    }),

  /**
   * Update payment status
   */
  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        paymentId: z.number(),
        status: z.enum(["pending", "completed", "failed", "refunded"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const payment = await db.getPaymentById(input.paymentId);
        verifyOwnership(payment, ctx.user.id, "Payment");

        const updated = await db.updatePaymentStatus(input.paymentId, input.status);
        return {
          success: true,
          payment: updated,
        };
      }, "Failed to update payment status");
    }),

  /**
   * Create invoice for subscription
   */
  createInvoice: protectedProcedure
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
      return trpcHandler(async () => {
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
      }, "Failed to create invoice");
    }),

  /**
   * Get user's invoices
   */
  getInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
        status: z.enum(["draft", "issued", "paid", "overdue", "cancelled"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const invoices = await db.getUserInvoices(ctx.user.id);
        return {
          invoices: invoices || [],
          total: invoices?.length || 0,
        };
      }, "Failed to fetch invoices");
    }),

  /**
   * Get invoice details
   */
  getInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        verifyOwnership(invoice, ctx.user.id, "Invoice");
        return invoice;
      }, "Failed to retrieve invoice");
    }),

  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        paymentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        verifyOwnership(invoice, ctx.user.id, "Invoice");

        const updated = await db.updateInvoiceStatus(input.invoiceId, "paid");
        return {
          success: true,
          invoice: updated,
        };
      }, "Failed to mark invoice as paid");
    }),

  /**
   * Add payment method
   */
  addPaymentMethod: protectedProcedure
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
      return trpcHandler(async () => {
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
      }, "Failed to add payment method");
    }),

  /**
   * Get user's payment methods
   */
  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    return trpcHandler(async () => {
      const methods = await db.getUserPaymentMethods(ctx.user.id);
      return methods || [];
    }, "Failed to fetch payment methods");
  }),

  /**
   * Delete payment method
   */
  deletePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const method = await db.getPaymentMethodById(input.paymentMethodId);
        verifyOwnership(method, ctx.user.id, "Payment method");

        await db.deletePaymentMethod(input.paymentMethodId);
        return { success: true };
      }, "Failed to delete payment method");
    }),

  /**
   * Request refund
   */
  requestRefund: protectedProcedure
    .input(
      z.object({
        paymentId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const payment = await db.getPaymentById(input.paymentId);
        verifyOwnership(payment, ctx.user.id, "Payment");

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
      }, "Failed to request refund");
    }),

  /**
   * Get refund status
   */
  getRefund: protectedProcedure
    .input(z.object({ refundId: z.number() }))
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const refund = await db.getRefundById(input.refundId);
        verifyOwnership(refund, ctx.user.id, "Refund");
        return refund;
      }, "Failed to retrieve refund");
    }),

  /**
   * Apply coupon code
   */
  applyCoupon: protectedProcedure
    .input(
      z.object({
        couponCode: z.string(),
        amount: z.number().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      const coupon = await db.getCouponByCode(input.couponCode);
      if (!coupon || !coupon.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coupon not found or inactive" });
      }

      const now = new Date();
      if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon is not yet valid" });
      }
      if (coupon.validUntil && new Date(coupon.validUntil) < now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon has expired" });
      }

      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon usage limit reached" });
      }

      if (coupon.minAmount && input.amount < parseFloat(coupon.minAmount.toString())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum amount required: ${coupon.minAmount}` });
      }
      if (coupon.maxAmount && input.amount > parseFloat(coupon.maxAmount.toString())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Maximum amount allowed: ${coupon.maxAmount}` });
      }

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
    }),
});
