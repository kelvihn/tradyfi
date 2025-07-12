import {
  pgTable,
  decimal,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  unique,
  time,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const traderRates = pgTable("trader_rates", {
  id: serial("id").primaryKey(),
  traderId: integer("trader_id").notNull().references(() => traders.id, { onDelete: "cascade" }),
  currency: varchar("currency").notNull(), // e.g., "USDT", "BTC", "Solana", "Amazon", "iTunes"
  type: varchar("type", { enum: ["crypto", "giftcard"] }).notNull(),
  ratePerDollar: decimal("rate_per_dollar", { precision: 15, scale: 8 }).notNull(), // e.g., 2927.75
  currencySymbol: varchar("currency_symbol", { length: 10 }), // e.g., "ETH", "USD", "NGN"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for trader rates
export const traderRatesRelations = relations(traderRates, ({ one }) => ({
  trader: one(traders, {
    fields: [traderRates.traderId],
    references: [traders.id],
  }),
}));

// Update your existing tradersRelations to include rates
// Find your existing tradersRelations and add this line to the many() section:
// rates: many(traderRates),

// Insert schema for trader rates
export const insertTraderRateSchema = createInsertSchema(traderRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type TraderRate = typeof traderRates.$inferSelect;
export type InsertTraderRate = z.infer<typeof insertTraderRateSchema>;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const visitorNotifications = pgTable("visitor_notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  traderId: integer("trader_id").notNull().references(() => traders.id),
  userId: text("user_id").notNull().references(() => users.id),
  visitorName: text("visitor_name").notNull(),
  lastNotificationSent: timestamp("last_notification_sent").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserTrader: unique().on(table.traderId, table.userId),
}));

export const visitorNotificationsRelations = relations(visitorNotifications, ({ one }) => ({
  trader: one(traders, {
    fields: [visitorNotifications.traderId],
    references: [traders.id],
  }),
  user: one(users, {
    fields: [visitorNotifications.userId],
    references: [users.id],
  }),
}));

export type VisitorNotification = typeof visitorNotifications.$inferSelect;
export type InsertVisitorNotification = typeof visitorNotifications.$inferInsert;

export const userActivity = pgTable("user_activity", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  lastActivity: timestamp("last_activity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserId: unique().on(table.userId),
}));

// Email notifications tracking table
export const emailNotifications = pgTable("email_notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => chatRooms.id),
  sentAt: timestamp("sent_at").notNull(),
  notificationType: varchar("notification_type", { length: 50 }).default("chat_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  emailEnabled: boolean("email_enabled").default(true),
  emailAggregationMinutes: integer("email_aggregation_minutes").default(5),
  quietHoursStart: time("quiet_hours_start").default("22:00"),
  quietHoursEnd: time("quiet_hours_end").default("08:00"),
  urgentOnly: boolean("urgent_only").default(false),
  businessHoursOnly: boolean("business_hours_only").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  userId: varchar("user_id", { length: 191 }).notNull(),
  userType: varchar("user_type", { length: 50 }).notNull(), // 'trader' or 'user'
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertUserPushSubscription = typeof pushSubscriptions.$inferInsert;

// Add after your existing pushSubscriptions table
export const fcmTokens = pgTable("fcm_tokens", {
  id: varchar("id", { length: 191 }).primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 191 }).notNull(),
  userType: varchar("user_type", { length: 50 }).default("user").notNull(),
  token: text("token").notNull().unique(),
  deviceInfo: text("device_info"),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FCMToken = typeof fcmTokens.$inferSelect;
export type InsertFCMToken = typeof fcmTokens.$inferInsert;

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
  user: one(users, {
    fields: [fcmTokens.userId],
    references: [users.id],
  }),
}));

export const insertFCMTokenSchema = createInsertSchema(fcmTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Users table for basic authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  password: varchar("password").notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  role: varchar("role", { enum: ["user", "trader", "admin"] }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Traders table
export const traders = pgTable("traders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  // Replace nin field with document fields
  documentType: varchar("document_type", { enum: ["national_id", "drivers_license", "international_passport"] }),
  documentUrl: text("document_url"), // Cloudinary URL
  documentPublicId: text("document_public_id"), // For deletion from Cloudinary
  subdomain: text("subdomain").unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  status: varchar("status", { enum: ["unverified", "verification_pending", "verified", "suspended", "rejected"] }).default("unverified"),
  profileDescription: text("profile_description"),
  deactivationReason: text("deactivation_reason"), // Add this field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portal users (users who register on trader portals)
// shared/schema.ts - Update portalUsers table
export const portalUsers = pgTable("portal_users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  traderId: integer("trader_id").notNull().references(() => traders.id),
  firstInteractionDate: timestamp("first_interaction_date").defaultNow(),
  lastInteractionDate: timestamp("last_interaction_date").defaultNow(), 
  interactionCount: integer("interaction_count").default(1),
  preferences: jsonb("preferences").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat rooms for trader-user conversations
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  traderId: integer("trader_id").notNull().references(() => traders.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  tradingOption: varchar("trading_option", { enum: ["buy_crypto", "sell_crypto", "sell_gift_card"] }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  attachments: jsonb("attachments"), // Add this line
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  price: integer("price").notNull(), // Price in kobo (Paystack uses kobo)
  duration: integer("duration").notNull().default(30), // Duration in days
  paystackPlanCode: varchar("paystack_plan_code").unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userTypeEnum = pgEnum('user_type', ['user', 'trader']);

export const emailVerifications = pgTable('email_verifications', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  type: userTypeEnum('type').notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  paystackSubscriptionCode: varchar("paystack_subscription_code"),
  paystackCustomerCode: varchar("paystack_customer_code"),
  status: varchar("status", { enum: ["trial", "active", "cancelled", "expired"] }).notNull().default("trial"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  trialEndDate: timestamp("trial_end_date"),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MODIFY your existing usersRelations (don't create new one)
export const usersRelations = relations(users, ({ many }) => ({
  traders: many(traders),
  portalUsers: many(portalUsers),
  chatRooms: many(chatRooms),
  chatMessages: many(chatMessages),
  subscriptions: many(userSubscriptions),
  pushSubscriptions: many(pushSubscriptions), // existing
  fcmTokens: many(fcmTokens), // ADD this line
}));

export const tradersRelations = relations(traders, ({ one, many }) => ({
  user: one(users, {
    fields: [traders.userId],
    references: [users.id],
  }),
  portalUsers: many(portalUsers),
  chatRooms: many(chatRooms),
}));

export const portalUsersRelations = relations(portalUsers, ({ one }) => ({
  user: one(users, {
    fields: [portalUsers.userId],
    references: [users.id],
  }),
  trader: one(traders, {
    fields: [portalUsers.traderId],
    references: [traders.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  trader: one(traders, {
    fields: [chatRooms.traderId],
    references: [traders.id],
  }),
  user: one(users, {
    fields: [chatRooms.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chatRoom: one(chatRooms, {
    fields: [chatMessages.chatRoomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
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

// Insert schemas
export const insertTraderSchema = createInsertSchema(traders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortalUserSchema = createInsertSchema(portalUsers).omit({
  id: true,
  createdAt: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Trader = typeof traders.$inferSelect;
export type InsertTrader = z.infer<typeof insertTraderSchema>;
export type PortalUser = typeof portalUsers.$inferSelect;
export type InsertPortalUser = z.infer<typeof insertPortalUserSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
