import type { Express } from "express";
import { storage } from "./storage";
import { authenticate, type AuthRequest } from "./basicAuth";

// Helper function for consistent trial period calculation
function calculateTrialEndDate(): Date {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial
  return trialEndDate;
}

export function registerSubscriptionRoutes(app: Express) {
  // Subscription routes (for traders only)
  app.get('/api/subscription/plans', authenticate, async (req: AuthRequest, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/trader/subscription', authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      let subscription = await storage.getTraderSubscriptionWithPlan(userId);
      
      if (!subscription) {
        // Create default free trial subscription for new traders
        const plans = await storage.getActiveSubscriptionPlans();
        const freePlan = plans.find(plan => plan.price === 0);
        
        if (freePlan) {
          // Use consistent 7-day trial period regardless of plan duration
          const trialEndDate = calculateTrialEndDate();
          
          await storage.createTraderSubscription({
            userId,
            planId: freePlan.id,
            status: 'trial',
            endDate: trialEndDate,
            trialEndDate: trialEndDate,
          });
          
          subscription = await storage.getTraderSubscriptionWithPlan(userId);
        }
      } else {
        // Check if trial or subscription has expired
        const now = new Date();
        const endDate = new Date(subscription.endDate);
        
        if (now > endDate && subscription.status !== 'expired') {
          // Update status to expired
          await storage.updateTraderSubscription(subscription.id, {
            status: 'expired'
          });
          subscription = await storage.getTraderSubscriptionWithPlan(userId);
        }
      }

      console.log("subscription is:", subscription);
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching trader subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // NEW: Check subscription status for login page (public endpoint)
// CORRECTED: Check subscription status for login page (public endpoint)
app.get('/api/trader/subscription-status/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    console.log("subdomain is:", subdomain);
    
    if (!subdomain) {
      return res.status(400).json({ 
        hasActiveSubscription: false,
        message: 'Subdomain is required' 
      });
    }

    const trader = await storage.getTraderBySubdomain(subdomain);

    console.log("trader exists:", !!trader);
    console.log("trader status is", trader?.status);
    
    if (!trader) {
       console.log("user is not a trader");
      return res.status(404).json({ 
        hasActiveSubscription: false,
        message: 'Trader not found' 
      });
    }

    // Check if trader is approved
    if (trader.status !== 'verified') {
        console.log("trader is not verified");
      return res.status(200).json({ 
        hasActiveSubscription: false,
        traderName: trader.businessName,
        message: 'Trader not verified' 
      });
    }

    const subscription = await storage.getTraderSubscriptionWithPlan(trader.userId);
    
    if (!subscription) {
        console.log("there is no subscription");
      return res.status(200).json({ 
        hasActiveSubscription: false,
        traderName: trader.businessName,
        subscriptionStatus: 'none',
        message: 'No subscription found' 
      });
    }

    // CORRECTED LOGIC: Check if subscription provides portal access
    const now = new Date();
    const isExpired = subscription.endDate && new Date(subscription.endDate) < now;
    const isOnTrial = subscription.status === 'trial';
    const isActivePremium = subscription.status === 'active';
    
    // FIXED: Portal access is allowed if:
    // 1. User has active premium subscription, OR
    // 2. User is on trial AND trial hasn't expired
    const hasActiveSubscription = isActivePremium || (isOnTrial && !isExpired);

    console.log("status is", subscription.status);
    console.log("is expired:", isExpired);
    console.log("is on trial:", isOnTrial);
    console.log("is active premium:", isActivePremium);
    console.log("final hasActiveSubscription:", hasActiveSubscription);

    // If subscription is expired, update the status in database
    if (isExpired && subscription.status !== 'expired') {
      await storage.updateTraderSubscription(subscription.id, {
        status: 'expired'
      });
    }

    // IMPROVED: More accurate subscription status
    let subscriptionStatus = subscription.status;
    if (isExpired) {
      subscriptionStatus = 'expired';
    }

    res.json({ 
      hasActiveSubscription,
      traderName: trader.businessName,
      subscriptionStatus,
      endDate: subscription.endDate,
      trialEndDate: subscription.trialEndDate,
      planName: subscription.plan?.name || 'Unknown Plan',
      // Include trial information
      isOnTrial,
      daysLeft: subscription.endDate ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0,
      // Optional: Include payment info if available
      ...(subscription.createdAt && { lastPaymentDate: subscription.createdAt }),
      ...(subscription.endDate && { nextPaymentDate: subscription.endDate })
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ 
      hasActiveSubscription: false,
      message: 'Server error' 
    });
  }
});

  // Check if trader portal is active (subscription valid) - keeping existing endpoint
  app.get('/api/trader/:subdomain/portal-status', async (req, res) => {
    try {
      const { subdomain } = req.params;
      const trader = await storage.getTraderBySubdomain(subdomain);
      
      if (!trader) {
        return res.status(404).json({ 
          active: false, 
          message: "Trader not found" 
        });
      }

      if (trader.status !== 'approved') {
        return res.status(403).json({ 
          active: false, 
          message: "Trader not approved" 
        });
      }

      const subscription = await storage.getTraderSubscriptionWithPlan(trader.userId);
      
      if (!subscription) {
        return res.status(200).json({ 
          active: false, 
          message: "No active subscription" 
        });
      }

      // Check if subscription is expired
      const now = new Date();
      const isExpired = subscription.endDate && new Date(subscription.endDate) < now;
      
      if (isExpired || subscription.status === 'expired') {
        return res.status(200).json({ 
          active: false, 
          message: "Subscription expired" 
        });
      }

      res.json({ 
        active: true, 
        trader: {
          businessName: trader.businessName,
          description: trader.description
        }
      });
    } catch (error) {
      console.error("Error checking portal status:", error);
      res.status(500).json({ 
        active: false, 
        message: "Server error" 
      });
    }
  });

  // Admin subscription management routes
  app.get('/api/admin/subscription/plans', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching all subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.put('/api/admin/subscription/plans/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const planId = parseInt(req.params.id);
      const { price, name, duration, isActive } = req.body;
      
      const updatedPlan = await storage.updateSubscriptionPlan(planId, {
        price,
        name,
        duration,
        isActive,
      });
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  // Paystack payment initialization route
 app.post('/api/subscription/initialize-payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user!.id;
    
    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }
    
    // Get the subscription plan
    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    // Get user details
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Initializing payment for user:', userId, 'plan:', plan.name);

    // Check if we have Paystack secret key
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ message: "Payment system not configured" });
    }

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.price, // Amount in kobo
        currency: 'NGN',
        reference: `sub_${userId}_${planId}_${Date.now()}`,
        callback_url: `${req.protocol}://${req.get('host')}/trader/dashboard?tab=subscription&payment=success`,
        metadata: {
          userId,
          planId: planId.toString(),
          planName: plan.name
        }
      })
    });

    const paystackData = await paystackResponse.json();
    
    console.log('Paystack initialization response:', JSON.stringify(paystackData, null, 2));

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return res.status(400).json({ 
        message: "Failed to initialize payment", 
        error: paystackData.message || "Unknown error"
      });
    }

    res.json({
      status: true,
      message: "Payment initialized successfully",
      data: {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference
      }
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({ 
        message: "Unable to connect to payment provider" 
      });
    }
    
    res.status(500).json({ message: "Failed to initialize payment" });
  }
});

  // Paystack payment verification route
