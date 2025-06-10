import webpush from 'web-push';
import { storage } from '../storage.js';

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:hello@zlocan.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export class PushNotificationService {
  static async sendNotification(userId, notification, userType = 'user') {
    try {
      console.log(`Sending push notification to user ${userId}:`, notification);
      
      // Get user's push subscriptions (returns UserPushSubscription[])
      const subscriptions = await storage.getUserPushSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return { success: true, sent: 0 };
      }

      const payload = JSON.stringify(notification);
      const promises = [];

      for (const subscription of subscriptions) {
        // Convert UserPushSubscription to browser PushSubscription format
        const browserPushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        const promise = webpush.sendNotification(browserPushSubscription, payload)
          .then(() => {
            console.log(`Notification sent successfully to ${subscription.endpoint}`);
            return { success: true, subscriptionId: subscription.id };
          })
          .catch(async (error) => {
            console.error(`Failed to send notification to ${subscription.endpoint}:`, error);
            
            // If subscription is invalid, mark as inactive
            if (error.statusCode === 410 || error.statusCode === 404) {
              console.log(`Marking subscription as inactive: ${subscription.id}`);
              await storage.updatePushSubscription(subscription.id, { isActive: false });
            }
            
            return { success: false, error: error.message, subscriptionId: subscription.id };
          });

        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      
      console.log(`Push notification results: ${successful}/${results.length} successful`);
      
      return {
        success: true,
        sent: successful,
        total: results.length,
        results
      };

    } catch (error) {
      console.error('Error in sendNotification:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendChatNotification(senderId, receiverId, message, roomId, senderName, isTrader = false) {
    const notification = {
      title: `New message from ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      url: isTrader ? `/trader/dashboard?tab=chats&room=${roomId}` : `/chat/${roomId}`,
      roomId,
      senderId,
      tag: `chat-${roomId}`,
    };

    return await this.sendNotification(receiverId, notification);
  }
}