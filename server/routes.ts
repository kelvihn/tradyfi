import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticate, hashPassword, comparePassword, generateToken, type AuthRequest } from "./basicAuth";
import { insertTraderSchema, insertChatMessageSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { registerSubscriptionRoutes } from "./subscriptionRoutes";
import { sendWelcomeEmail } from "./emailTemplates";

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 465,
  secure: true,
  auth: {
    user: 'apikey',
    pass: process.env.SMTP_PASS
  },
});

export { emailTransporter };

export async function registerRoutes(app: Express): Promise<Server> {

  const chatModule = await import('./routes/chat.js' as any);
  const chatRoutes = chatModule.default || chatModule;

  const pushModule = await import('./routes/push.js' as any);
  const pushRoutes = pushModule.default || pushModule;

  const fcmModule = await import('./routes/fcm.js' as any);
  const fcmRoutes = fcmModule.default || fcmModule;
  
  app.use('/api/fcm', fcmRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/push', pushRoutes);


  // In your routes
app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  });
});

  // Get current authenticated user
  app.get('/api/auth/user', authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      res.json({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Update the /api/user/login route in server/routes.ts

app.post('/api/user/login', async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;

    console.log("User login request:", req.body);

    if (!email || !password || !subdomain) {
      return res.status(400).json({ message: "Email, password, and subdomain are required" });
    }

    // Verify trader exists and is active
    const trader = await storage.getTraderBySubdomain(subdomain);
    if (!trader) {
      return res.status(404).json({ message: "Trader portal not found" });
    }

    if (trader.status !== 'verified') {
      return res.status(403).json({ message: "Trader portal is not active" });
    }

    // Find user by email (NEW: No trader dependency)
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // OPTIONAL: Create analytics tracking for first interaction
    try {
      await storage.getOrCreatePortalUser(user.id, trader.id);
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
      // Don't fail login if analytics fail
    }

    const token = await generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subdomain: trader.subdomain,
        traderId: trader.id, 
      }
    });

  } catch (error) {
    console.error("User login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.post('/api/user/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, subdomain } = req.body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName || !subdomain) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedSubdomain = subdomain.toLowerCase().trim();

    // 1. Check if trader exists
    const trader = await storage.getTraderBySubdomain(normalizedSubdomain);
    if (!trader) {
      return res.status(404).json({ message: "Trader with subdomain not found" });
    }

    // 2. Check if user already exists for this trader
    const userExists = await storage.checkUserExistsForTrader(normalizedEmail, trader.id);
    if (userExists) {
      return res.status(409).json({ message: "User already exists for this subdomain" });
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    // 4. Create user and link to trader (using transaction)
    const userId = nanoid();
    await storage.createUserWithTraderLink({
      id: userId,
      email: normalizedEmail,
      emailVerified: true,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user',
    }, trader.id);

    // 5. Generate token and return response
    const token = await generateToken(userId);
    
    res.status(201).json({
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'user',
        subdomain: trader.subdomain,
        traderId: trader.id,
      },
    });

  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


  // Admin login route
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);

      console.log("user from amdin is:", user);

      if (!user || user.role !== 'admin') {
        console.log("got to admin eror");
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const isValidPassword = comparePassword(password, user.password);

      console.log("is password valid: ", isValidPassword);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

  const token = await generateToken(user.id);
      
      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Registration route
// server/routes.ts - Update main registration to support user type selection
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, userType = 'user' } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      id: nanoid(),
      email,
      firstName,
      lastName,
      emailVerified: true,
      password: hashedPassword,
      role: userType === 'trader' ? 'trader' : 'user',
    });

    // Only create trader profile if user selected "trader"
    if (userType === 'trader') {
      await storage.createTrader({
        userId: user.id,
        businessName: `${firstName} ${lastName}`,
        contactInfo: email,
        nin: '', // Will be filled during verification
        status: 'unverified',
        profileDescription: '',
      });

      try {
        await sendWelcomeEmail(emailTransporter, 'traderWelcome', email, {
          firstName,
          lastName,
          nextStep: 'Complete your trader profile to get started'
        });
      } catch (emailError) {
        console.error('Failed to send trader welcome email:', emailError);
      }
    } else {
      try {
        await sendWelcomeEmail(emailTransporter, 'userWelcome', email, {
          firstName,
          lastName,
          nextStep: 'Explore our verified traders and start trading'
        });
      } catch (emailError) {
        console.error('Failed to send user welcome email:', emailError);
      }
    }

    // Generate token
    const token = await generateToken(user.id);

    res.json({ 
      message: "Registration successful", 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      nextStep: userType === 'trader' ? 'complete_trader_profile' : 'explore_platform'
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

  // Login route
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);

      console.log("user is @@@:", user);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = await generateToken(user.id);

      console.log("token generated: ", token);
      
      // Set cookie for browser and return token for API
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ 
        message: "Login successful", 
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get('/api/auth/user', authenticate, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // Check if user is a trader
      const trader = await storage.getTraderByUserId(user.id);
      
      res.json({
        ...user,
        trader: trader || null
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout routes (support both GET and POST)
  app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
  });

  app.get('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
  });

app.get('/api/trader/check-domain-validity/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    const existingTrader = await storage.getTraderBySubdomain(domain);
    if (existingTrader) {
      return res.json({
        available: true,
        message: "This is valid"
      });
    }

    res.json({
      available: false,
      message: "Subdomain is invalid"
    });
  } catch (error) {
    console.error("Error checking subdomain:", error);
    res.status(500).json({ message: "Failed to check subdomain validity" });
  }
});


  // Check subdomain availability
  app.get('/api/trader/check-subdomain/:subdomain', async (req, res) => {
    try {
      const { subdomain } = req.params;
      
      // Validate subdomain format (alphanumeric, lowercase, no spaces)
      const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
      if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 30) {
        return res.json({ 
          available: false, 
          message: "Subdomain must be 3-30 characters, lowercase letters, numbers, and hyphens only" 
        });
      }

      // Check reserved subdomains
      const reserved = ['www', 'admin', 'api', 'app', 'mail', 'ftp', 'support', 'help', 'blog'];
      if (reserved.includes(subdomain)) {
        return res.json({ 
          available: false, 
          message: "This subdomain is reserved" 
        });
      }

      // Check if subdomain is already taken
      const existingTrader = await storage.getTraderBySubdomain(subdomain);
      if (existingTrader) {
        return res.json({ 
          available: false, 
          message: "This subdomain is already taken" 
        });
      }

      res.json({ 
        available: true, 
        message: "Subdomain is available" 
      });
    } catch (error) {
      console.error("Error checking subdomain:", error);
      res.status(500).json({ message: "Failed to check subdomain availability" });
    }
  });

  // Get trader status
 app.get('/api/trader/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const trader = await storage.getTraderByUserId(userId);
    
    // If trader is suspended, include the reason in the response
    if (trader && trader.status === 'suspended') {
      return res.json({
        ...trader,
        isSuspended: true,
        suspensionReason: trader.deactivationReason || 'Account has been temporarily suspended'
      });
    }
    
    res.json(trader || null);
  } catch (error) {
    console.error("Error fetching trader status:", error);
    res.status(500).json({ message: "Failed to fetch trader status" });
  }
});

  // Trader verification (update existing trader with business details)
