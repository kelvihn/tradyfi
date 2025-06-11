// pages/verify-reset-otp.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, ArrowLeft, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { getSubdomain, isMainDomain, isAdminDomain, isTraderDomain } from "@/lib/subdomain";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

type OTPForm = z.infer<typeof otpSchema>;

export default function VerifyResetOTP() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userType, setUserType] = useState<'trader' | 'user'>('trader');
  
  // Get email from URL params (type is auto-determined)
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || '';

  const form = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Determine user type based on subdomain
  useEffect(() => {
    const subdomain = getSubdomain();
    
    if (isMainDomain() || isAdminDomain()) {
      setUserType('trader');
    } else if (isTraderDomain()) {
      setUserType('user');
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const verifyMutation = useMutation({
    mutationFn: async (data: OTPForm) => {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: data.otp,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Verification failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSuccess("OTP verified successfully!");
      setTimeout(() => {
        navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`);
      }, 1500);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          type: userType 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend OTP");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setTimer(60);
      setCanResend(false);
      setError(null);
      setSuccess("New OTP sent to your email!");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: OTPForm) => {
    setError(null);
    setSuccess(null);
    verifyMutation.mutate(data);
  };

  const handleResend = () => {
    resendMutation.mutate();
  };

  const getAccountTypeInfo = () => {
    const subdomain = getSubdomain();
    if (isMainDomain() || isAdminDomain()) {
      return {
        type: isAdminDomain() ? 'Admin Account' : 'Trader Account',
        description: isAdminDomain() 
          ? 'Verifying reset code for admin account'
          : 'Verifying reset code for trader account'
      };
    } else if (isTraderDomain()) {
      return {
        type: 'User Account',
        description: `Verifying reset code for user account on ${subdomain}'s portal`
      };
    }
    return { type: '', description: '' };
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  const accountInfo = getAccountTypeInfo();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Reset Code</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to<br />
              <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Account Type Info */}
            {accountInfo.type && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900">{accountInfo.type}</p>
                    <p className="text-blue-800 text-sm">{accountInfo.description}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  {...form.register("otp")}
                />
                {form.formState.errors.otp && (
                  <p className="text-sm text-destructive">{form.formState.errors.otp.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                
                {canResend ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    disabled={resendMutation.isPending}
                    className="w-full"
                  >
                    {resendMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Resend available in {timer}s
                  </p>
                )}

                <Link href="/forgot-password" className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium text-sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change Email Address
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}