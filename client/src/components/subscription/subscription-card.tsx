import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, CreditCard, X, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { SubscriptionPlan, UserSubscription } from "@shared/schema";
import { CancelSubscriptionDialog } from "./cancel-subscription-card";

// Extend window type for Paystack
declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function SubscriptionCard() {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch current subscription
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

  // Fetch available plans
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

  // Upgrade mutation
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

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/reactivate');
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.status) {
        toast({
          title: "Subscription Reactivated!",
          description: "Your subscription has been reactivated and will auto-renew.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/trader/subscription'] });
      } else {
        toast({
          title: "Reactivation Failed",
          description: data.message || "Failed to reactivate subscription",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (subscriptionLoading || plansLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = (subscription as any)?.plan;
  const premiumPlan = (plans as any)?.find((plan: SubscriptionPlan) => plan.price > 0);
  const isOnTrial = (subscription as any)?.status === 'trial';
  const isActive = (subscription as any)?.status === 'active';
  const isCancelled = (subscription as any)?.status === 'cancelled';
  const isExpired = (subscription as any)?.status === 'expired';
  const daysLeft = (subscription as any)?.endDate 
    ? Math.max(0, Math.ceil((new Date((subscription as any).endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
          <CardDescription>
            Manage your trading platform subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{currentPlan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.price === 0 ? 'Free' : `₦${(currentPlan.price / 100).toLocaleString()}/month`}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={
                  isOnTrial ? "secondary" : 
                  isActive ? "default" : 
                  isCancelled ? "destructive" : 
                  "destructive"
                }>
                  {isOnTrial ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Trial
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Premium
                    </div>
                  ) : isCancelled ? (
                    <div className="flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Cancelled
                    </div>
                  ) : (
                    'Expired'
                  )}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                </p>
              </div>
            </div>
          )}

          {/* Show cancellation notice for cancelled subscriptions */}
          {isCancelled && daysLeft > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900">Subscription Cancelled</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Your subscription is cancelled but you still have access for {daysLeft} more days. 
                    You can reactivate it anytime before it expires.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-orange-600 hover:bg-orange-700"
                    onClick={() => reactivateMutation.mutate()}
                    disabled={reactivateMutation.isPending}
                  >
                    {reactivateMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Reactivating...
                      </>
                    ) : (
                      "Reactivate Subscription"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade section for trial/free users */}
          {currentPlan?.price === 0 && !isCancelled && premiumPlan && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-green-700 mb-2">Upgrade to Premium</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Get access to advanced trading features and priority support
                </p>
                <div className="space-y-3">
                  <div className="font-medium text-lg">
                    ₦{(premiumPlan.price / 100).toLocaleString()}/month
                  </div>
                  <Button 
                    onClick={() => upgradeMutation.mutate(premiumPlan.id)}
                    disabled={upgradeMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {upgradeMutation.isPending ? 'Processing...' : 'Upgrade Now'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Premium subscription management */}
          {(isActive || (isCancelled && daysLeft > 0)) && currentPlan?.price > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Premium subscriber</span>
                <span>Thank you for your subscription!</span>
              </div>
              
              {/* Action buttons for active premium subscriptions */}
              {isActive && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Expired subscription - show upgrade option */}
          {isExpired && premiumPlan && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-semibold text-red-700 mb-2">Subscription Expired</h4>
              <p className="text-sm text-red-600 mb-3">
                Your subscription has expired. Upgrade now to restore access to your trading portal.
              </p>
              <Button 
                onClick={() => upgradeMutation.mutate(premiumPlan.id)}
                disabled={upgradeMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {upgradeMutation.isPending ? 'Processing...' : 'Renew Subscription'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog 
        open={showCancelDialog} 
        onOpenChange={setShowCancelDialog} 
      />
    </>
  );
}