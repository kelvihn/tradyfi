export class VisitorNotificationService {
  constructor(
    private storage: any, // Your storage instance
    private emailTransporter: any
  ) {}

  // Main function to handle visitor notifications
  async handleVisitorLogin(
    traderId: number,
    userId: string,
    visitorName: string,
    traderSubdomain: string
  ): Promise<void> {
    try {
      const now = new Date();
      const cooldownMinutes = 30;

      console.log(`🔍 Checking notification for user ${userId} -> trader ${traderId}`);

      // Check if we have a recent notification record for this user-trader combination
      const lastNotification = await this.storage.getLastVisitorNotification(traderId, userId);
      
      let shouldSendNotification = true;

      if (lastNotification) {
        const timeSinceLastNotification = now.getTime() - new Date(lastNotification.lastNotificationSent).getTime();
        const minutesSinceLastNotification = timeSinceLastNotification / (1000 * 60);
        
        if (minutesSinceLastNotification < cooldownMinutes) {
          console.log(`⏭️ Skipping notification for ${visitorName} - last notification was ${Math.round(minutesSinceLastNotification)} minutes ago`);
          shouldSendNotification = false;
        } else {
          console.log(`✅ Cooldown period passed (${Math.round(minutesSinceLastNotification)} minutes), sending notification`);
        }
      } else {
        console.log(`🆕 First time notification for ${visitorName}`);
      }

      if (shouldSendNotification) {
        // Send notification email
        await this.sendVisitorNotificationEmail(traderId, visitorName, traderSubdomain);
        
        // Update or insert notification record
        await this.storage.upsertVisitorNotification(traderId, userId, visitorName, now);
        
        console.log(`✅ Sent visitor notification for ${visitorName} to trader ${traderId}`);
      }
    } catch (error) {
      console.error('❌ Error handling visitor notification:', error);
    }
  }

  // Send notification email to trader
  private async sendVisitorNotificationEmail(
    traderId: number,
    visitorName: string,
    subdomain: string
  ): Promise<void> {
    try {
      // Get trader details
      const trader = await this.storage.getTrader(traderId);
      const traderUser = await this.storage.getUser(trader.userId);
      
      if (!trader || !traderUser) {
        console.error('❌ Trader or trader user not found');
        return;
      }

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">👋 Portal Visitor Alert</h1>
            <p style="color: #e6e9ff; margin: 10px 0 0; font-size: 14px;">${trader.businessName}</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333333; margin: 0 0 20px; font-size: 20px;">Someone just logged into your portal!</h2>
            
            <div style="background-color: #f8f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 12px;">👤</span>
                <div>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">${visitorName}</p>
                  <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Just logged into your portal</p>
                </div>
              </div>
              
              <div style="margin: 15px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  📅 <strong>Login Time:</strong> ${new Date().toLocaleString()}<br>
                  🌐 <strong>Portal:</strong> ${subdomain}.tradyfi.ng
                </p>
              </div>
            </div>

            <div style="background-color: #e8f5e8; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #2d5a2d; text-align: center;">
                💡 <strong>Quick Response Tip:</strong> Users who get immediate responses are 3x more likely to engage. Consider reaching out via WhatsApp or portal chat within the next few minutes!
              </p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://${subdomain}.tradyfi.ng" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">
                View Your Portal Now
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">
              You'll receive another notification if this user visits again after 30 minutes of inactivity.<br>
              This is an automated notification from ${trader.businessName} portal.
            </p>
          </div>
        </div>
      `;

      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@tradyfi.ng",
        to: traderUser.email,
        subject: `🚨 ${visitorName} is now on your portal - Act fast!`,
        html: emailHtml
      });

    } catch (error) {
      console.error('❌ Error sending visitor notification email:', error);
    }
  }
}
