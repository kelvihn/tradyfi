// emailTemplates.ts
export const emailTemplates = {
  traderWelcome: (firstName: string, lastName: string) => ({
    subject: 'Welcome to Tradyfi.ng - Your Trading Platform Awaits!',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Tradyfi.ng!</h1>
          <p style="color: #e6f3ff; margin: 10px 0 0; font-size: 16px;">Your professional trading platform is ready</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Hi ${firstName} ${lastName},</h2>
          
          <p style="color: #555555; line-height: 1.6; margin: 0 0 25px; font-size: 16px;">
            Congratulations on joining Tradyfi.ng! We're excited to help you build and grow your trading business with our comprehensive platform.
          </p>

          <!-- Key Features -->
          <div style="background-color: #f8f9ff; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #333333; margin: 0 0 20px; font-size: 20px;">🚀 What's included in your platform:</h3>
            
            <div style="margin: 15px 0;">
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">🌐</span>
                <div>
                  <strong style="color: #333;">Customized Domain:</strong>
                  <span style="color: #666; margin-left: 5px;">Get your personal subdomain (yourname.tradyfi.ng)</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">💬</span>
                <div>
                  <strong style="color: #333;">Instant Chat & Notifications:</strong>
                  <span style="color: #666; margin-left: 5px;">Real-time communication with your clients</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">📊</span>
                <div>
                  <strong style="color: #333;">Analytics & Tracking:</strong>
                  <span style="color: #666; margin-left: 5px;">Monitor portal visits and client engagement</span>
                </div>
              </div>

              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">🟢</span>
                <div>
                  <strong style="color: #333;">Connect to Whatsapp:</strong>
                  <span style="color: #666; margin-left: 5px;">Redirect users from your trading portal to Whatsapp</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">🎯</span>
                <div>
                  <strong style="color: #333;">7-Day Free Trial:</strong>
                  <span style="color: #666; margin-left: 5px;">Experience all features risk-free</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin: 0 0 15px; font-size: 18px;">📋 Next Step: Complete Your Verification</h3>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              To activate your trading portal and start serving clients, please complete your business verification. 
              This includes providing your business details and NIN for security purposes.
            </p>
          </div>

          <p style="color: #777777; line-height: 1.6; margin: 25px 0 0; font-size: 14px;">
            If you have any questions or need assistance, our support team is here to help. Simply reply to this email or contact us through your dashboard.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong>The Tradyfi.ng Team</strong>
          </p>
          <p style="color: #adb5bd; margin: 15px 0 0; font-size: 12px;">
            This email was sent to help you get started with your new trading platform.
          </p>
        </div>
      </div>
    `
  }),

  traderVerified: (firstName: string, lastName: string, businessName: string, subdomain: string) => ({
    subject: '🎉 Your Trading Portal is Now Live!',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Congratulations!</h1>
          <p style="color: #e6fff0; margin: 10px 0 0; font-size: 16px;">Your trading portal is now active</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Hi ${firstName} ${lastName},</h2>
          
          <p style="color: #555555; line-height: 1.6; margin: 0 0 25px; font-size: 16px;">
            Great news! Your business verification has been <strong style="color: #28a745;">approved</strong> and your trading portal is now live. 
            You can start serving clients immediately!
          </p>

          <!-- Portal Details -->
          <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e6f3ff 100%); border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #333333; margin: 0 0 20px; font-size: 20px;">🌐 Your Trading Portal</h3>
            
            <div style="background-color: #ffffff; border-radius: 6px; padding: 20px; margin: 15px 0;">
              <p style="color: #666; margin: 0 0 10px; font-size: 14px;">Business Name:</p>
              <p style="color: #333; margin: 0; font-size: 18px; font-weight: 600;">${businessName}</p>
            </div>
            
            <div style="background-color: #ffffff; border-radius: 6px; padding: 20px; margin: 15px 0;">
              <p style="color: #666; margin: 0 0 10px; font-size: 14px;">Your Portal URL:</p>
              <p style="color: #333; margin: 0; font-size: 18px; font-weight: 600;">
                <a href="https://${subdomain}.tradyfi.ng" style="color: #667eea; text-decoration: none;">
                  ${subdomain}.tradyfi.ng
                </a>
              </p>
            </div>
          </div>

          <!-- What's Next -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #333333; margin: 0 0 20px; font-size: 20px;">🚀 What's next?</h3>
            
            <div style="margin: 15px 0;">
              <div style="margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold;">✓</span>
                <span style="color: #333; margin-left: 10px;">Share your portal URL with potential clients</span>
              </div>
              
              <div style="margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold;">✓</span>
                <span style="color: #333; margin-left: 10px;">Customize your portal description and contact information</span>
              </div>
              
              <div style="margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold;">✓</span>
                <span style="color: #333; margin-left: 10px;">Start accepting client registrations and inquiries</span>
              </div>
              
              <div style="margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold;">✓</span>
                <span style="color: #333; margin-left: 10px;">Monitor your dashboard for analytics and messages</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/trader/dashboard" 
               style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 15px;">
              Go to Dashboard
            </a>
            <a href="https://${subdomain}.tradyfi.ng" 
               style="background: transparent; color: #667eea; text-decoration: none; padding: 15px 30px; border: 2px solid #667eea; border-radius: 6px; font-weight: 600; display: inline-block;">
              Visit Your Portal
            </a>
          </div>

          <p style="color: #777777; line-height: 1.6; margin: 25px 0 0; font-size: 14px;">
            Congratulations on this milestone! We're excited to see your trading business grow with Tradyfi.ng.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong>The Tradyfi.ng Team</strong>
          </p>
          <p style="color: #adb5bd; margin: 15px 0 0; font-size: 12px;">
            Keep this email for your records. Your portal URL is: ${subdomain}.tradyfi.ng
          </p>
        </div>
      </div>
    `
  }),

  traderRejected: (firstName: string, lastName: string, businessName: string) => ({
    subject: 'Verification Update Required - Tradyfi.ng',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Verification Update Required</h1>
          <p style="color: #ffe6e6; margin: 10px 0 0; font-size: 16px;">Additional information needed for your application</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Hi ${firstName} ${lastName},</h2>
          
          <p style="color: #555555; line-height: 1.6; margin: 0 0 25px; font-size: 16px;">
            Thank you for your interest in joining Tradyfi.ng as a verified trader. After reviewing your application 
            for <strong>${businessName}</strong>, we need some additional information or corrections to complete your verification.
          </p>

          <!-- Issue Notice -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin: 0 0 15px; font-size: 18px;">⚠️ Verification Status</h3>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              Your trader verification application requires updates before we can approve your platform. This is typically due to:
            </p>
            <ul style="color: #856404; margin: 15px 0 0 20px; padding: 0;">
              <li>Incomplete or unclear business information</li>
              <li>Invalid or unverifiable NIN (National Identification Number)</li>
              <li>Business documentation that needs clarification</li>
              <li>Contact information that couldn't be verified</li>
            </ul>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #f8f9ff; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #333333; margin: 0 0 20px; font-size: 20px;">📋 Next Steps</h3>
            
            <div style="margin: 15px 0;">
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">1.</span>
                <div>
                  <strong style="color: #333;">Review Your Information:</strong>
                  <span style="color: #666; margin-left: 5px;">Double-check all business details, NIN, and contact information for accuracy</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">2.</span>
                <div>
                  <strong style="color: #333;">Update Your Application:</strong>
                  <span style="color: #666; margin-left: 5px;">Log in to your dashboard and resubmit with corrected information</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #667eea; font-weight: bold; margin-right: 10px;">3.</span>
                <div>
                  <strong style="color: #333;">Resubmit for Review:</strong>
                  <span style="color: #666; margin-left: 5px;">Once updated, your application will be reviewed again promptly</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Important Data Guidelines -->
          <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin: 25px 0;">
            <h3 style="color: #004085; margin: 0 0 15px; font-size: 18px;">📝 Data Requirements</h3>
            <p style="color: #004085; margin: 0 0 10px; line-height: 1.5;">
              Please ensure all information provided is:
            </p>
            <ul style="color: #004085; margin: 10px 0 0 20px; padding: 0;">
              <li><strong>Accurate and up-to-date</strong> - Use current business registration details</li>
              <li><strong>Complete</strong> - Fill out all required fields thoroughly</li>
              <li><strong>Verifiable</strong> - Provide valid NIN and business documentation</li>
              <li><strong>Professional</strong> - Use a business email and proper business name</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/trader/register" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 15px;">
              Update Application
            </a>
            <a href="${process.env.FRONTEND_URL}/trader/dashboard" 
               style="background: transparent; color: #667eea; text-decoration: none; padding: 15px 30px; border: 2px solid #667eea; border-radius: 6px; font-weight: 600; display: inline-block;">
              Go to Dashboard
            </a>
          </div>

          <!-- Support Contact -->
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 15px; font-size: 18px;">💬 Need Help?</h3>
            <p style="color: #555; margin: 0; line-height: 1.5;">
              If you're unsure about any requirements or need assistance with your application, our support team is here to help:
            </p>
            <div style="margin: 15px 0 0;">
              <p style="color: #333; margin: 5px 0;">
                <strong>📧 Email:</strong> <a href="mailto:support@tradyfi.ng" style="color: #667eea;">support@tradyfi.ng</a>
              </p>
              <p style="color: #333; margin: 5px 0;">
                <strong>💬 Response Time:</strong> Within 24 hours
              </p>
            </div>
          </div>

          <p style="color: #777777; line-height: 1.6; margin: 25px 0 0; font-size: 14px;">
            We appreciate your interest in becoming a verified trader on Tradyfi.ng. Once your information is updated 
            and verified, you'll be able to start serving clients through your personalized trading portal.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong>The Tradyfi.ng Verification Team</strong>
          </p>
          <p style="color: #adb5bd; margin: 15px 0 0; font-size: 12px;">
            This is an automated message regarding your trader verification application.
          </p>
        </div>
      </div>
    `
  }),

  userWelcome: (firstName: string, lastName: string, businessName: string, subdomain: string) => ({
    subject: `Welcome to ${businessName} - Your Secure Trading Platform`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome!</h1>
          <p style="color: #e6f3ff; margin: 10px 0 0; font-size: 16px;">You're now connected to ${businessName}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Hi ${firstName || 'there'},</h2>
          
          <p style="color: #555555; line-height: 1.6; margin: 0 0 25px; font-size: 16px;">
            Welcome to <strong>${businessName}</strong>! You've successfully registered on this secure trading platform 
            powered by Tradyfi.ng.
          </p>

          <!-- Security Features -->
          <div style="background-color: #f8fff8; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #333333; margin: 0 0 20px; font-size: 20px;">🔒 Safe & Secure Trading</h3>
            
            <div style="margin: 15px 0;">
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold; margin-right: 10px;">🛡️</span>
                <div>
                  <strong style="color: #333;">Verified Trader:</strong>
                  <span style="color: #666; margin-left: 5px;">This platform is operated by a verified business</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold; margin-right: 10px;">🔐</span>
                <div>
                  <strong style="color: #333;">Secure Communications:</strong>
                  <span style="color: #666; margin-left: 5px;">All messages and data are encrypted</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold; margin-right: 10px;">💬</span>
                <div>
                  <strong style="color: #333;">Real-time Support:</strong>
                  <span style="color: #666; margin-left: 5px;">Direct chat with your trading partner</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                <span style="color: #28a745; font-weight: bold; margin-right: 10px;">📊</span>
                <div>
                  <strong style="color: #333;">Transparent Platform:</strong>
                  <span style="color: #666; margin-left: 5px;">Clear communication and professional service</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Getting Started -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin: 0 0 15px; font-size: 18px;">🚀 Getting Started</h3>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              You can now communicate directly with ${businessName} through the secure chat system. 
              Feel free to ask questions about trading options, rates, or any other inquiries.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://${subdomain}.tradyfi.ng" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; display: inline-block;">
              Access Trading Platform
            </a>
          </div>

          <!-- Important Notice -->
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <p style="color: #333; margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>Important:</strong> This platform is provided by Tradyfi.ng to facilitate secure communication 
              between traders and clients. Always verify transaction details and trade responsibly.
            </p>
          </div>

          <p style="color: #777777; line-height: 1.6; margin: 25px 0 0; font-size: 14px;">
            If you have any technical issues or concerns about this platform, please don't hesitate to contact our support team.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            <strong>${businessName}</strong><br>
            Powered by Tradyfi.ng
          </p>
          <p style="color: #adb5bd; margin: 15px 0 0; font-size: 12px;">
            Your secure trading portal: <a href="https://${subdomain}.tradyfi.ng" style="color: #667eea;">${subdomain}.tradyfi.ng</a>
          </p>
        </div>
      </div>
    `
  })
};

// Email service function
export async function sendWelcomeEmail(
  emailTransporter: any,
  type: 'traderWelcome' | 'traderVerified' | 'traderRejected' | 'userWelcome',
  email: string,
  data: {
    firstName: string;
    lastName: string;
    businessName?: string;
    subdomain?: string;
  }
) {
  try {
    let template;
    
    switch (type) {
      case 'traderWelcome':
        template = emailTemplates.traderWelcome(data.firstName, data.lastName);
        break;
      case 'traderVerified':
        template = emailTemplates.traderVerified(
          data.firstName, 
          data.lastName, 
          data.businessName!, 
          data.subdomain!
        );
        break;
      case 'traderRejected':
        template = emailTemplates.traderRejected(
          data.firstName, 
          data.lastName, 
          data.businessName!
        );
        break;
      case 'userWelcome':
        template = emailTemplates.userWelcome(
          data.firstName, 
          data.lastName, 
          data.businessName!, 
          data.subdomain!
        );
        break;
      default:
        throw new Error('Invalid email template type');
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`${type} email sent successfully to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    throw error;
  }
}