// server/routes/subscription.js
import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// Authentication middleware (reuse from chat routes or create a shared one)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
      id: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role 
    };
    next();
  } catch (error) {
    console.log('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await storage.getActiveSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get trader's current subscription
router.get('/trader/subscription', authenticateToken, async (req, res) => {
  try {
    console.log(`Getting subscription for trader: ${req.user.id}`);
    
    // Get the trader's subscription with plan details
    const subscription = await storage.getTraderSubscriptionWithPlan(req.user.id);
    
    if (!subscription) {
      // If no subscription exists, create a trial subscription
      const trialPlan = await storage.getTrialPlan();
      if (trialPlan) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial
        
        const newSubscription = await storage.createTraderSubscription({
          userId: req.user.id,
          planId: trialPlan.id,
          status: 'trial',
          startDate: new Date(),
          endDate: trialEndDate,
          trialEndDate: trialEndDate,
          autoRenew: false,
        });
        
        // Get the subscription with plan details
        const subscriptionWithPlan = await storage.getTraderSubscriptionWithPlan(req.user.id);
        return res.json(subscriptionWithPlan);
      }
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Error fetching trader subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Initialize payment with Paystack
router.post('/initialize-payment', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Get the plan details
    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    
    // Get user details
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize Paystack payment
    const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
    
    const paymentData = {
      amount: plan.price, // Amount in kobo
      email: user.email,
      plan: plan.paystackPlanCode,
      callback_url: `${process.env.FRONTEND_URL}/trader/dashboard?tab=subscription`,
      metadata: {
        userId: req.user.id,
        planId: planId,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: req.user.id
          }
        ]
      }
    };
    
    const response = await paystack.transaction.initialize(paymentData);
    
    res.json(response);
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ message: 'Failed to initialize payment' });
  }
});

// Verify payment
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.body;
    
    // Verify payment with Paystack
    const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
    const verification = await paystack.transaction.verify(reference);
    
    if (verification.status && verification.data.status === 'success') {
      const { metadata } = verification.data;
      const planId = metadata.planId;
      
      // Update user's subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
      
      // Check if user already has a subscription
      const existingSubscription = await storage.getTraderSubscription(req.user.id);
      
      if (existingSubscription) {
        // Update existing subscription
        await storage.updateTraderSubscription(existingSubscription.id, {
          planId: planId,
          status: 'active',
          startDate: new Date(),
          endDate: endDate,
          autoRenew: true,
        });
      } else {
        // Create new subscription
        await storage.createTraderSubscription({
          userId: req.user.id,
          planId: planId,
          status: 'active',
          startDate: new Date(),
          endDate: endDate,
          autoRenew: true,
        });
      }
      
      res.json({ status: true, message: 'Payment verified and subscription updated' });
    } else {
      res.json({ status: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

export default router;