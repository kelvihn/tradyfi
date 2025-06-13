
import { emailTransporter } from '../routes.js';

class NotificationAggregator {
  constructor() {
    this.pendingNotifications = new Map();
    this.notificationTimers = new Map();
    this.AGGREGATION_DELAY = 5 * 60 * 1000; // 5 minutes
    this.MAX_MESSAGES_PER_EMAIL = 10; // Limit messages per email
  }

  // Add a new message to the aggregation queue
  addPendingMessage(receiverId, senderId, senderName, content, roomId, isTrader = false) {
    const key = `${receiverId}_${roomId}`;
    
    console.log(`📩 Adding pending message for user ${receiverId} in room ${roomId}`);
    
    if (!this.pendingNotifications.has(key)) {
      this.pendingNotifications.set(key, {
        receiverId,
        roomId,
        isTrader,
        messages: [],
        senders: new Set(),
        firstMessageTime: new Date(),
        lastMessageTime: new Date()
      });
    }

    const notification = this.pendingNotifications.get(key);
    
    // Add message to queue
    notification.messages.push({
      senderId,
      senderName,
      content: content.substring(0, 150), // Limit content length
      timestamp: new Date()
    });
    
    notification.senders.add(senderName);
    notification.lastMessageTime = new Date();
    
    // Clear existing timer and set new one
    if (this.notificationTimers.has(key)) {
      clearTimeout(this.notificationTimers.get(key));
    }

    // Send aggregated email after delay
    const timer = setTimeout(() => {
      this.sendAggregatedEmail(key);
    }, this.AGGREGATION_DELAY);

    this.notificationTimers.set(key, timer);
    
    console.log(`⏰ Set timer for ${this.AGGREGATION_DELAY/1000} seconds. Total messages: ${notification.messages.length}`);
  }

  // Send the aggregated email notification
  async sendAggregatedEmail(key) {
    const notification = this.pendingNotifications.get(key);
    if (!notification) return;

    try {
      console.log(`📧 Sending aggregated email for key: ${key}`);
      
      // Get user details from storage
      const user = await this.getUserDetails(notification.receiverId);
      if (!user) {
        console.log(`❌ User not found: ${notification.receiverId}`);
        return;
      }

      const messageCount = notification.messages.length;
      const senderNames = Array.from(notification.senders);
      
      // Get room/trading info
      const roomInfo = await this.getRoomInfo(notification.roomId);
      
      const emailContent = this.generateEmailContent(
        user,
        notification.messages,
        senderNames,
        messageCount,
        roomInfo,
        notification.isTrader
      );
     
      await emailTransporter.sendMail(emailContent);
      
      console.log(`✅ Sent aggregated email to ${user.email} for ${messageCount} messages`);
      
      // Record that we sent an email (for rate limiting)
      await this.recordEmailSent(notification.receiverId, notification.roomId);
      
    } catch (error) {
      console.error('❌ Failed to send aggregated email notification:', error);
    }

    // Clean up
    this.pendingNotifications.delete(key);
    this.notificationTimers.delete(key);
  }

