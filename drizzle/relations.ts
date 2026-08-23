import { relations } from "drizzle-orm";
import {
  coupons,
  devices,
  emailQueue,
  invoiceItems,
  invoices,
  notificationHistory,
  notificationPreferences,
  notifications,
  paymentMethods,
  payments,
  refunds,
  subscriptionHistory,
  subscriptionPlans,
  usageStatistics,
  userCouponUsage,
  userSubscriptions,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  subscriptionHistory: many(subscriptionHistory),
  payments: many(payments),
  invoices: many(invoices),
  usageStatistics: many(usageStatistics),
  devices: many(devices),
  paymentMethods: many(paymentMethods),
  refunds: many(refunds),
  couponUsage: many(userCouponUsage),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
  emailQueue: many(emailQueue),
  notificationHistory: many(notificationHistory),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  historyFrom: many(subscriptionHistory, { relationName: "historyFromPlan" }),
  historyTo: many(subscriptionHistory, { relationName: "historyToPlan" }),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionHistory.userId],
    references: [users.id],
  }),
  fromPlan: one(subscriptionPlans, {
    fields: [subscriptionHistory.fromPlanId],
    references: [subscriptionPlans.id],
    relationName: "historyFromPlan",
  }),
  toPlan: one(subscriptionPlans, {
    fields: [subscriptionHistory.toPlanId],
    references: [subscriptionPlans.id],
    relationName: "historyToPlan",
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  refunds: many(refunds),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  payments: many(payments),
  items: many(invoiceItems),
  couponUsage: many(userCouponUsage),
}));

export const usageStatisticsRelations = relations(usageStatistics, ({ one }) => ({
  user: one(users, {
    fields: [usageStatistics.userId],
    references: [users.id],
  }),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
  user: one(users, {
    fields: [refunds.userId],
    references: [users.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  usage: many(userCouponUsage),
}));

export const userCouponUsageRelations = relations(userCouponUsage, ({ one }) => ({
  user: one(users, {
    fields: [userCouponUsage.userId],
    references: [users.id],
  }),
  coupon: one(coupons, {
    fields: [userCouponUsage.couponId],
    references: [coupons.id],
  }),
  invoice: one(invoices, {
    fields: [userCouponUsage.invoiceId],
    references: [invoices.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  history: many(notificationHistory),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const emailQueueRelations = relations(emailQueue, ({ one }) => ({
  user: one(users, {
    fields: [emailQueue.userId],
    references: [users.id],
  }),
}));

export const notificationHistoryRelations = relations(notificationHistory, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationHistory.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [notificationHistory.userId],
    references: [users.id],
  }),
}));
