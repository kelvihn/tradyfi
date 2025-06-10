import express from 'express';
import { storage } from '../storage.js';
import { authenticate } from '../basicAuth.js';
import { PushNotificationService } from '../services/pushNotification.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription, userId, userType = 'user' } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription data' });
    }

    console.log(`Subscribing user ${userId} (${userType}) to push notifications`);

    // Check if subscription already exists
    const existing = await storage.getPushSubscription(userId, subscription.endpoint);
    
    if (existing) {
      // Update existing subscription
      await storage.updatePushSubscription(existing.id, {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isActive: true,
        userType
      });
      console.log('Updated existing push subscription');
    } else {
      // Create new subscription
      await storage.createPushSubscription({
        userId,
        userType,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isActive: true
      });
      console.log('Created new push subscription');
    }

    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    console.log(`Unsubscribing user ${userId} from push notifications`);
    
    await storage.deletePushSubscription(userId, endpoint);
    
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

// Test notification (for development)
router.post('/test', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const result = await PushNotificationService.sendNotification(userId, {
      title: 'Test Notification',
      body: 'This is a test push notification from Tradyfi.ng',
      icon: '/favicon.ico'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

export default router;