  // Generate email content
  generateEmailContent(user, messages, senderNames, messageCount, roomInfo, isTrader) {
    const subject = messageCount === 1 
      ? `💬 New message from ${senderNames[0]} - Tradyfi.ng`
      : `💬 ${messageCount} new messages from ${senderNames.join(', ')} - Tradyfi.ng`;

    const dashboardUrl = isTrader 
      ? 'https://tradyfi.ng/trader/dashboard'
      : `https://${roomInfo?.subdomain || 'www'}.tradyfi.ng`;

    const messagesToShow = messages.slice(-5); // Show last 5 messages
    const hasMoreMessages = messages.length > 5;

    return {
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">💬 New Messages</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              You have ${messageCount} unread message${messageCount > 1 ? 's' : ''}
            </p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              Hi ${user.firstName || 'there'},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
              You have ${messageCount} unread message${messageCount > 1 ? 's' : ''} 
              from <strong>${senderNames.join(', ')}</strong> 
              ${roomInfo?.tradingOption ? `about <strong>${roomInfo.tradingOption.replace('_', ' ')}</strong>` : ''} 
              on your Tradyfi.ng ${isTrader ? 'trader dashboard' : 'portal'}.
            </p>
            
            <!-- Messages Preview -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Recent Messages:</h3>
              
              ${messagesToShow.map(msg => `
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #007bff;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <strong style="color: #007bff; font-size: 14px;">${msg.senderName}</strong>
                    <span style="font-size: 12px; color: #666;">
                      ${msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style="margin: 0; color: #333; line-height: 1.5; font-size: 14px;">
                    ${msg.content}${msg.content.length >= 150 ? '...' : ''}
                  </p>
                </div>
              `).join('')}
              
              ${hasMoreMessages ? `
                <div style="text-align: center; margin: 15px 0; padding: 10px; background: #e9ecef; border-radius: 5px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    📝 ... and ${messages.length - 5} more message${messages.length - 5 > 1 ? 's' : ''}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 5px rgba(40, 167, 69, 0.3);">
                📱 View All Messages
              </a>
            </div>
            
            <!-- Chat Room Info -->
            ${roomInfo ? `
              <div style="background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">💼 Chat Details</h4>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                  <strong>Service:</strong> ${roomInfo.tradingOption?.replace('_', ' ') || 'General Chat'}
                </p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                  <strong>Room ID:</strong> #${roomInfo.id}
                </p>
                ${roomInfo.businessName ? `
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">
                    <strong>${isTrader ? 'Client' : 'Trader'}:</strong> ${roomInfo.businessName}
                  </p>
                ` : ''}
              </div>
            ` : ''}
            
            <!-- Tips -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 14px;">💡 Tip</h4>
              <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.5;">
                To reduce email notifications, enable push notifications in your browser or check your dashboard more frequently. 
                You can also adjust your notification preferences in your account settings.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
                This email was sent because you have unread messages on Tradyfi.ng
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                Questions? Contact us at <a href="mailto:hey@tradyfi.ng" style="color: #007bff;">hey@tradyfi.ng</a>
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  // Get user details from your storage
  async getUserDetails(userId) {
    try {
      const { storage } = await import('../storage.js'); // This will import your Drizzle storage instance
      return await storage.getUser(userId);
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  }

  // Get room information
  async getRoomInfo(roomId) {
    try {
      const { storage } = await import('../storage.js'); // Adjust path as needed
      const room = await storage.getChatRoom(roomId);
      
      if (room) {
        // Get additional info like trader business name
        const trader = await storage.getTrader(room.traderId);
        return {
          ...room,
          businessName: trader?.businessName,
          subdomain: trader?.subdomain
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting room info:', error);
      return null;
    }
  }

  // Record email sent for rate limiting
  async recordEmailSent(userId, roomId) {
    try {
      const { storage } = await import('../storage.js'); // Adjust path as needed
      await storage.recordEmailNotificationSent(userId, roomId);
    } catch (error) {
      console.error('Error recording email sent:', error);
    }
  }

  // Check if we should send email (rate limiting)
  async shouldSendEmail(userId, roomId) {
    try {
      const { storage } = await import('../storage.js');
      
      // Check if we sent an email for this room in the last hour
      const lastEmail = await storage.getLastEmailNotification(userId, roomId);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastEmail && lastEmail.sentAt > oneHourAgo) {
        console.log(`⏭️  Skipping email - already sent within last hour`);
        return false;
      }

      // Check daily email limit
      const todayCount = await storage.getTodayEmailCount(userId);
      const DAILY_LIMIT = 50; // Adjust as needed
      
      if (todayCount >= DAILY_LIMIT) {
        console.log(`⏭️  Skipping email - daily limit reached (${todayCount}/${DAILY_LIMIT})`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking email limits:', error);
      return true; // Default to sending if check fails
    }
  }

  // Force send immediate email for high priority messages
  async sendImmediateEmail(receiverId, senderId, senderName, content, roomId, isTrader = false) {
    const key = `${receiverId}_${roomId}`;
    
    // Cancel any pending aggregation
    if (this.notificationTimers.has(key)) {
      clearTimeout(this.notificationTimers.get(key));
      this.notificationTimers.delete(key);
    }

    // Add current message and send immediately
    this.addPendingMessage(receiverId, senderId, senderName, content, roomId, isTrader);
    await this.sendAggregatedEmail(key);
  }

  // Clean up expired timers
  cleanup() {
    console.log('🧹 Cleaning up notification aggregator');
    for (const [key, timer] of this.notificationTimers) {
      clearTimeout(timer);
    }
    this.notificationTimers.clear();
    this.pendingNotifications.clear();
  }
}

// Create singleton instance
const notificationAggregator = new NotificationAggregator();

// Cleanup on process exit
process.on('SIGTERM', () => notificationAggregator.cleanup());
process.on('SIGINT', () => notificationAggregator.cleanup());

export default notificationAggregator;