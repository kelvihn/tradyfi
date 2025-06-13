import {
  users,
  traders,
  portalUsers,
  chatRooms,
  chatMessages,
  subscriptionPlans,
  userSubscriptions,
  type User,
  type UpsertUser,
  type Trader,
  type InsertTrader,
  type PortalUser,
  type InsertPortalUser,
  type ChatRoom,
  type InsertChatRoom,
  type ChatMessage,
  type InsertChatMessage,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UserSubscription,
  type InsertUserSubscription,
  NewEmailVerification,
  emailVerifications,
  InsertUserPushSubscription,
  UserPushSubscription,
  pushSubscriptions,
  fcmTokens,
  FCMToken,
  InsertFCMToken,
  userActivity,
  emailNotifications,
  notificationPreferences,
  type NotificationPreference,
  type InsertNotificationPreference,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, or, ne, exists } from "drizzle-orm";

export interface IStorage {

  getTraderByEmail(email: string): Promise<TraderWithUser | undefined>;
  checkEmailExists(email: string): Promise<{ exists: boolean; userType: 'trader' | 'user' | null }>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;

  createFCMToken(data: Omit<InsertFCMToken, 'id' | 'createdAt' | 'updatedAt'>): Promise<FCMToken>;
  getFCMTokenByToken(token: string): Promise<FCMToken | undefined>;
  getFCMTokensByUserId(userId: string): Promise<FCMToken[]>;
  updateFCMToken(id: string, updates: Partial<InsertFCMToken>): Promise<FCMToken>;
  removeFCMToken(token: string): Promise<void>;
  removeFCMTokenByUserAndToken(userId: string, token: string): Promise<void>;
  cleanupInvalidFCMTokens(): Promise<number>;
  // User operations (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Trader operations
  createTrader(trader: InsertTrader): Promise<Trader>;
  getTrader(id: number): Promise<Trader | undefined>;
  getTraderByUserId(userId: string): Promise<Trader | undefined>;
  getTraderBySubdomain(subdomain: string): Promise<Trader | undefined>;
  getTraderByNin(nin: string): Promise<Trader | undefined>;
  updateTrader(id: number, updates: Partial<InsertTrader>): Promise<Trader>;
  getAllTraders(): Promise<Trader[]>;
  getPendingTraders(): Promise<(Trader & { email: string; firstName: string; lastName: string })[]>;
  
  // Portal user operations
  createPortalUser(portalUser: InsertPortalUser): Promise<PortalUser>;
  getPortalUsersByTrader(traderId: number): Promise<PortalUser[]>;
  getPortalUserByUserAndTrader(userId: string, traderId: number): Promise<PortalUser | undefined>;
  
  // Chat operations
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRoomByUserAndTrader(userId: string, traderId: number, tradingOption: string): Promise<ChatRoom | undefined>;
  getChatRoomsByTrader(traderId: number): Promise<ChatRoom[]>;
  getChatRoomsByUser(userId: string): Promise<ChatRoom[]>;
  
  // Message operations
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessagesByRoom(chatRoomId: number): Promise<ChatMessage[]>;
  markMessagesAsRead(roomId: number, userId: string): Promise<void>;
  getUnreadMessageCount(chatRoomId: number, userId: string): Promise<number>;
  
