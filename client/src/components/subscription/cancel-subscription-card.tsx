import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AlertTriangle, Calendar, RefreshCw, X } from "lucide-react";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange }: CancelSubscriptionDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Get cancellation details
  const { data: cancellationDetails, isLoading } = useQuery({
    queryKey: ['/api/subscription/cancellation-details'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/cancellation-details', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cancellation details');
      }
      
      return response.json();
    },
    enabled: open,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You'll continue to have access until your billing period ends.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/trader/subscription'] });
        onOpenChange(false);
        setIsConfirming(false);
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.message || "Failed to cancel subscription",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status) {
        toast({
          title: "Subscription Reactivated",
          description: "Your subscription has been reactivated and will auto-renew.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/trader/subscription'] });
        onOpenChange(false);
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

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Subscription Details</DialogTitle>
            <DialogDescription>
              Please wait while we fetch your subscription information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!cancellationDetails?.canCancel) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Cancel Subscription</DialogTitle>
            <DialogDescription>
              Your subscription cannot be cancelled at this time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            {isConfirming ? "Confirm Cancellation" : "Cancel Subscription"}
          </DialogTitle>
          <DialogDescription>
            {isConfirming 
              ? "Are you sure you want to cancel your subscription?"
              : "You can cancel your subscription at any time."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConfirming ? (
            <>
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your access will continue until:</strong><br />
                  {cancellationDetails?.willExpireOn 
                    ? new Date(cancellationDetails.willExpireOn).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'End of current period'
                  }
                  <br />
                  <span className="text-sm text-muted-foreground">
                    ({cancellationDetails?.daysRemaining} days remaining)
                  </span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ You'll keep full access until your billing period ends</p>
                <p>✓ No additional charges will be made</p>
                <p>✓ You can reactivate anytime before expiration</p>
                <p>✓ Your data and portal will be preserved</p>
              </div>
            </>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Final confirmation required.</strong><br />
                Your subscription will be cancelled immediately, but you'll keep access 
                until {cancellationDetails?.willExpireOn 
                  ? new Date(cancellationDetails.willExpireOn).toLocaleDateString()
                  : 'the end of your billing period'
                }.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!isConfirming ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Keep Subscription
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setIsConfirming(true)}
              >
                Cancel Subscription
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirming(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Now"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}