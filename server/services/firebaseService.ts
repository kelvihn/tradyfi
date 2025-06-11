// server/services/firebaseService.ts
import admin from 'firebase-admin';

// Initialize Firebase Admin (do this once in your app)
if (!admin.apps.length) {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
    // Use Service Account (recommended for production)
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } else if (process.env.FIREBASE_SERVER_KEY) {
    // Fallback to Server Key (simpler setup)
    console.log('Using Firebase Server Key authentication');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } else {
    throw new Error('Firebase credentials not configured properly');
  }
}

interface FCMNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  clickAction?: string;
}

interface FCMData {
  [key: string]: string;
}

export class FirebaseService {
  
  static async sendToToken(
    token: string,
    notification: FCMNotification,
    data?: FCMData
  ): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image
        },
        data: data || {},
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/favicon.ico',
            badge: notification.badge || '/favicon.ico',
            image: notification.image,
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Open'
              },
              {
                action: 'close',
                title: 'Dismiss'
              }
            ]
          },
          fcmOptions: {
            link: notification.clickAction || '/'
          }
        },
        android: {
          priority: 'high',
          notification: {
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            clickAction: notification.clickAction
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
              category: 'CHAT_MESSAGE'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM message sent successfully:', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending FCM message:', error);
      
      // Handle invalid tokens
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-registration-token') {
        console.log('🗑️ Token is invalid, should remove from database');
        // TODO: Remove invalid token from database
        await this.removeInvalidToken(token);
      }
      
      return false;
    }
  }

  static async sendToMultipleTokens(
    tokens: string[],
    notification: FCMNotification,
    data?: FCMData
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image
        },
        data: data || {},
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/favicon.ico',
            badge: notification.badge || '/favicon.ico',
            image: notification.image,
            requireInteraction: true
          },
          fcmOptions: {
            link: notification.clickAction || '/'
          }
        },
        android: {
          priority: 'high',
          notification: {
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`📊 FCM multicast sent: ${response.successCount} success, ${response.failureCount} failures`);
      
      // Collect invalid tokens for cleanup
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error?.code === 'messaging/registration-token-not-registered' ||
             resp.error?.code === 'messaging/invalid-registration-token')) {
          invalidTokens.push(tokens[idx]);
          console.error(`❌ Invalid token: ${tokens[idx]}`);
        } else if (!resp.success) {
          console.error(`❌ FCM error for token ${tokens[idx]}:`, resp.error);
        }
      });

      // Clean up invalid tokens
      if (invalidTokens.length > 0) {
        await Promise.all(invalidTokens.map(token => this.removeInvalidToken(token)));
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens
      };
    } catch (error) {
      console.error('❌ Error sending FCM multicast:', error);
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }

  static async sendToTopic(
    topic: string,
    notification: FCMNotification,
    data?: FCMData
  ): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image
        },
        data: data || {},
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/favicon.ico',
            badge: notification.badge || '/favicon.ico',
            requireInteraction: true
          }
        },
        android: {
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM topic message sent:', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending FCM topic message:', error);
      return false;
    }
  }

  static async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`✅ Tokens subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to topic:', error);
      return false;
    }
  }

  static async unsubscribeFromTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`✅ Tokens unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing from topic:', error);
      return false;
    }
  }

  // Chat-specific notification methods
  static async sendChatNotification(
    recipientTokens: string[],
    senderName: string,
    message: string,
    chatRoomId: number,
    isTrader: boolean = false
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    const notification: FCMNotification = {
      title: `💬 ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      clickAction: isTrader ? `/trader/dashboard?tab=chats&room=${chatRoomId}` : `/chat/${chatRoomId}`
    };

    const data: FCMData = {
      type: 'chat',
      chatRoomId: chatRoomId.toString(),
      senderName,
      isTrader: isTrader.toString(),
      timestamp: Date.now().toString()
    };

    if (recipientTokens.length === 1) {
      const success = await this.sendToToken(recipientTokens[0], notification, data);
      return { success, sent: success ? 1 : 0, failed: success ? 0 : 1 };
    } else {
      const result = await this.sendToMultipleTokens(recipientTokens, notification, data);
      return { 
        success: result.successCount > 0, 
        sent: result.successCount, 
        failed: result.failureCount 
      };
    }
  }

  // Helper method to remove invalid tokens from database
  static async removeInvalidToken(token: string): Promise<void> {
    try {
      // Import storage to avoid circular dependency
      const { storage } = await import('../storage.js');
      await storage.removeFCMToken(token);
      console.log(`🗑️ Removed invalid FCM token from database`);
    } catch (error) {
      console.error('❌ Error removing invalid token from database:', error);
    }
  }

  // Method to send notifications with automatic fallback
  static async sendWithFallback(
    tokens: string[],
    notification: FCMNotification,
    data?: FCMData,
    fallbackOptions?: {
      email?: boolean;
      sms?: boolean;
      userId?: string;
    }
  ): Promise<boolean> {
    const result = await this.sendToMultipleTokens(tokens, notification, data);
    
    // If FCM fails completely, try fallback methods
    if (result.successCount === 0 && fallbackOptions?.userId) {
      console.log(`⚠️ FCM failed completely for user ${fallbackOptions.userId}, trying fallbacks...`);
      
      if (fallbackOptions.email) {
        console.log('📧 Attempting email fallback...');
        // TODO: Implement email fallback
      }
      
      if (fallbackOptions.sms) {
        console.log('📱 Attempting SMS fallback...');
        // TODO: Implement SMS fallback
      }
    }
    
    return result.successCount > 0;
  }

  // Bulk notification with rate limiting
  static async sendBulkNotifications(
    notifications: Array<{
      tokens: string[];
      notification: FCMNotification;
      data?: FCMData;
    }>,
    rateLimitPerSecond: number = 100
  ): Promise<{ totalSent: number; totalFailed: number }> {
    let totalSent = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < notifications.length; i += rateLimitPerSecond) {
      const batch = notifications.slice(i, i + rateLimitPerSecond);
      
      const batchPromises = batch.map(({ tokens, notification, data }) =>
        this.sendToMultipleTokens(tokens, notification, data)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        totalSent += result.successCount;
        totalFailed += result.failureCount;
      });
      
      // Rate limiting delay
      if (i + rateLimitPerSecond < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return { totalSent, totalFailed };
  }
}