  // Subscription operations (for traders only)
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  
  createTraderSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  getTraderSubscription(traderId: string): Promise<UserSubscription | undefined>;
  updateTraderSubscription(id: number, updates: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  getTraderSubscriptionWithPlan(traderId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined>;
  // Updated/new chat methods
  verifyUserChatAccess(userId: string, roomId: number): Promise<boolean>;
  getChatMessages(roomId: number, page?: number, limit?: number): Promise<any[]>;
  createChatMessage(messageData: {
    chatRoomId: number;
    senderId: string;
    message: string;
    attachments?: any;
  }): Promise<ChatMessage>;
  getExistingChatRoom(traderId: number, userId: string, tradingOption: string): Promise<ChatRoom | undefined>;
  createChatRoom(roomData: {
    traderId: number;
    userId: string;
    tradingOption: string;
  }): Promise<ChatRoom>;
  getUserChatRooms(userId: string): Promise<any[]>;
  getTraderChatRooms(traderId: number): Promise<any[]>;
  createPushSubscription(data: Omit<InsertUserPushSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserPushSubscription>;
  getPushSubscription(userId: string, endpoint: string): Promise<UserPushSubscription | undefined>;
  getUserPushSubscriptions(userId: string): Promise<UserPushSubscription[]>;
  updatePushSubscription(id: string, updates: Partial<InsertUserPushSubscription>): Promise<UserPushSubscription>;
  deletePushSubscription(userId: string, endpoint?: string): Promise<void>;

  updateUserLastActivity(userId: string): Promise<void>;
  getUserLastActivity(userId: string): Promise<Date | null>;
  
  // Email notification tracking
  recordEmailNotificationSent(userId: string, roomId: number): Promise<void>;
  getLastEmailNotificationTime(userId: string, roomId: number): Promise<Date | null>;
  getTodayEmailCount(userId: string): Promise<number>;
  
  // Notification preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: string, preferences: Partial<InsertNotificationPreference>): Promise<NotificationPreference>;
  
}

export interface EmailVerification {
  email: string;
  otp: string;
  expiresAt: Date;
  type: 'user' | 'trader';
  verified: boolean;
  createdAt: Date;
}

export type TraderWithUser = Trader & {
  email: string;
  firstName: string;
  lastName: string;
};

export class DatabaseStorage implements IStorage {

  async createFCMToken(data: Omit<InsertFCMToken, 'id' | 'createdAt' | 'updatedAt'>): Promise<FCMToken> {
  const [token] = await db.insert(fcmTokens)
    .values({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return token;
}

async getTraderByEmail(email: string): Promise<TraderWithUser | undefined> {
  const [result] = await db
    .select({
      // Trader fields
      id: traders.id,
      userId: traders.userId,
      businessName: traders.businessName,
      contactInfo: traders.contactInfo,
      documentType: traders.documentType,
      documentUrl: traders.documentUrl,
      documentPublicId: traders.documentPublicId,
      subdomain: traders.subdomain,
      emailVerified: traders.emailVerified,
      status: traders.status,
      profileDescription: traders.profileDescription,
      createdAt: traders.createdAt,
      updatedAt: traders.updatedAt,
      // User fields
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(traders)
    .innerJoin(users, eq(traders.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);

  return result as TraderWithUser | undefined;
}

// Check if any user exists with email (both regular users and traders)
async checkEmailExists(email: string): Promise<{ exists: boolean; userType: 'trader' | 'user' | null }> {
  const user = await this.getUserByEmail(email);
  
  if (!user) {
    return { exists: false, userType: null };
  }
  
  // Check if user is a trader
  const trader = await this.getTraderByUserId(user.id);
  
  return { 
    exists: true, 
    userType: trader ? 'trader' : 'user' 
  };
}

// Update user password (for password reset)
async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ 
      password: hashedPassword,
      updatedAt: new Date() 
    })
    .where(eq(users.id, userId))
    .returning();
  
  return user;
}

async getFCMTokenByToken(token: string): Promise<FCMToken | undefined> {
  const [fcmToken] = await db.select()
    .from(fcmTokens)
    .where(eq(fcmTokens.token, token))
    .limit(1);
  return fcmToken;
}

async getFCMTokensByUserId(userId: string): Promise<FCMToken[]> {
  return await db.select()
    .from(fcmTokens)
    .where(and(
      eq(fcmTokens.userId, userId), 
      eq(fcmTokens.isActive, true)
    ))
    .orderBy(desc(fcmTokens.lastUsed));
}

async updateFCMToken(id: string, updates: Partial<InsertFCMToken>): Promise<FCMToken> {
  const [token] = await db.update(fcmTokens)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(fcmTokens.id, id))
    .returning();
  return token;
}

async removeFCMToken(token: string): Promise<void> {
  await db.delete(fcmTokens)
    .where(eq(fcmTokens.token, token));
}

async removeFCMTokenByUserAndToken(userId: string, token: string): Promise<void> {
  await db.delete(fcmTokens)
    .where(and(
      eq(fcmTokens.userId, userId),
      eq(fcmTokens.token, token)
    ));
}

async cleanupInvalidFCMTokens(): Promise<number> {
  // Remove tokens that haven't been used in 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await db.delete(fcmTokens)
    .where(or(
      eq(fcmTokens.isActive, false),
      sql`${fcmTokens.lastUsed} < ${thirtyDaysAgo}`
    ));
  
  // Get count of deleted rows (this depends on your DB driver)
  // For most SQL drivers, result.rowCount or result.affectedRows
  return result.rowCount || 0;
}

  async createPushSubscription(data: Omit<InsertUserPushSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserPushSubscription> {
  const [subscription] = await db.insert(pushSubscriptions)
    .values({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return subscription;
}

async getPushSubscription(userId: string, endpoint: string): Promise<UserPushSubscription | undefined> {
  const [subscription] = await db.select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
    .limit(1);
  return subscription;
}

async getUserPushSubscriptions(userId: string): Promise<UserPushSubscription[]> {
  return await db.select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)));
}

async updatePushSubscription(id: string, updates: Partial<InsertUserPushSubscription>): Promise<UserPushSubscription> {
  const [subscription] = await db.update(pushSubscriptions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(pushSubscriptions.id, id))
    .returning();
  return subscription;
}

async deletePushSubscription(userId: string, endpoint?: string): Promise<void> {
  if (endpoint) {
    await db.delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  } else {
    await db.delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }
}
    
  async createEmailVerification(data: Omit<NewEmailVerification, 'id' | 'createdAt'>) {
    // Delete any existing verification for this email
    await db.delete(emailVerifications).where(eq(emailVerifications.email, data.email));
    
    // Insert new verification
    const [verification] = await db.insert(emailVerifications)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    
    return verification;
  }

  async getEmailVerification(email: string): Promise<EmailVerification | undefined> {
    const [verification] = await db.select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, email))
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);
    
    return verification;
  }

  async updateEmailVerification(email: string, data: Partial<EmailVerification>) {
    const [updated] = await db.update(emailVerifications)
      .set(data)
      .where(eq(emailVerifications.email, email))
      .returning();
    
    return updated;
  }


  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
  const rooms = await db  // Remove the [rooms] destructuring
    .select({
      id: chatRooms.id,
      traderId: chatRooms.traderId,
      userId: chatRooms.userId,
      tradingOption: chatRooms.tradingOption, // Add if exists in schema
      isActive: chatRooms.isActive,
      createdAt: chatRooms.createdAt,
      updatedAt: chatRooms.updatedAt,
    })
    .from(chatRooms)
    .where(and(
      eq(chatRooms.userId, userId),
      eq(chatRooms.isActive, true)
    ))
    .orderBy(desc(chatRooms.createdAt));

  return rooms; // Return the full array
}

