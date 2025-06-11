// server/routes/fcm.js - Replace your existing push.js
import express from 'express';
import { storage } from '../storage.js';
import { authenticate } from '../basicAuth.js';
import { FirebaseService } from '../services/firebaseService.js';

const router = express.Router();

// Save FCM token
router.post('/save-token', authenticate, async (req, res) => {
  try {
    const { fcmToken, userType = 'user' } = req.body;
    const userId = req.user.id;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    console.log(`💾 Saving FCM token for user ${userId} (${userType})`);

    // Check if token already exists
    const existing = await storage.getFCMTokenByToken(fcmToken);
    
    if (existing) {
      // Update existing token
      await storage.updateFCMToken(existing.id, {
        userId,
        userType,
        isActive: true,
        lastUsed: new Date()
      });
      console.log('✅ Updated existing FCM token');
    } else {
      // Create new token
      await storage.createFCMToken({
        userId,
        userType,
        token: fcmToken,
        isActive: true,
        deviceInfo: req.headers['user-agent'] || '',
        lastUsed: new Date()
      });
      console.log('✅ Created new FCM token');
    }

    res.json({ success: true, message: 'FCM token saved successfully' });
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    res.status(500).json({ message: 'Failed to save FCM token' });
  }
});

// Remove FCM token
router.post('/remove-token', authenticate, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;
    
    console.log(`🗑️ Removing FCM token for user ${userId}`);
    
    await storage.removeFCMTokenByUserAndToken(userId, fcmToken);
    
    res.json({ success: true, message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
    res.status(500).json({ message: 'Failed to remove FCM token' });
  }
});

// Subscribe to topic
router.post('/subscribe-topic', authenticate, async (req, res) => {
  try {
    const { token, topic } = req.body;

    const success = await FirebaseService.subscribeToTopic([token], topic);
    
    if (success) {
      res.json({ message: 'Subscribed to topic successfully' });
    } else {
      res.status(500).json({ message: 'Failed to subscribe to topic' });
    }
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error);
    res.status(500).json({ message: 'Failed to subscribe to topic' });
  }
});

// Unsubscribe from topic
router.post('/unsubscribe-topic', authenticate, async (req, res) => {
  try {
    const { token, topic } = req.body;

    const success = await FirebaseService.unsubscribeFromTopic([token], topic);
    
    if (success) {
      res.json({ message: 'Unsubscribed from topic successfully' });
    } else {
      res.status(500).json({ message: 'Failed to unsubscribe from topic' });
    }
  } catch (error) {
    console.error('❌ Error unsubscribing from topic:', error);
    res.status(500).json({ message: 'Failed to unsubscribe from topic' });
  }
});

// Test notification
router.post('/test', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message = 'This is a test notification from Tradyfi!' } = req.body;
    
    const tokens = await storage.getFCMTokensByUserId(userId);

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'No FCM tokens found for user' });
    }

    console.log(`🧪 Sending test notification to ${tokens.length} device(s)`);

    const result = await FirebaseService.sendToMultipleTokens(
      tokens.map(t => t.token),
      {
        title: '🧪 Test Notification',
        body: message,
        icon: '/favicon.ico',
        clickAction: '/'
      },
      {
        type: 'test',
        timestamp: Date.now().toString(),
        userId
      }
    );

    res.json({ 
      success: true,
      message: 'Test notification sent',
      sent: result.successCount,
      failed: result.failureCount,
      invalidTokens: result.invalidTokens.length
    });
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

// Send notification to specific user (admin only)
router.post('/send-to-user', authenticate, async (req, res) => {
  try {
    // Add admin check if needed
    const { targetUserId, title, body, data } = req.body;
    
    if (!targetUserId || !title || !body) {
      return res.status(400).json({ message: 'targetUserId, title, and body are required' });
    }

    const tokens = await storage.getFCMTokensByUserId(targetUserId);

    if (tokens.length === 0) {
      return res.status(404).json({ message: 'No FCM tokens found for target user' });
    }

    const result = await FirebaseService.sendToMultipleTokens(
      tokens.map(t => t.token),
      { title, body, icon: '/favicon.ico' },
      data || {}
    );

    res.json({ 
      success: true,
      sent: result.successCount,
      failed: result.failureCount
    });
  } catch (error) {
    console.error('❌ Error sending notification to user:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Send notification to topic (admin only)
router.post('/send-to-topic', authenticate, async (req, res) => {
  try {
    // Add admin check if needed
    const { topic, title, body, data } = req.body;
    
    if (!topic || !title || !body) {
      return res.status(400).json({ message: 'topic, title, and body are required' });
    }

    const success = await FirebaseService.sendToTopic(
      topic,
      { title, body, icon: '/favicon.ico' },
      data || {}
    );

    res.json({ 
      success,
      message: success ? 'Notification sent to topic' : 'Failed to send notification'
    });
  } catch (error) {
    console.error('❌ Error sending notification to topic:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get user's FCM tokens (for debugging)
router.get('/tokens', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const tokens = await storage.getFCMTokensByUserId(userId);
    
    // Don't send full tokens for security, just metadata
    const tokenInfo = tokens.map(token => ({
      id: token.id,
      userType: token.userType,
      deviceInfo: token.deviceInfo,
      isActive: token.isActive,
      lastUsed: token.lastUsed,
      createdAt: token.createdAt,
      tokenPreview: token.token.substring(0, 20) + '...'
    }));
    
    res.json(tokenInfo);
  } catch (error) {
    console.error('❌ Error fetching FCM tokens:', error);
    res.status(500).json({ message: 'Failed to fetch FCM tokens' });
  }
});

// Clean up invalid tokens (admin only)
router.post('/cleanup-invalid', authenticate, async (req, res) => {
  try {
    // Add admin check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const deletedCount = await storage.cleanupInvalidFCMTokens();
    
    res.json({ 
      success: true,
      message: `Cleaned up ${deletedCount} invalid FCM tokens`
    });
  } catch (error) {
    console.error('❌ Error cleaning up FCM tokens:', error);
    res.status(500).json({ message: 'Failed to cleanup FCM tokens' });
  }
});

export default router;