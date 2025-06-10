import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const shouldCloseTab = urlParams.get('tab') === 'close';

    // If this is a callback from Paystack in a new tab, just close it
    if (shouldCloseTab) {
      setStatus('success');
      setMessage('Payment completed successfully! This tab will close automatically.');
      setTimeout(() => {
        window.close();
      }, 2000);
      return;
    }

    if (!reference) {
      setStatus('failed');
      setMessage('Payment reference not found');
      return;
    }

    // Verify payment with our backend
    const verifyPayment = async () => {
      try {
        const response = await apiRequest('POST', '/api/subscription/verify-payment', { reference });
        const data = await response.json();

        if (data.status) {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been upgraded.');
          
          // Invalidate subscription queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/trader/subscription'] });
          queryClient.invalidateQueries({ queryKey: ['/api/subscription/plans'] });
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            setLocation('/');
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed');
        }
      } catch (error) {
        setStatus('failed');
        setMessage('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <Loader className="h-12 w-12 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'failed' && (
              <AlertCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                Redirecting to your dashboard in a few seconds...
              </p>
            </div>
          )}
          
          {status === 'failed' && (
            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          )}
          
          {status === 'success' && (
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}