  // User operations (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }


  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

 async  getUserByEmailAndSubdomain(email: string, subdomain: string) {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      traderId: traders.id,
      subdomain: traders.subdomain,
    })
    .from(users)
    .innerJoin(portalUsers, eq(users.id, portalUsers.userId))
    .innerJoin(traders, eq(portalUsers.traderId, traders.id))
    .where(and(eq(users.email, email), eq(traders.subdomain, subdomain)))
    .limit(1);

  return result[0] || null;
}

// New methods we need to add
async checkUserExistsForTrader(email: string, traderId: number): Promise<boolean> {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(portalUsers, eq(users.id, portalUsers.userId))
    .where(
      and(eq(users.email, email), eq(portalUsers.traderId, traderId))
    )
    .limit(1);

  return !!existingUser;
}

async linkUserToTrader(userId: string, traderId: string): Promise<void> {
  await db.insert(portalUsers).values({
    userId,
    traderId: parseInt(traderId), // Convert string to number
  });
}

async createUserWithTraderLink(
  userData: Omit<User, 'createdAt' | 'updatedAt'>, 
  traderId: number
): Promise<User> {
  return await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await tx.insert(portalUsers).values({
      userId: user.id,
      traderId: traderId
    });

    return user;
  });
}

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
  const verification = await this.getEmailVerification(userData.email);
  if (!verification || !verification.verified) {
    throw new Error('Email not verified');
  }

  const [user] = await db
    .insert(users)
    .values({
      ...userData,
      id: userData.id || crypto.randomUUID(), // Generate ID if not provided
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return user;
}

async getTraderByDocumentUrl(documentUrl: string): Promise<Trader | undefined> {
  const [trader] = await db.select().from(traders).where(eq(traders.documentUrl, documentUrl));
  return trader;
}

  // Trader operations
async createTrader(trader: InsertTrader): Promise<Trader> {
  const [newTrader] = await db.insert(traders).values({
    ...trader,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return newTrader;
}

  async getTrader(id: number): Promise<Trader | undefined> {
    const [trader] = await db.select().from(traders).where(eq(traders.id, id));
    return trader;
  }

  async getTraderByUserId(userId: string): Promise<Trader | undefined> {
    const [trader] = await db.select().from(traders).where(eq(traders.userId, userId));
    return trader;
  }

  async getTraderBySubdomain(subdomain: string): Promise<Trader | undefined> {
    const [trader] = await db.select().from(traders).where(eq(traders.subdomain, subdomain));
    return trader;
  }

  async getTraderByNin(nin: string): Promise<Trader | undefined> {
    const [trader] = await db.select().from(traders).where(eq(traders.nin, nin));
    return trader;
  }

  async updateTrader(id: number, updates: Partial<InsertTrader>): Promise<Trader> {
    const [trader] = await db
      .update(traders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(traders.id, id))
      .returning();
    return trader;
  }

  async getAdminStats() {
  const allTraders = await this.getAllTraders();
  const pendingTraders = allTraders.filter(t => t.status === 'verification_pending');
  const approvedTraders = allTraders.filter(t => t.status === 'verified');
  const rejectedTraders = allTraders.filter(t => t.status === 'rejected');
  const suspendedTraders = allTraders.filter(t => t.status === 'suspended'); // Updated to use 'suspended'
  
  // Get subscription stats (if you have this method)
  const subscriptionStats = await this.getSubscriptionStats();
  
  return {
    totalTraders: allTraders.length,
    pendingApprovals: pendingTraders.length,
    approvedTraders: approvedTraders.length,
    rejectedTraders: rejectedTraders.length,
    suspendedTraders: suspendedTraders.length, // Updated to use 'suspended'
    ...subscriptionStats
  };
}

// Optional: Add helper methods for filtering traders by status
async getActiveTraders(): Promise<Trader[]> {
  return await db
    .select()
    .from(traders)
    .where(eq(traders.status, 'verified'));
}

async getSuspendedTraders(): Promise<Trader[]> {
  return await db
    .select()
    .from(traders)
    .where(eq(traders.status, 'suspended'));
}

// Update the getPendingTraders method to include user data
async getPendingTraders(): Promise<TraderWithUser[]> {
  const result = await db
    .select({
      // Trader fields - include ALL trader fields
      id: traders.id,
      userId: traders.userId,
      businessName: traders.businessName,
      contactInfo: traders.contactInfo,
      documentType: traders.documentType,
      documentUrl: traders.documentUrl,
      documentPublicId: traders.documentPublicId,
      subdomain: traders.subdomain,
      emailVerified: traders.emailVerified,
      status: traders.status,
      profileDescription: traders.profileDescription,
      createdAt: traders.createdAt,
      updatedAt: traders.updatedAt,
      // User fields
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(traders)
    .innerJoin(users, eq(traders.userId, users.id))
    .where(eq(traders.status, "verification_pending"))
    .orderBy(desc(traders.createdAt));

  return result as TraderWithUser[];
}

// Update the getAllTraders method to include user data
async getAllTraders(): Promise<TraderWithUser[]> {
  const result = await db
    .select({
      // Trader fields - include ALL trader fields
      id: traders.id,
      userId: traders.userId,
      businessName: traders.businessName,
      contactInfo: traders.contactInfo,
      documentType: traders.documentType,
      documentUrl: traders.documentUrl,
      documentPublicId: traders.documentPublicId,
      subdomain: traders.subdomain,
      emailVerified: traders.emailVerified,
      status: traders.status,
      profileDescription: traders.profileDescription,
      createdAt: traders.createdAt,
      updatedAt: traders.updatedAt,
      // User fields
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(traders)
    .innerJoin(users, eq(traders.userId, users.id))
    .orderBy(desc(traders.createdAt));

  return result as TraderWithUser[];
}

  // Portal user operations
  async createPortalUser(portalUser: InsertPortalUser): Promise<PortalUser> {
    const [newPortalUser] = await db.insert(portalUsers).values(portalUser).returning();
    return newPortalUser;
  }

  async getPortalUsersByTrader(traderId: number): Promise<PortalUser[]> {
    return await db.select().from(portalUsers).where(eq(portalUsers.traderId, traderId));
  }

  async getPortalUserByUserAndTrader(userId: string, traderId: number): Promise<PortalUser | undefined> {
    const [portalUser] = await db
      .select()
      .from(portalUsers)
      .where(and(eq(portalUsers.userId, userId), eq(portalUsers.traderId, traderId)));
    return portalUser;
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return chatRoom;
  }

  async getChatRoomsByTrader(traderId: number): Promise<ChatRoom[]> {
    return await db
      .select()
      .from(chatRooms)
      .where(and(eq(chatRooms.traderId, traderId), eq(chatRooms.isActive, true)))
      .orderBy(desc(chatRooms.updatedAt));
  }

  // Message operations
  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    
    // Update chat room timestamp
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.id, message.chatRoomId));
    
    return newMessage;
  }

  async getMessagesByRoom(chatRoomId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoomId, chatRoomId))
      .orderBy(chatMessages.createdAt);
  }

  // Subscription operations (for traders only)
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
  }

  async updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan;
  }

  async createTraderSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db
      .insert(userSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async getTraderSubscription(traderId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, traderId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async updateTraderSubscription(id: number, updates: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscription] = await db
      .update(userSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return subscription;
  }

  async getTraderSubscriptionWithPlan(traderId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined> {
    const [result] = await db
      .select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        paystackSubscriptionCode: userSubscriptions.paystackSubscriptionCode,
        paystackCustomerCode: userSubscriptions.paystackCustomerCode,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        trialEndDate: userSubscriptions.trialEndDate,
        autoRenew: userSubscriptions.autoRenew,
        createdAt: userSubscriptions.createdAt,
        updatedAt: userSubscriptions.updatedAt,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, traderId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    
    return result ? { ...result, plan: result.plan! } : undefined;
  }

  // Analytics methods for admin dashboard
  async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    expiredSubscriptions: number;
    totalRevenue: number;
    monthlyRevenue: number;
  }> {
    const allSubscriptions = await db
      .select({
        id: userSubscriptions.id,
        status: userSubscriptions.status,
        planPrice: subscriptionPlans.price,
        createdAt: userSubscriptions.createdAt,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: allSubscriptions.filter(s => s.status === 'active').length,
      trialSubscriptions: allSubscriptions.filter(s => s.status === 'trial').length,
      expiredSubscriptions: allSubscriptions.filter(s => s.status === 'expired').length,
      totalRevenue: allSubscriptions
        .filter(s => s.status === 'active' && s.planPrice && s.planPrice > 0)
        .reduce((sum, s) => sum + ((s.planPrice || 0) / 100), 0), // Convert from kobo to naira
      monthlyRevenue: allSubscriptions
        .filter(s => s.status === 'active' && s.planPrice && s.planPrice > 0 && s.createdAt && new Date(s.createdAt) >= monthStart)
        .reduce((sum, s) => sum + ((s.planPrice || 0) / 100), 0),
    };

    return stats;
  }

  async getTrialPlan(): Promise<SubscriptionPlan | undefined> {
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.price, 0))
    .limit(1);
  return plan;
}

  async getSubscriptionAnalytics(): Promise<{
    recentSubscriptions: Array<{
      id: number;
      userName: string;
      planName: string;
      amount: number;
      status: string;
      createdAt: Date;
    }>;
    monthlyTrend: Array<{
      month: string;
      revenue: number;
      subscriptions: number;
    }>;
  }> {
    // Get recent subscriptions with user and plan details
    const recentSubscriptions = await db
      .select({
        id: userSubscriptions.id,
        userName: users.email,
        planName: subscriptionPlans.name,
        amount: subscriptionPlans.price,
        status: userSubscriptions.status,
        createdAt: userSubscriptions.createdAt,
      })
      .from(userSubscriptions)
      .leftJoin(users, eq(userSubscriptions.userId, users.id))
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.status, 'active'))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(10);

    // Get monthly trend for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await db
      .select({
        month: userSubscriptions.createdAt,
        amount: subscriptionPlans.price,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.status, 'active'));

    // Process monthly trend data
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthData = monthlyData.filter(item => 
        item.month && item.month.toISOString().slice(0, 7) === monthKey
      );
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthData.reduce((sum, item) => sum + (item.amount || 0) / 100, 0),
        subscriptions: monthData.length,
      });
    }

    return {
      recentSubscriptions: recentSubscriptions.map(sub => ({
        ...sub,
        amount: (sub.amount || 0) / 100, // Convert from kobo to naira
        userName: sub.userName || 'Unknown',
        planName: sub.planName || 'Unknown',
        createdAt: sub.createdAt || new Date(),
      })),
      monthlyTrend,
    };
  }

  // Add these methods to your DatabaseStorage class in storage.ts