// Updated registration route in routes.ts
app.post('/api/trader/register', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { 
      businessName, 
      contactInfo, 
      documentType, 
      documentUrl, 
      documentPublicId, 
      profileDescription, 
      subdomain 
    } = req.body;

    // Validate required fields
    if (!businessName || !contactInfo || !documentType || !documentUrl || !subdomain) {
      return res.status(400).json({ 
        message: "Business name, contact info, document type, document upload, and subdomain are required" 
      });
    }

    // Validate document type
    const validDocumentTypes = ['national_id', 'drivers_license', 'international_passport'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 30) {
      return res.status(400).json({ message: "Invalid subdomain format" });
    }

    // Check if subdomain is available
    const existingSubdomain = await storage.getTraderBySubdomain(subdomain);
    if (existingSubdomain) {
      return res.status(400).json({ message: "Subdomain is already taken" });
    }

    console.log("user id is @@", userId);

    // Get existing trader profile
    const existingTrader = await storage.getTraderByUserId(userId);

    console.log("existing trader is @@", existingTrader);

    if (!existingTrader) {
      return res.status(404).json({ message: "Trader profile not found" });
    }

    // Get user details for notification email
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update trader profile with verification details
    const trader = await storage.updateTrader(existingTrader.id, {
      businessName,
      contactInfo,
      documentType,
      documentUrl,
      documentPublicId,
      profileDescription: profileDescription || '',
      subdomain,
      status: 'verification_pending',
    });

    // Send notification email to admin
    try {
      const documentTypeDisplayName = {
        'national_id': 'National ID',
        'drivers_license': "Driver's License",
        'international_passport': 'International Passport'
      };

      const adminNotificationEmail = {
        from: process.env.FROM_EMAIL,
        to: 'tradyfi.ng@gmail.com',
        subject: `🚨 New Trader Verification Submission - ${businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🚨 New Trader Verification</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Requires Admin Review</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Trader Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555; width: 150px;">Business Name:</td>
                    <td style="padding: 8px 0; color: #333;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Subdomain:</td>
                    <td style="padding: 8px 0; color: #333;">
                      <strong style="color: #007bff;">${subdomain}.tradyfi.ng</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Contact Info:</td>
                    <td style="padding: 8px 0; color: #333;">${contactInfo}</td>
                  </tr>
               
                </table>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">User Account Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555; width: 150px;">Full Name:</td>
                    <td style="padding: 8px 0; color: #333;">${user.firstName} ${user.lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">
                      <a href="mailto:${user.email}" style="color: #007bff; text-decoration: none;">${user.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">User ID:</td>
                    <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${user.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Submitted:</td>
                    <td style="padding: 8px 0; color: #333;">
                      ${new Date().toLocaleString('en-US', { 
                        timeZone: 'Africa/Lagos',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })} (WAT)
                    </td>
                  </tr>
                </table>
              </div>

              ${profileDescription ? `
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Profile Description</h2>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
                    <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${profileDescription}</p>
                  </div>
                </div>
              ` : ''}

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">⚠️ Action Required</h3>
                <p style="color: #856404; margin: 0 0 15px 0;">
                  This trader verification requires admin review. Please verify the submitted documents and approve or reject the application.
                </p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <a href="https://tradyfi.ng/admin/login" 
                     style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Review in Admin Panel
                  </a>
                  <a href="${documentUrl}" target="_blank"
                     style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Document
                  </a>
                </div>
              </div>

              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-top: 3px solid #007bff; text-align: center;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  <strong>Verification Guidelines:</strong> Review document authenticity, business information accuracy, and subdomain appropriateness before approval.
                </p>
              </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0;">
                This is an automated notification from Tradyfi.ng trader verification system.<br>
                Do not reply to this email. For support, contact <a href="mailto:support@tradyfi.ng" style="color: #007bff;">support@tradyfi.ng</a>
              </p>
            </div>
          </div>
        `
      };

      await emailTransporter.sendMail(adminNotificationEmail);
      console.log('✅ Admin notification email sent successfully');

    } catch (emailError) {
      console.error('❌ Failed to send admin notification email:', emailError);
      // Don't fail the registration if email fails, but log the error
    }

    res.status(201).json({ 
      message: "Trader registration submitted for verification", 
      trader 
    });
  } catch (error) {
    console.error("Trader registration error:", error);
    res.status(500).json({ message: "Trader registration failed" });
  }
});

  // Admin-only routes
  app.get('/api/admin/traders', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allTraders = await storage.getAllTraders();
      res.json(allTraders);
    } catch (error) {
      console.error("Get all traders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/admin/traders/pending', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pendingTraders = await storage.getPendingTraders();
      res.json(pendingTraders);
    } catch (error) {
      console.error("Get pending traders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

app.post('/api/admin/traders/:id/approve', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const traderId = parseInt(req.params.id);
    const updatedTrader = await storage.updateTrader(traderId, { status: 'verified' });
    
    // Get trader user details for email
    const traderUser = await storage.getUser(updatedTrader.userId);

     console.log('Trader user is:', traderUser);
     console.log('Subdomain user is:', updatedTrader.subdomain);
     
    
    if (traderUser && updatedTrader.subdomain) {
      console.log('valid to send data ');
      try {
        await sendWelcomeEmail(emailTransporter, 'traderVerified', traderUser.email, {
          firstName: traderUser.firstName || '',
          lastName: traderUser.lastName || '',
          businessName: updatedTrader.businessName,
          subdomain: updatedTrader.subdomain
        });
      } catch (emailError) {
        console.error('Failed to send trader verification email:', emailError);
        // Don't fail the approval if email fails
      }
    }
    
    res.json(updatedTrader);
  } catch (error) {
    console.error("Approve trader error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

  app.post('/api/admin/traders/:id/reject', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const traderId = parseInt(req.params.id);
      const updatedTrader = await storage.updateTrader(traderId, { status: 'rejected' });

      const traderUser = await storage.getUser(updatedTrader.userId);

      try {
        await sendWelcomeEmail(emailTransporter, 'traderRejected', traderUser.email, {
          firstName: traderUser.firstName || '',
          lastName: traderUser.lastName || '',
          businessName: updatedTrader.businessName
        });
      } catch (emailError) {
        console.error('Failed to send trader verification email:', emailError);
        // Don't fail the approval if email fails
      }


      res.json(updatedTrader);
    } catch (error) {
      console.error("Reject trader error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/admin/stats', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allTraders = await storage.getAllTraders();
      const pendingTraders = allTraders.filter(t => t.status === 'verification_pending');
      const approvedTraders = allTraders.filter(t => t.status === 'verified');
      const rejectedTraders = allTraders.filter(t => t.status === 'rejected');
      const subscriptionStats = await storage.getSubscriptionStats();

      res.json({
        totalTraders: allTraders.length,
        pendingApprovals: pendingTraders.length,
        approvedTraders: approvedTraders.length,
        rejectedTraders: rejectedTraders.length,
        ...subscriptionStats
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin subscription analytics
  app.get('/api/admin/subscription-analytics', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const analytics = await storage.getSubscriptionAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Failed to fetch subscription analytics" });
    }
  });

  // Update trader profile
  app.put('/api/trader/profile', authenticate, async (req: AuthRequest, res) => {
    try {
      const trader = await storage.getTraderByUserId(req.user!.id);
      if (!trader) {
        return res.status(404).json({ message: "Trader not found" });
      }

      const { businessName, contactInfo, profileDescription, subdomain } = req.body;
      
      // Check if subdomain is already taken by another trader
      if (subdomain && subdomain !== trader.subdomain) {
        const existingTrader = await storage.getTraderBySubdomain(subdomain);
        if (existingTrader) {
          return res.status(400).json({ message: "Subdomain already taken" });
        }
      }

      const updateData: any = {
        businessName,
        contactInfo,
        profileDescription
      };
      
      // Only include subdomain if it's provided
      if (subdomain !== undefined) {
        updateData.subdomain = subdomain;
      }

      const updatedTrader = await storage.updateTrader(trader.id, updateData);

      res.json(updatedTrader);
    } catch (error) {
      console.error("Update trader profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get trader statistics
  app.get('/api/trader/stats', authenticate, async (req: AuthRequest, res) => {
    try {
      const trader = await storage.getTraderByUserId(req.user!.id);
      if (!trader) {
        return res.status(404).json({ message: "Trader not found" });
      }

      // Get real statistics from database
      const portalUsers = await storage.getPortalUsersByTrader(trader.id);
      const chatRooms = await storage.getChatRoomsByTrader(trader.id);
      
      const stats = {
        portalVisits: portalUsers.length,
        transactions: chatRooms.length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching trader stats:", error);
      res.status(500).json({ message: "Failed to fetch trader stats" });
    }
  });

  // Chat API routes
  // User chat history
  app.get('/api/user/chats', authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const chatRooms = await storage.getChatRoomsByUser(userId);
      
      // Get chat rooms with trader info and last message time
      const chatsWithDetails = await Promise.all(
        chatRooms.map(async (room) => {
          const trader = await storage.getTrader(room.traderId);
          const messages = await storage.getMessagesByRoom(room.id);
          const lastMessage = messages[messages.length - 1];
          const unreadCount = await storage.getUnreadMessageCount(room.id, userId);
          
          return {
            id: room.id,
            traderId: room.traderId,
            traderBusinessName: trader?.businessName || 'Unknown Trader',
            traderSubdomain: trader?.subdomain || '',
            tradingOption: room.tradingOption,
            lastMessageTime: lastMessage?.createdAt || room.createdAt,
            messageCount: messages.length,
            unreadCount
          };
        })
      );

      res.json(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      res.status(500).json({ message: 'Failed to fetch user chats' });
    }
  });

  app.get('/api/trader/chats', authenticate, async (req: AuthRequest, res) => {
    try {
      const trader = await storage.getTraderByUserId(req.user!.id);
      if (!trader) {
        return res.status(404).json({ message: "Trader not found" });
      }
      
      const chatRooms = await storage.getChatRoomsByTrader(trader.id);
      
      // Get chat rooms with user info and last message time for traders
      const chatsWithDetails = await Promise.all(
        chatRooms.map(async (room) => {
          const user = await storage.getUser(room.userId);
          const messages = await storage.getMessagesByRoom(room.id);
          const lastMessage = messages[messages.length - 1];
          
          return {
            id: room.id,
            userId: room.userId,
            userName: user?.firstName || user?.email || 'Unknown User',
            userEmail: user?.email || '',
            tradingOption: room.tradingOption,
            lastMessageTime: lastMessage?.createdAt || room.createdAt,
            messageCount: messages.length,
            isActive: room.isActive
          };
        })
      );
      
      res.json(chatsWithDetails);
    } catch (error) {
      console.error("Error fetching trader chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get('/api/chat/rooms/:roomId/messages', authenticate, async (req: AuthRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getMessagesByRoom(roomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Mark messages as read
  app.post('/api/chat/rooms/:roomId/mark-read', authenticate, async (req: AuthRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.user!.id;
      
      await storage.markMessagesAsRead(roomId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Send a new message
  app.post('/api/chat/rooms/:roomId/messages', authenticate, async (req: AuthRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { content, attachments } = req.body;
      const userId = req.user!.id;
      
      const message = await storage.createMessage({
        chatRoomId: roomId,
        senderId: userId,
        message: content || '',
        attachments: attachments ? JSON.stringify(attachments) : null
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/chat/rooms', authenticate, async (req: AuthRequest, res) => {
    try {
      const { traderId, tradingOption } = req.body;
      
      // Check if chat room already exists
      const existingRoom = await storage.getChatRoomByUserAndTrader(
        req.user!.id, 
        traderId, 
        tradingOption
      );
      
      if (existingRoom) {
        return res.json(existingRoom);
      }

      // Create new chat room
      const chatRoom = await storage.createChatRoom({
        userId: req.user!.id,
        traderId,
        tradingOption,
        isActive: true
      });
      
      res.json(chatRoom);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  // Trader portal routes
 app.get('/api/trader/portal/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const trader = await storage.getTraderBySubdomain(subdomain);
    
    if (!trader) {
      return res.status(404).json({ message: 'Trader portal not found' });
    }
    
    // Check if trader is verified AND not suspended
    if (trader.status !== 'verified') {
      let message = 'Trader portal is not active';
      
      // Provide specific messages for different statuses
      switch (trader.status) {
        case 'suspended':
          message = 'This trader portal has been temporarily suspended';
          break;
        case 'verification_pending':
          message = 'Trader portal is pending verification';
          break;
        case 'rejected':
          message = 'Trader portal access has been denied';
          break;
        case 'unverified':
          message = 'Trader portal is not yet verified';
          break;
        default:
          message = 'Trader portal is not active';
      }
      
      return res.status(403).json({ message });
    }
    
    // Return public trader information
    res.json({
      id: trader.id,
      businessName: trader.businessName,
      profileDescription: trader.profileDescription,
      contactInfo: trader.contactInfo,
      subdomain: trader.subdomain,
      status: trader.status
    });
  } catch (error) {
    console.error('Error fetching trader portal:', error);
    res.status(500).json({ message: 'Failed to fetch trader portal' });
  }
});

app.get('/api/trader/:subdomain/auth', authenticate, async (req: AuthRequest, res) => {
  try {
    const { subdomain } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const trader = await storage.getTraderBySubdomain(subdomain);
    if (!trader) {
      return res.status(404).json({ message: 'Trader not found' });
    }
    
    // REMOVE portalUser dependency - allow any authenticated user
    // Optional: Track interaction for analytics
    try {
      const portalUser = await storage.getOrCreatePortalUser(userId, trader.id);
      res.json({
        userId: portalUser.userId,
        traderId: portalUser.traderId,
        registeredAt: portalUser.createdAt,
        interactionCount: portalUser.interactionCount
      });
    } catch (error) {
      // If analytics fail, still allow access
      console.error('Analytics error:', error);
      res.json({
        userId,
        traderId: trader.id,
        registeredAt: new Date(),
        interactionCount: 1
      });
    }
  } catch (error) {
    console.error('Error checking trader auth:', error);
    res.status(500).json({ message: 'Failed to check authentication' });
  }
});

  app.post('/api/trader/:subdomain/login', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const trader = await storage.getTraderBySubdomain(subdomain);
    if (!trader) {
      return res.status(404).json({ message: 'Trader portal not found' });
    }
    
    if (trader.status !== 'verified') {
      return res.status(403).json({ message: 'Trader portal is not active' });
    }
    
    // Find user by email - NO trader dependency
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // OPTIONAL: Create or update analytics tracking
    try {
      await storage.getOrCreatePortalUser(user.id, trader.id);
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
      // Don't fail login if analytics fail
    }
    
    // Generate token
    const token = await generateToken(user.id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in trader portal login:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// server/routes.ts - Replace trader portal registration with redirect
app.post('/api/trader/:subdomain/register', async (req, res) => {
  res.status(410).json({ 
    message: 'Registration has moved to the main platform',
    action: 'redirect',
    redirectUrl: `${process.env.MAIN_DOMAIN}/register`,
    instructions: 'Please register on the main platform and then return to this trader portal to login.'
  });
});

// app.post('/api/trader/:subdomain/register', async (req, res) => {
//   try {
//     const { subdomain } = req.params;
//     const { email, password, firstName, lastName } = req.body;
    
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }
    
//     const trader = await storage.getTraderBySubdomain(subdomain);
//     if (!trader) {
//       return res.status(404).json({ message: 'Trader portal not found' });
//     }
    
//     if (trader.status !== 'verified') {
//       return res.status(403).json({ message: 'Trader portal is not active' });
//     }
    
//     // Check if user already exists
//     const existingUser = await storage.getUserByEmail(email);
//     let user;
    
//     if (existingUser) {
//       user = existingUser;
//     } else {
//       // Create new user
//       const hashedPassword = await hashPassword(password);
//       user = await storage.createUser({
//         id: nanoid(),
//         email,
//         emailVerified: true,
//         password: hashedPassword,
//         firstName: firstName || '',
//         lastName: lastName || '',
//         role: 'user'
//       });
//     }
    
//     // Check if user is already registered with this trader
//     const existingPortalUser = await storage.getPortalUserByUserAndTrader(user.id, trader.id);
//     if (existingPortalUser) {
//       return res.status(400).json({ message: 'You are already registered with this trader' });
//     }
    
//     // Register user with trader
//     await storage.createPortalUser({
//       userId: user.id,
//       traderId: trader.id
//     });

//     // Send welcome email to new user (only if they weren't already registered)
//     if (!existingUser) {
//       try {
//         await sendWelcomeEmail(emailTransporter, 'userWelcome', email, {
//           firstName: firstName || '',
//           lastName: lastName || '',
//           businessName: trader.businessName,
//           subdomain: trader.subdomain || subdomain
//         });
//       } catch (emailError) {
//         console.error('Failed to send user welcome email:', emailError);
//         // Don't fail the registration if email fails
//       }
//     }
    
//     // Generate token
//     const token = await generateToken(user.id);
    
//     res.json({
//       message: 'Registration successful',
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     console.error('Error in trader portal registration:', error);
//     res.status(500).json({ message: 'Registration failed' });
//   }
// });


  // Add this route to your routes file
app.get('/api/trader/subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    console.log('Looking for trader with subdomain:', subdomain);
    
    const trader = await storage.getTraderBySubdomain(subdomain);
    console.log('Found trader:', trader);
    
    if (!trader) {
      return res.status(404).json({ message: 'Trader not found' });
    }

    res.json(trader);
  } catch (error) {
    console.error('Trader fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  // Logout route
  app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
  });

// const emailTransporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// Add this test function
async function testEmailConnection() {
  console.log('Testing SMTP connection...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  
  try {
    await emailTransporter.verify();
    console.log('✅ SMTP connection successful');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
  }
}

// Updated OTP sending endpoint in routes.ts
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, type, purpose = 'registration' } = req.body; // purpose: 'registration' or 'password_reset'
    
    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" });
    }

    console.log(`OTP request: email=${email}, type=${type}, purpose=${purpose}`);

    // Check if email exists
    const emailCheck = await storage.checkEmailExists(email);
    
    if (purpose === 'registration') {
      // For registration, email should NOT exist
      if (emailCheck.exists) {
        return res.status(400).json({ 
          message: "An account with this email already exists. Please use a different email or try logging in." 
        });
      }
    } else if (purpose === 'password_reset') {
      // For password reset, email MUST exist
      if (!emailCheck.exists) {
        return res.status(404).json({ 
          message: "No account found with this email address." 
        });
      }
      
      // Ensure the user type matches what they're trying to reset
      if (emailCheck.userType !== type) {
        return res.status(400).json({ 
          message: `This email is registered as a ${emailCheck.userType}, not a ${type}.` 
        });
      }
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await storage.createEmailVerification({
      email,
      otp,
      expiresAt,
      type,
      verified: false
    });

    // Send OTP email with appropriate content
    const isPasswordReset = purpose === 'password_reset';
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: isPasswordReset ? 'Password Reset - Tradyfi.ng' : 'Email Verification - Tradyfi.ng',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${isPasswordReset ? 'Reset Your Password' : 'Verify Your Email Address'}</h2>
          <p>${isPasswordReset ? 
            'You requested to reset your password for your Tradyfi.ng account.' : 
            'Thank you for registering with Tradyfi.ng!'
          }</p>
          <p>Your ${isPasswordReset ? 'password reset' : 'verification'} code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this ${isPasswordReset ? 'password reset' : 'verification'}, please ignore this email.</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: `${isPasswordReset ? 'Password reset' : 'Verification'} code sent successfully`,
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Masked email
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});


// Add these password reset endpoints to your routes.ts

// Send password reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'user' or 'trader'
    
    if (!email || !type) {
      return res.status(400).json({ message: "Email and user type are required" });
    }

    // Check if email exists
    const emailCheck = await storage.checkEmailExists(email);
    
    if (!emailCheck.exists) {
      return res.status(404).json({ 
        message: "No account found with this email address." 
      });
    }
    
    // Ensure the user type matches
    if (emailCheck.userType !== type) {
      return res.status(400).json({ 
        message: `This email is registered as a ${emailCheck.userType}, not a ${type}.` 
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await storage.createEmailVerification({
      email,
      otp,
      expiresAt,
      type,
      verified: false
    });

    // Send password reset email
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Password Reset - Tradyfi.ng',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password for your Tradyfi.ng account.</p>
          <p>Your password reset code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: "Password reset code sent successfully",
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Masked email
    });
  } catch (error) {
    console.error("Error sending password reset OTP:", error);
    res.status(500).json({ message: "Failed to send password reset code" });
  }
});

// Verify password reset OTP
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Get verification record
    const verification = await storage.getEmailVerification(email);
    
    if (!verification) {
      return res.status(400).json({ message: "No verification found for this email" });
    }

    if (verification.verified) {
      return res.status(400).json({ message: "This verification code has already been used" });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (verification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark as verified but don't delete - we'll need it for password reset
    await storage.updateEmailVerification(email, { verified: true });

    res.json({ 
      success: true, 
      message: "OTP verified successfully. You can now reset your password.",
      resetToken: Buffer.from(`${email}:${otp}:${Date.now()}`).toString('base64') // Simple reset token
    });
  } catch (error) {
    console.error("Error verifying reset OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Reset password with new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Decode reset token
    let email, otp, timestamp;
    try {
      const decoded = Buffer.from(resetToken, 'base64').toString();
      [email, otp, timestamp] = decoded.split(':');
    } catch (error) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    // Check if token is not too old (30 minutes)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 30 * 60 * 1000) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    // Verify the OTP was verified
    const verification = await storage.getEmailVerification(email);
    
    if (!verification || !verification.verified || verification.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await storage.updateUserPassword(user.id, hashedPassword);

    // Clean up verification record
    await storage.updateEmailVerification(email, { verified: false });

    res.json({ 
      success: true, 
      message: "Password reset successfully. You can now log in with your new password." 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

  // Verify OTP and complete registration
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, userData } = req.body;

    console.log("data coming to verify is:", req.body);
    
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Get verification record
    const verification = await storage.getEmailVerification(email);
    
    if (!verification) {
      return res.status(400).json({ message: "No verification found for this email" });
    }

    if (verification.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (verification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark as verified
    await storage.updateEmailVerification(email, { verified: true });

    // If userData is provided, create the account
    if (userData) {
      let newUser;
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(userData.password);
      
      // Get userType from userData (from the new registration flow)
      const userType = userData.userType || verification.type || 'user';
      
      if (userType === 'trader') {
        // Create trader account
        newUser = await storage.createUser({
          id: nanoid(),
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          emailVerified: true,
          password: hashedPassword,
          role: "trader" as const,
        });

        // Create trader profile
        await storage.createTrader({
          userId: newUser.id,
          businessName: `${userData.firstName} ${userData.lastName}`,
          contactInfo: email,
          nin: '',
          status: 'unverified',
          profileDescription: '',
        });

        // Send trader welcome email
        try {
          console.log(`Sending trader welcome email to ${userData.firstName} ${userData.lastName}`);
          await sendWelcomeEmail(emailTransporter, 'traderWelcome', email, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            nextStep: 'Complete your trader profile to get started'
          });
        } catch (emailError) {
          console.error('Failed to send trader welcome email:', emailError);
          // Don't fail the registration if email fails
        }

      } else {
        // Create regular user account
        newUser = await storage.createUser({
          id: nanoid(),
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          emailVerified: true,
          password: hashedPassword,
          role: "user" as const,
        });

        // Send user welcome email
        try {
          console.log(`Sending user welcome email to ${userData.firstName} ${userData.lastName}`);
          await sendWelcomeEmail(emailTransporter, 'userWelcome', email, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            nextStep: 'Explore our verified traders and start trading'
          });
        } catch (emailError) {
          console.error('Failed to send user welcome email:', emailError);
          // Don't fail the registration if email fails
        }
      }

      // Generate token
      const token = await generateToken(newUser.id);

      // Remove password from response for security
      const { password: _, ...userWithoutPassword } = newUser;

      res.json({ 
        success: true, 
        message: "Email verified and account created successfully",
        token,
        user: userWithoutPassword,
        userType: userType,
        nextStep: userType === 'trader' ? 'complete_trader_profile' : 'discover_traders'
      });
    } else {
      res.json({ 
        success: true, 
        message: "Email verified successfully" 
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Add these routes to your server/routes.ts file

// Get all verified traders for discovery
app.get('/api/traders/discover', async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    const result = await storage.getDiscoverableTraders({
      search: search as string,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({
      traders: result.traders,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: result.total,
        hasMore: Number(offset) + Number(limit) < result.total,
      }
    });
    
  } catch (error) {
    console.error('Error fetching traders for discovery:', error);
    res.status(500).json({ message: 'Failed to fetch traders' });
  }
});

// Get specific trader statistics
app.get('/api/trader/:traderId/stats', async (req, res) => {
  try {
    const { traderId } = req.params;
    
    const stats = await storage.getTraderStats(Number(traderId));
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error fetching trader stats:', error);
    res.status(500).json({ message: 'Failed to fetch trader statistics' });
  }
});

// Search traders (for search suggestions/autocomplete)
app.get('/api/traders/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({ traders: [] });
    }
    
    const traders = await storage.searchTraders(q as string, Number(limit));
    
    res.json({ traders });
    
  } catch (error) {
    console.error('Error searching traders:', error);
    res.status(500).json({ message: 'Failed to search traders' });
  }
});

// Get user's discovery dashboard data (recent chats, recent traders, etc.)
app.get('/api/user/discovery-dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's active chats
    const activeChats = await storage.getUserActiveChatsForDiscovery(userId);
    
    // Get recently interacted traders
    const recentTraders = await storage.getUserRecentTraders(userId, 5);
    
    // Get some featured/popular traders
    const featuredTraders = await storage.getDiscoverableTraders({
      limit: 6,
      offset: 0,
    });
    
    res.json({
      activeChats,
      recentTraders,
      featuredTraders: featuredTraders.traders,
    });
    
  } catch (error) {
    console.error('Error fetching user discovery dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch discovery dashboard' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { title, email, fullName, body } = req.body;
    
    // Validate required fields
    if (!title || !email || !fullName || !body) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Sanitize input to prevent HTML injection
    const sanitizeInput = (input: string) => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    const sanitizedTitle = sanitizeInput(title);
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedBody = sanitizeInput(body);

    // Send email to Tradyfi.ng support
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: 'tradyfi.ng@gmail.com',
      replyTo: email, // Allow replying directly to the sender
      subject: `Contact Form: ${sanitizedTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">New Contact Form Submission</h2>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Received: ${new Date().toLocaleString('en-US', { 
                timeZone: 'Africa/Lagos',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })} (WAT)
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">
              Contact Information
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Full Name:</td>
                <td style="padding: 8px 0; color: #333;">${sanitizedFullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Subject:</td>
                <td style="padding: 8px 0; color: #333;">${sanitizedTitle}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">
              Message
            </h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
              <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${sanitizedBody}</p>
            </div>
          </div>

          <div style="background: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Quick Actions</h4>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Reply:</strong> 
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(sanitizedTitle)}" 
                 style="color: #007bff; text-decoration: none;">
                Email ${sanitizedFullName}
              </a>
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Call:</strong> Check if phone number was provided in the message
            </p>
          </div>

          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">
              This message was sent via the Tradyfi.ng contact form.<br>
              Please respond within 24 hours to maintain our support standards.
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    // Optional: Send confirmation email to the user
    const confirmationMailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Message Received - ${sanitizedTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://tradyfi.ng/logo.svg" alt="Tradyfi.ng" style="height: 40px;" />
          </div>
          
          <h2 style="color: #333; text-align: center;">Thank You for Contacting Us!</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hi ${sanitizedFullName},
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            We've received your message about "<strong>${sanitizedTitle}</strong>" and appreciate you taking the time to reach out to us.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="color: #333; margin: 0 0 10px 0;">What happens next?</h3>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Our support team will review your message within 24 hours</li>
              <li>We'll respond to your inquiry at <strong>${email}</strong></li>
              <li>For urgent matters, you can call us at +234 818 658 6280</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            In the meantime, you might find answers to common questions in our 
            <a href="https://tradyfi.ng/help" style="color: #007bff; text-decoration: none;">help center</a>.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #555;">Need immediate assistance?</p>
            <a href="tel:+2348186586280" 
               style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">
              Call Support
            </a>
            <a href="mailto:hey@tradyfi.ng" 
               style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">
              Email Support
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              Best regards,<br>
              The Tradyfi.ng Support Team
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
              Lagos, Nigeria | hey@tradyfi.ng | +234 818 658 6280
            </p>
          </div>
        </div>
      `
    };

    try {
      await emailTransporter.sendMail(confirmationMailOptions);
    } catch (confirmationError) {
      console.error('Failed to send confirmation email:', confirmationError);
      // Don't fail the main request if confirmation email fails
    }

    res.json({ 
      success: true, 
      message: "Message sent successfully. We'll get back to you within 24 hours." 
    });

  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ 
      message: "Failed to send message. Please try again later." 
    });
  }
});


// Add these routes to your routes.ts file after the existing admin routes

// Suspend trader (deactivate)
app.post('/api/admin/traders/:id/suspend', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const traderId = parseInt(req.params.id);
    const { reason } = req.body; // Optional reason for suspension
    
    const updatedTrader = await storage.updateTrader(traderId, { 
      status: 'suspended',
      deactivationReason: reason || 'Suspended by admin'
    });
    
    // Get trader user details for notification email
    const traderUser = await storage.getUser(updatedTrader.userId);
    
    if (traderUser) {
      try {
        // Send suspension notification email
        const suspensionEmail = {
          from: process.env.FROM_EMAIL,
          to: traderUser.email,
          subject: `Account Suspended - ${updatedTrader.businessName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">⚠️ Account Suspended</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Important Notice</p>
              </div>
              
              <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                  Dear ${traderUser.firstName} ${traderUser.lastName},
                </p>
                
                <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                  Your trader account for <strong>${updatedTrader.businessName}</strong> has been temporarily suspended by our admin team.
                </p>
                
                ${reason ? `
                  <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h4 style="color: #721c24; margin: 0 0 10px 0;">Reason for Suspension:</h4>
                    <p style="color: #721c24; margin: 0; line-height: 1.5;">${reason}</p>
                  </div>
                ` : ''}
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h4 style="color: #856404; margin: 0 0 10px 0;">What this means:</h4>
                  <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>Your trader portal is no longer accessible to customers</li>
                    <li>Existing chat sessions may be affected</li>
                    <li>Your subdomain (${updatedTrader.subdomain}.tradyfi.ng) is temporarily suspended</li>
                  </ul>
                </div>
                
                <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h4 style="color: #0c5460; margin: 0 0 10px 0;">Next Steps:</h4>
                  <p style="color: #0c5460; margin: 0; line-height: 1.5;">
                    If you believe this suspension is in error or would like to appeal this decision, 
                    please contact our support team at <a href="mailto:hey@tradyfi.ng" style="color: #007bff;">hey@tradyfi.ng</a> 
                    with your account details and any relevant information.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="mailto:hey@tradyfi.ng?subject=Account%20Suspension%20Appeal%20-%20${encodeURIComponent(updatedTrader.businessName)}" 
                     style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Contact Support
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
                  <p style="margin: 0; color: #666; font-size: 13px;">
                    This is an automated notification from Tradyfi.ng admin system.
                  </p>
                </div>
              </div>
            </div>
          `
        };

        await emailTransporter.sendMail(suspensionEmail);
        console.log('✅ Suspension notification email sent successfully');

      } catch (emailError) {
        console.error('❌ Failed to send suspension email:', emailError);
        // Don't fail the suspension if email fails
      }
    }
    
    res.json({
      ...updatedTrader,
      message: "Trader suspended successfully"
    });
  } catch (error) {
    console.error("Suspend trader error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Unsuspend trader (reactivate)
app.post('/api/admin/traders/:id/unsuspend', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const traderId = parseInt(req.params.id);
    
    const updatedTrader = await storage.updateTrader(traderId, { 
      status: 'verified', // Reactivate to verified status
      deactivationReason: null // Clear suspension reason
    });
    
    // Get trader user details for notification email
    const traderUser = await storage.getUser(updatedTrader.userId);
    
    if (traderUser) {
      try {
        // Send reactivation notification email
        const reactivationEmail = {
          from: process.env.FROM_EMAIL,
          to: traderUser.email,
          subject: `Account Reactivated - ${updatedTrader.businessName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">✅ Account Reactivated</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome Back!</p>
              </div>
              
              <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                  Dear ${traderUser.firstName} ${traderUser.lastName},
                </p>
                
                <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                  Great news! Your trader account for <strong>${updatedTrader.businessName}</strong> has been reactivated and is now fully operational.
                </p>
                
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h4 style="color: #155724; margin: 0 0 10px 0;">Your account is now active:</h4>
                  <ul style="color: #155724; margin: 0; padding-left: 20px;">
                    <li>Your trader portal is accessible to customers</li>
                    <li>All trading features are restored</li>
                    <li>Your subdomain (${updatedTrader.subdomain}.tradyfi.ng) is live</li>
                    <li>Chat functionality is fully operational</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://tradyfi.ng/trader/dashboard" 
                     style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Access Your Dashboard
                  </a>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h4 style="color: #856404; margin: 0 0 10px 0;">Important Reminders:</h4>
                  <p style="color: #856404; margin: 0; line-height: 1.5;">
                    Please ensure you continue to follow our community guidelines and terms of service to maintain your account in good standing.
                  </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
                  <p style="margin: 0; color: #666; font-size: 13px;">
                    This is an automated notification from Tradyfi.ng admin system.
                  </p>
                </div>
              </div>
            </div>
          `
        };

        await emailTransporter.sendMail(reactivationEmail);
        console.log('✅ Reactivation notification email sent successfully');

      } catch (emailError) {
        console.error('❌ Failed to send reactivation email:', emailError);
        // Don't fail the reactivation if email fails
      }
    }
    
    res.json({
      ...updatedTrader,
      message: "Trader reactivated successfully"
    });
  } catch (error) {
    console.error("Unsuspend trader error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


  // Resend OTP
  app.post('/api/auth/resend-otp', async (req, res) => {
    try {
      const { email } = req.body;
      
      const verification = await storage.getEmailVerification(email);
      if (!verification) {
        return res.status(400).json({ message: "No verification found for this email" });
      }

      // Generate new OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.updateEmailVerification(email, { otp, expiresAt });

      // Send new OTP
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'New Verification Code - Tradyfi.ng',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Verification Code</h2>
            <p>Your new verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `
      };

      await emailTransporter.sendMail(mailOptions);

      res.json({ 
        success: true, 
        message: "New OTP sent successfully" 
      });
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });

  // Register subscription routes
  registerSubscriptionRoutes(app);

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const notificationModule = await import('./services/pushNotification.js' as any);
  const PushNotificationService = notificationModule.default || notificationModule;

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
  try {
    const data = JSON.parse(message.toString());
    
    switch (data.type) {
      case 'send_message':
        // ... existing message saving logic ...
        
        // NEW: Send push notification to recipients
        try {
          const room = await storage.getChatRoom(data.roomId);
          if (room) {
            // Determine receiver
            const receiverId = data.senderId === room.userId ? room.userId : 
                              (await storage.getTraderByUserId(room.traderId.toString()))?.userId;
            
            if (receiverId && receiverId !== data.senderId) {
              await PushNotificationService.sendChatNotification(
                data.senderId,
                receiverId,
                data.content,
                data.roomId,
                data.senderName,
                data.isTrader
              );
            }
          }
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
          // Don't fail the message sending if push notification fails
        }
        
        // ... rest of existing logic ...
        break;
    }
  } catch (error) {
    console.error('WebSocket message error:', error);
  }
});

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}

