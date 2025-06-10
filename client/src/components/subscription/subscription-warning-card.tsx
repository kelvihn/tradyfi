// Complete SubscriptionWarningCard component with all syntax fixed
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Lock, 
  CreditCard, 
  Crown,
  ExternalLink,
  CheckCircle,
  XCircle,
  Users,
  MessageCircle
} from "lucide-react";

interface SubscriptionWarningCardProps {
  traderStatus?: any;
}

export function SubscriptionWarningCard({ traderStatus }: SubscriptionWarningCardProps) {
  const { toast } = useToast();

  // Use the same queries as your SubscriptionCard for consistency
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/trader/subscription'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trader/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }
      
      return response.json();
    },
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.status}`);
      }
      
      return response.json();
    },
  });

  // Handle payment return from Paystack
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      // Verify payment with backend
      const verifyPayment = async () => {
        try {
          const response = await apiRequest('POST', '/api/subscription/verify-payment', { reference });
          const data = await response.json();
          
          if (data.status) {
            toast({
              title: "Payment Successful!",
              description: "Your subscription has been upgraded to Premium.",
            });
            
            // Refresh subscription data
            queryClient.invalidateQueries({ queryKey: ['/api/trader/subscription'] });
          } else {
            toast({
              title: "Payment Verification Failed",
              description: data.message || "Please contact support if payment was deducted.",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Verification Error",
            description: "Failed to verify payment. Please contact support.",
            variant: "destructive",
          });
        }
      };
      
      verifyPayment();
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const upgradeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/subscription/initialize-payment', { planId });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.status && data.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize payment",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  });

  if (subscriptionLoading || plansLoading) {
    return null; // Don't show loading state for warning card
  }

  // Enhanced subscription status checking
  const currentPlan = (subscription as any)?.plan;
  const isOnTrial = (subscription as any)?.status === 'trial';
  const isActive = (subscription as any)?.status === 'active';
  const isExpired = (subscription as any)?.status === 'expired';
  const daysLeft = (subscription as any)?.endDate 
    ? Math.max(0, Math.ceil((new Date((subscription as any).endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // UPDATED LOGIC: Show card for trial users AND users who need to upgrade
  const shouldShowCard = 
    // Show for trial users (with days left info)
    (isOnTrial && daysLeft > 0) ||
    // Show for users with no subscription
    !subscription ||
    !currentPlan ||
    // Show for expired subscriptions
    (isExpired && !isOnTrial) ||
    // Show for expired trials
    (isOnTrial && daysLeft <= 0 && !isActive) ||
    // Show for free plan users
    (currentPlan?.price === 0 && !isOnTrial);

  // Determine if this is a trial card or warning card
  const isTrialCard = isOnTrial && daysLeft > 0;
  const isWarningCard = !isTrialCard;

  // Log for debugging (remove in production)
  console.log('Subscription Card Debug:', {
    subscription: !!subscription,
    currentPlan: !!currentPlan,
    isOnTrial,
    isActive,
    isExpired,
    daysLeft,
    isTrialCard,
    isWarningCard,
    shouldShowCard
  });

  if (!shouldShowCard) {
    return null;
  }

  const premiumPlan = (plans as any)?.find((plan: any) => plan.price > 0);

  // Determine the warning message based on the specific situation
  const getWarningMessage = () => {
    if (isOnTrial && daysLeft <= 0) {
      return "Your 7-day free trial has expired.";
    }
    if (isExpired) {
      return "Your subscription has expired.";
    }
    if (!subscription || !currentPlan) {
      return "You don't have an active subscription.";
    }
    return "Upgrade to premium to unlock your portal and start receiving clients.";
  };

  // Determine the card appearance and messaging
  const getCardStyle = () => {
    if (isTrialCard) {
      return "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50";
    }
    return "border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50";
  };

  const getCardTitle = () => {
    if (isTrialCard) {
      return (
        <CardTitle className="flex items-center text-blue-800">
          <Crown className="h-5 w-5 mr-2" />
          Free Trial Active
        </CardTitle>
      );
    }
    return (
      <CardTitle className="flex items-center text-orange-800">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Portal Access Restricted
      </CardTitle>
    );
  };

  const getStatusBadge = () => {
    if (isTrialCard) {
      return (
        <Badge variant="default" className="bg-blue-600">
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
        </Badge>
      );
    }
    if (isOnTrial && daysLeft <= 0) {
      return <Badge variant="destructive">Trial Expired</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Subscription Expired</Badge>;
    }
    return <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100">Subscription Required</Badge>;
  };

  const getMainAlert = () => {
    if (isTrialCard) {
      return (
        <Alert className="border-blue-200 bg-blue-100">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Your portal is active!</strong> You have <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong> remaining 
            in your 7-day free trial. Upgrade anytime to continue without interruption.
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert className="border-orange-200 bg-orange-100">
        <Lock className="h-4 w-4" />
        <AlertDescription className="text-orange-800">
          <strong>Your trading portal is currently blocked for users.</strong> 
          {" " + getWarningMessage()}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className={getCardStyle()}>
      <CardHeader>
        <div className="flex items-center justify-between">
          {getCardTitle()}
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main alert */}
        {getMainAlert()}

        {/* Trial benefits vs limitations OR warning content */}
        {isTrialCard ? (
          // Trial card content - show benefits and encourage upgrade
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current trial benefits */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-900 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                Trial Features Active
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-blue-700">
                  <Users className="h-3 w-3 mr-2 text-blue-500" />
                  Full portal access for users
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <MessageCircle className="h-3 w-3 mr-2 text-blue-500" />
                  Unlimited client messaging
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Crown className="h-3 w-3 mr-2 text-blue-500" />
                  All trading features unlocked
                </div>
              </div>
            </div>

            {/* Premium advantages */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-800 flex items-center">
                <Crown className="h-4 w-4 mr-2 text-green-500" />
                Premium Advantages
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-green-700">
                  <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                  Never lose access to your portal
                </div>
                <div className="flex items-center text-sm text-green-700">
                  <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                  Priority customer support
                </div>
                <div className="flex items-center text-sm text-green-700">
                  <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                  Advanced analytics & insights
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Warning card content - show what's blocked
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current limitations */}
            <div className="space-y-3">
              <h4 className="font-medium text-orange-900 flex items-center">
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Current Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-orange-700">
                  <Users className="h-3 w-3 mr-2 text-red-500" />
                  Users see "Portal Unavailable"
                </div>
                <div className="flex items-center text-sm text-orange-700">
                  <MessageCircle className="h-3 w-3 mr-2 text-red-500" />
                  No client messaging access
                </div>
                <div className="flex items-center text-sm text-orange-700">
                  <Lock className="h-3 w-3 mr-2 text-red-500" />
                  Trading features disabled
                </div>
              </div>
            </div>

            {/* Premium benefits */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-800 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Premium Access
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-green-700">
                  <Users className="h-3 w-3 mr-2 text-green-500" />
                  Full portal access for users
                </div>
                <div className="flex items-center text-sm text-green-700">
                  <MessageCircle className="h-3 w-3 mr-2 text-green-500" />
                  Unlimited client messaging
                </div>
                <div className="flex items-center text-sm text-green-700">
                  <Crown className="h-3 w-3 mr-2 text-green-500" />
                  All trading features unlocked
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Special message for trial users */}
        {isTrialCard && (
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">🎯 Keep Your Momentum Going!</h4>
            <p className="text-sm text-blue-700">
              You're experiencing the full power of our platform. Upgrade now to ensure uninterrupted service 
              for you and your clients when your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.
            </p>
          </div>
        )}

        {/* Show different messages for expired users */}
        {!isTrialCard && isOnTrial && daysLeft <= 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">🎉 Hope you enjoyed your trial!</h4>
            <p className="text-sm text-blue-700">
              Your 7-day free trial has ended. Upgrade to continue serving clients without interruption.
            </p>
          </div>
        )}

        {/* Premium plan upgrade */}
        {premiumPlan && (
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-green-700 mb-2 flex items-center">
              <Crown className="h-4 w-4 mr-2" />
              {isTrialCard ? `Continue with ${premiumPlan.name}` : `Upgrade to ${premiumPlan.name}`}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {isTrialCard 
                ? "Secure your access and unlock premium features before your trial ends"
                : "Get access to advanced trading features and unlock your portal for clients"
              }
            </p>
            <div className="flex items-center justify-between">
              <div className="font-medium text-lg">
                ₦{(premiumPlan.price / 100).toLocaleString()}/month
              </div>
              <Button 
                onClick={() => upgradeMutation.mutate(premiumPlan.id)}
                disabled={upgradeMutation.isPending}
                className={isTrialCard ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
              >
                {upgradeMutation.isPending ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-2 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isTrialCard 
                      ? (daysLeft <= 1 ? 'Upgrade Before Trial Ends' : 'Upgrade Now') 
                      : (isOnTrial && daysLeft <= 0 ? 'Continue with Premium' : 'Upgrade Now')
                    }
                  </>
                )}
              </Button>
            </div>
            
            {/* Special urgency message for trial users with 1-2 days left */}
            {isTrialCard && daysLeft <= 2 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⏰ <strong>Trial ending soon!</strong> Upgrade now to avoid any service interruption.
              </div>
            )}
          </div>
        )}

        {/* Portal preview footer */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-orange-200">
          <div>
            <span className="font-medium">Your Portal:</span> {traderStatus?.subdomain}.tradyfi.ng
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`https://${traderStatus?.subdomain}.tradyfi.ng`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}