app.post('/api/subscription/verify-payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const { reference } = req.body;
    
    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    console.log('Verifying payment with reference:', reference);

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      }
    });

    const paystackData = await paystackResponse.json();
    
    console.log('Paystack response:', JSON.stringify(paystackData, null, 2));

    // Check if the response structure is valid
    if (!paystackData) {
       console.log(`Invalid response`, paystackData);
      return res.status(400).json({ 
        message: "Invalid response from payment provider" 
      });
    }

    // Check if the API call was successful
    if (!paystackData.status) {
       console.log(`Unknown error ${paystackData.message}`);
      return res.status(400).json({ 
        message: "Payment verification failed",
        error: paystackData.message || "Unknown error from payment provider"
      });
    }

    // Check if transaction data exists
    if (!paystackData.data) {
      return res.status(400).json({ 
        message: "Invalid transaction data received" 
      });
    }

    // Check if the transaction was successful
    if (paystackData.data.status !== 'success') {
       console.log("Not successful");
      return res.status(400).json({ 
        message: "Payment was not successful",
        status: paystackData.data.status || 'unknown',
        gateway_response: paystackData.data.gateway_response || 'No response'
      });
    }

    // Check if metadata exists
    if (!paystackData.data.metadata) {
      return res.status(400).json({ 
        message: "Transaction metadata missing" 
      });
    }

    // Extract metadata
    const { userId, planId } = paystackData.data.metadata;

     console.log(`Paystack metadata is ${paystackData.data.metadata}`);
    
    if (!userId || !planId) {
      return res.status(400).json({ 
        message: "Invalid transaction metadata - missing userId or planId" 
      });
    }

    // Get the plan to calculate subscription end date
    const plan = await storage.getSubscriptionPlan(parseInt(planId));
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Calculate subscription end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update user's subscription
    const existingSubscription = await storage.getTraderSubscriptionWithPlan(userId);

     console.log(`Existing subscription is @@@@ ${existingSubscription}`);
    
    if (existingSubscription) {
      // Update existing subscription
      await storage.updateTraderSubscription(existingSubscription.id, {
        planId: plan.id,
        status: 'active',
        endDate,
        trialEndDate: null // Clear trial end date since they're now premium
      });
    } else {
      // Create new subscription
      await storage.createTraderSubscription({
        userId,
        planId: plan.id,
        status: 'active',
        endDate,
        trialEndDate: null
      });
    }

    console.log(`Payment verified and subscription updated for user ${userId}`);

    res.json({
      status: true,
      message: "Payment verified and subscription updated successfully",
      data: {
        plan: plan.name,
        endDate,
        status: 'active'
      }
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({ 
        message: "Unable to connect to payment provider" 
      });
    }
    
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

  // Paystack webhook endpoint for automatic payment confirmation
  app.post('/api/subscription/webhook', async (req, res) => {
    try {
      const event = req.body;
      
      // Verify that this is a successful payment event
      if (event.event === 'charge.success' && event.data.status === 'success') {
        const { metadata, reference } = event.data;
        const { userId, planId } = metadata;
        
        // Get the plan to calculate subscription end date
        const plan = await storage.getSubscriptionPlan(parseInt(planId));
        if (!plan) {
          console.error('Subscription plan not found:', planId);
          return res.status(200).send('OK'); // Still return 200 to acknowledge webhook
        }

        // Calculate subscription end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        // Update user's subscription
        const existingSubscription = await storage.getTraderSubscriptionWithPlan(userId);
        
        if (existingSubscription) {
          // Update existing subscription
          await storage.updateTraderSubscription(existingSubscription.id, {
            planId: plan.id,
            status: 'active',
            endDate,
            trialEndDate: null // Clear trial end date since they're now premium
          });
        } else {
          // Create new subscription
          await storage.createTraderSubscription({
            userId,
            planId: plan.id,
            status: 'active',
            endDate,
            trialEndDate: null
          });
        }

        console.log(`Subscription updated for user ${userId} to plan ${plan.name}`);
      }

      // Always respond with 200 to acknowledge webhook receipt
      res.status(200).send('OK');
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(200).send('OK'); // Still acknowledge to prevent retries
    }
  });

  app.post('/api/subscription/cancel', authenticate, async (req, res) => {
  try {
    console.log(`Cancelling subscription for trader: ${req.user.id}`);
    
    // Get current subscription
    const subscription = await storage.getTraderSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    
    // Check if subscription can be cancelled
    if (!['active', 'trial'].includes(subscription.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel subscription with status: ${subscription.status}` 
      });
    }
    
    // If it's a Paystack subscription, cancel it there too
    if (subscription.paystackSubscriptionCode && subscription.status === 'active') {
      try {
        const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
        
        // Disable the subscription on Paystack
        await paystack.subscription.disable({
          code: subscription.paystackSubscriptionCode,
          token: subscription.paystackSubscriptionCode
        });
        
        console.log('✅ Paystack subscription cancelled:', subscription.paystackSubscriptionCode);
      } catch (paystackError) {
        console.error('❌ Error cancelling Paystack subscription:', paystackError);
        // Continue with local cancellation even if Paystack fails
        // This ensures user can still cancel even if Paystack API is down
      }
    }
    
    // Cancel the subscription locally
    const cancelledSubscription = await storage.cancelTraderSubscription(subscription.id);
    
    console.log(`✅ Subscription cancelled for trader: ${req.user.id}`);
    
    res.json({ 
      status: true, 
      message: 'Subscription cancelled successfully. You will retain access until your current billing period ends.',
      subscription: cancelledSubscription
    });
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
app.post('/api/subscription/reactivate', authenticate, async (req, res) => {
  try {
    console.log(`Reactivating subscription for trader: ${req.user.id}`);
    
    // Get current subscription
    const subscription = await storage.getTraderSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }
    
    // Check if subscription can be reactivated
    if (subscription.status !== 'cancelled') {
      return res.status(400).json({ 
        message: `Cannot reactivate subscription with status: ${subscription.status}` 
      });
    }
    
    // Check if subscription hasn't expired yet
    if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
      return res.status(400).json({ 
        message: 'Cannot reactivate expired subscription. Please purchase a new subscription.' 
      });
    }
    
    // Try to reactivate on Paystack if it was a paid subscription
    if (subscription.paystackSubscriptionCode) {
      try {
        const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
        
        // Enable the subscription on Paystack
        await paystack.subscription.enable({
          code: subscription.paystackSubscriptionCode,
          token: subscription.paystackSubscriptionCode
        });
        
        console.log('✅ Paystack subscription reactivated:', subscription.paystackSubscriptionCode);
      } catch (paystackError) {
        console.error('❌ Error reactivating Paystack subscription:', paystackError);
        // Continue with local reactivation - they might need to set up payment again
      }
    }
    
    // Reactivate the subscription locally
    const reactivatedSubscription = await storage.reactivateTraderSubscription(subscription.id);
    
    console.log(`✅ Subscription reactivated for trader: ${req.user.id}`);
    
    res.json({ 
      status: true, 
      message: 'Subscription reactivated successfully. Auto-renewal has been enabled.',
      subscription: reactivatedSubscription
    });
  } catch (error) {
    console.error('❌ Error reactivating subscription:', error);
    res.status(500).json({ message: 'Failed to reactivate subscription' });
  }
});

// Get cancellation details
app.get('/api/subscription/cancellation-details', authenticate, async (req, res) => {
  try {
    const details = await storage.getSubscriptionCancellationDetails(req.user.id);
    res.json(details);
  } catch (error) {
    console.error('Error getting cancellation details:', error);
    res.status(500).json({ message: 'Failed to get cancellation details' });
  }
});

// Get subscription status (useful for frontend checks)
app.get('/status', authenticate, async (req, res) => {
  try {
    const subscription = await storage.getTraderSubscriptionWithPlan(req.user.id);
    
    if (!subscription) {
      return res.json({
        hasSubscription: false,
        hasAccess: false,
        status: 'none'
      });
    }
    
    const daysLeft = subscription.endDate 
      ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    
    const hasAccess = ['active', 'trial'].includes(subscription.status) && daysLeft > 0;
    
    res.json({
      hasSubscription: true,
      hasAccess,
      status: subscription.status,
      daysLeft,
      plan: subscription.plan,
      canCancel: ['active', 'trial'].includes(subscription.status),
      canReactivate: subscription.status === 'cancelled' && daysLeft > 0
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
});

// ===== ADMIN ROUTES (Optional) =====

// Admin route: Get all subscriptions
app.get('/admin/all-subscriptions', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const subscriptions = await storage.getAllSubscriptionStatuses();
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
});

// Admin route: Force cancel subscription
app.post('/admin/force-cancel/:userId', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { userId } = req.params;
    const { reason } = req.body;
    
    const subscription = await storage.getTraderSubscription(userId);
    
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found for user' });
    }
    
    // Force cancel the subscription
    const cancelledSubscription = await storage.cancelTraderSubscription(subscription.id);
    
    // Log admin action
    console.log(`🛡️ Admin ${req.user.email} force-cancelled subscription for user ${userId}. Reason: ${reason || 'No reason provided'}`);
    
    res.json({ 
      status: true, 
      message: 'Subscription force-cancelled successfully',
      subscription: cancelledSubscription
    });
  } catch (error) {
    console.error('Error force-cancelling subscription:', error);
    res.status(500).json({ message: 'Failed to force-cancel subscription' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'subscription-service',
    version: '2.0.0'
  });
});
}