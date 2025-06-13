import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, CreditCard } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { SubscriptionPlan, UserSubscription } from "@shared/schema";

// Extend window type for Paystack
declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function SubscriptionCard() {
  const { toast } = useToast();

  // In SubscriptionCard component, update the queries:
// Make sure your SubscriptionCard uses the correct endpoints
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

    console.log("subscription response is @@@@@ ", response.json());
    
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

     console.log("subscription plans are @@@ ", response.json());
    
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

  // Payment verification function
  const verifyPayment = async (reference: string) => {
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
  const isExpired = (subscription as any)?.status === 'expired';
  const daysLeft = (subscription as any)?.endDate 
    ? Math.max(0, Math.ceil((new Date((subscription as any).endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
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
              <Badge variant={isOnTrial ? "secondary" : isActive ? "default" : "destructive"}>
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
                ) : (
                  'Expired'
                )}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {daysLeft > 0 ? `${daysLeft} days left` : isExpired ? 'Trial expired' : 'Expired'}
              </p>
            </div>
          </div>
        )}

        {currentPlan?.price === 0 && premiumPlan && (
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

        {currentPlan?.price > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            You're on the premium plan. Thank you for your subscription!
          </div>
        )}
      </CardContent>
    </Card>
  );
}