// Replace/update the existing chat methods with these improved versions

// Verify user has access to chat room (for API security)
async verifyUserChatAccess(userId: string, roomId: number): Promise<boolean> {
  const [room] = await db
    .select()
    .from(chatRooms)
    .where(
      and(
        eq(chatRooms.id, roomId),
        or(
          eq(chatRooms.userId, userId),
          // Also check if user is the trader who owns this chat room
          exists(
            db.select()
              .from(traders)
              .where(
                and(
                  eq(traders.id, chatRooms.traderId),
                  eq(traders.userId, userId)
                )
              )
          )
        )
      )
    )
    .limit(1);

  return !!room;
}

// Get chat messages with pagination and proper user info
async getChatMessages(roomId: number, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;
  
  const messages = await db
    .select({
      id: chatMessages.id,
      senderId: chatMessages.senderId,
      content: chatMessages.message,
      timestamp: chatMessages.createdAt,
      isRead: chatMessages.isRead,
      attachments: chatMessages.attachments, // This is already a JS object from JSONB
      senderName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      isTrader: sql<boolean>`CASE 
        WHEN EXISTS (
          SELECT 1 FROM ${traders} 
          WHERE ${traders.userId} = ${chatMessages.senderId}
        ) THEN true 
        ELSE false 
      END`,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(eq(chatMessages.chatRoomId, roomId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .offset(offset);

  // Don't parse attachments - they're already objects from JSONB
  return messages.reverse().map(message => ({
    ...message,
    attachments: message.attachments || null // Just use as-is, no JSON.parse needed
  }));
}

// Create a new chat message (updated to match API expectations)
async createChatMessage(messageData: {
  chatRoomId: number;
  senderId: string;
  message: string;
  attachments?: any;
}): Promise<ChatMessage> {
  const [message] = await db
    .insert(chatMessages)
    .values({
      chatRoomId: messageData.chatRoomId,
      senderId: messageData.senderId,
      message: messageData.message,
      // Don't stringify - JSONB handles objects directly
      attachments: messageData.attachments || null,
      isRead: false,
      createdAt: new Date(),
    })
    .returning();

  // Update chat room's updatedAt timestamp
  await db
    .update(chatRooms)
    .set({ updatedAt: new Date() })
    .where(eq(chatRooms.id, messageData.chatRoomId));

  return message;
}

// Get existing chat room (updated method signature)
async getExistingChatRoom(traderId: number, userId: string, tradingOption: string) {
  const [room] = await db
    .select()
    .from(chatRooms)
    .where(
      and(
        eq(chatRooms.traderId, traderId),
        eq(chatRooms.userId, userId),
        eq(chatRooms.tradingOption, tradingOption as any),
        eq(chatRooms.isActive, true)
      )
    )
    .limit(1);

  return room;
}

// Create a new chat room (updated method signature)
async createChatRoom(roomData: {
  traderId: number;
  userId: string;
  tradingOption: string;
}): Promise<ChatRoom> {
  const [room] = await db
    .insert(chatRooms)
    .values({
      traderId: roomData.traderId,
      userId: roomData.userId,
      tradingOption: roomData.tradingOption as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return room;
}

// Get user's chat rooms with additional info (updated for portal users)
async getUserChatRooms(userId: string) {
  const rooms = await db
    .select({
      id: chatRooms.id,
      tradingOption: chatRooms.tradingOption,
      isActive: chatRooms.isActive,
      updatedAt: chatRooms.updatedAt,
      traderName: traders.businessName,
      traderId: traders.id,
      unreadCount: sql<number>`
        (SELECT COUNT(*) FROM ${chatMessages} 
         WHERE ${chatMessages.chatRoomId} = ${chatRooms.id} 
         AND ${chatMessages.senderId} != ${userId}
         AND ${chatMessages.isRead} = false)
      `,
      lastMessage: sql<string>`
        (SELECT ${chatMessages.message} FROM ${chatMessages} 
         WHERE ${chatMessages.chatRoomId} = ${chatRooms.id}
         ORDER BY ${chatMessages.createdAt} DESC 
         LIMIT 1)
      `,
    })
    .from(chatRooms)
    .innerJoin(traders, eq(chatRooms.traderId, traders.id))
    .where(eq(chatRooms.userId, userId))
    .orderBy(desc(chatRooms.updatedAt));

  return rooms;
}

// Get trader's chat rooms (for trader dashboard)
async getTraderChatRooms(traderId: number) {
  const rooms = await db
    .select({
      id: chatRooms.id,
      tradingOption: chatRooms.tradingOption,
      isActive: chatRooms.isActive,
      updatedAt: chatRooms.updatedAt,
      createdAt: chatRooms.createdAt,
      userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      userEmail: users.email,
      userId: users.id,
      unreadCount: sql<number>`
        (SELECT COUNT(*) FROM ${chatMessages} 
         WHERE ${chatMessages.chatRoomId} = ${chatRooms.id} 
         AND ${chatMessages.senderId} = ${users.id}
         AND ${chatMessages.isRead} = false)
      `,
      lastMessage: sql<string>`
        (SELECT ${chatMessages.message} FROM ${chatMessages} 
         WHERE ${chatMessages.chatRoomId} = ${chatRooms.id}
         ORDER BY ${chatMessages.createdAt} DESC 
         LIMIT 1)
      `,
      lastMessageTime: sql<Date>`
        (SELECT ${chatMessages.createdAt} FROM ${chatMessages} 
         WHERE ${chatMessages.chatRoomId} = ${chatRooms.id}
         ORDER BY ${chatMessages.createdAt} DESC 
         LIMIT 1)
      `,
    })
    .from(chatRooms)
    .innerJoin(users, eq(chatRooms.userId, users.id))
    .where(and(eq(chatRooms.traderId, traderId), eq(chatRooms.isActive, true)))
    .orderBy(desc(chatRooms.updatedAt));

  return rooms;
}
// Update the existing methods to fix type issues:

// Fix the getChatRoomByUserAndTrader method signature
async getChatRoomByUserAndTrader(userId: string, traderId: number, tradingOption: string): Promise<ChatRoom | undefined> {
  const [chatRoom] = await db
    .select()
    .from(chatRooms)
    .where(
      and(
        eq(chatRooms.userId, userId),
        eq(chatRooms.traderId, traderId),
        eq(chatRooms.tradingOption, tradingOption as any)
      )
    );
  return chatRoom;
}

// Fix the markMessagesAsRead method (the current one has wrong logic)
async markMessagesAsRead(chatRoomId: number, userId: string): Promise<void> {
  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(chatMessages.chatRoomId, chatRoomId),
        ne(chatMessages.senderId, userId), // Mark messages NOT sent by this user as read
        eq(chatMessages.isRead, false)
      )
    );
}

// Fix the getUnreadMessageCount method
async getUnreadMessageCount(chatRoomId: number, userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.chatRoomId, chatRoomId),
        eq(chatMessages.isRead, false),
        ne(chatMessages.senderId, userId) // Count messages NOT sent by this user
      )
    );
  return result.count;
}

async updateUserLastActivity(userId: string): Promise<void> {
  try {
    await db
      .insert(userActivity)
      .values({
        userId,
        lastActivity: new Date(),
      })
      .onConflictDoUpdate({
        target: userActivity.userId,
        set: {
          lastActivity: new Date(),
        },
      });
    
    console.log(`📍 Updated activity for user ${userId}`);
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
}

async getUserLastActivity(userId: string): Promise<Date | null> {
  try {
    const [result] = await db
      .select({ lastActivity: userActivity.lastActivity })
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .limit(1);
    
    return result?.lastActivity || null;
  } catch (error) {
    console.error('Error getting user last activity:', error);
    return null;
  }
}

// Email notification tracking
async recordEmailNotificationSent(userId: string, roomId: number): Promise<void> {
  try {
    await db
      .insert(emailNotifications)
      .values({
        userId,
        roomId,
        sentAt: new Date(),
        notificationType: 'chat_message',
      });
    
    console.log(`📧 Recorded email notification for user ${userId} in room ${roomId}`);
  } catch (error) {
    console.error('Error recording email notification:', error);
    throw error;
  }
}

async getLastEmailNotificationTime(userId: string, roomId: number): Promise<Date | null> {
  try {
    const [result] = await db
      .select({ sentAt: emailNotifications.sentAt })
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.userId, userId),
          eq(emailNotifications.roomId, roomId)
        )
      )
      .orderBy(desc(emailNotifications.sentAt))
      .limit(1);
    
    return result?.sentAt || null;
  } catch (error) {
    console.error('Error getting last email notification time:', error);
    return null;
  }
}

async getTodayEmailCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [result] = await db
      .select({ count: count() })
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.userId, userId),
          sql`${emailNotifications.sentAt} >= ${today}`,
          sql`${emailNotifications.sentAt} < ${tomorrow}`
        )
      );
    
    return result.count;
  } catch (error) {
    console.error('Error getting today email count:', error);
    return 0;
  }
}

// Notification preferences
async getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  try {
    const [result] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    
    // Return default preferences if none found
    if (!result) {
      const defaultPrefs: InsertNotificationPreference = {
        userId,
        emailEnabled: true,
        emailAggregationMinutes: 5,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        urgentOnly: false,
        businessHoursOnly: true,
      };
      
      return await this.updateNotificationPreferences(userId, defaultPrefs);
    }
    
    return result;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    // Return safe defaults if database error
    return {
      id: '',
      userId,
      emailEnabled: true,
      emailAggregationMinutes: 5,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      urgentOnly: false,
      businessHoursOnly: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

async updateNotificationPreferences(userId: string, preferences: Partial<InsertNotificationPreference>): Promise<NotificationPreference> {
  try {
    const [result] = await db
      .insert(notificationPreferences)
      .values({
        userId,
        ...preferences,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    console.log(`⚙️ Updated notification preferences for user ${userId}`);
    return result;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}


}

export const storage = new DatabaseStorage();
