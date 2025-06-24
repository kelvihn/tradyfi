import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Mail, LogIn, Shield } from "lucide-react";
import OTPVerification from "@/components/verify-email";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginStep = 'login' | 'verify';

export default function Login() {
  const { refetch } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<LoginStep>('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>('');
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Send OTP for unverified email
  const sendOTPMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          type: 'user'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send verification code");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setStep('verify');
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

 // Updated loginMutation in login.tsx
const loginMutation = useMutation({
  mutationFn: async (data: LoginForm) => {
    const response = await apiRequest("POST", "/api/login", data);
    return response.json();
  },
  onSuccess: async (data) => {
    console.log('🔑 Login successful, token received');
    localStorage.setItem('token', data.token);

    try {
      console.log('🔄 Starting auth state update...');
      await refetch();
      console.log('✅ Auth refetch completed');
      
      queryClient.invalidateQueries({ queryKey: ["/api/trader/status"] });
      console.log('✅ Trader status query invalidated');

      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });

      // Wait for React to re-render with new state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Role-based navigation
      const userRole = data.user?.role;
      
      if (userRole === 'trader') {
        console.log('🚀 Navigating to trader dashboard...');
        navigate("/trader/dashboard", { replace: true });
      } else {
        // For regular users or fallback
        console.log('🚀 Navigating to home...');
        navigate("/discover", { replace: true });
      }
      
    } catch (error) {
      console.error('❌ Error updating auth state:', error);
      navigate("/", { replace: true });
    }
  },
  onError: (error: Error) => {
    // Check if it's an unverified email error
    if (error.message.includes('Email not verified') || error.message.includes('EMAIL_NOT_VERIFIED')) {
      setUnverifiedEmail(form.getValues('email'));
      setShowVerificationAlert(true);
      return;
    }

    toast({
      title: "Login failed",
      description: error.message,
      variant: "destructive",
    });
  },
});

  const handleVerifyEmail = () => {
    if (unverifiedEmail) {
      sendOTPMutation.mutate(unverifiedEmail);
    }
  };

  const handleVerificationSuccess = (data: any) => {
    // After successful verification, user can try logging in again
    setStep('login');
    setShowVerificationAlert(false);
    setUnverifiedEmail('');
    
    toast({
      title: "Email Verified Successfully!",
      description: "Your email has been verified. You can now sign in.",
    });
  };

  const handleBack = () => {
    setStep('login');
    setShowVerificationAlert(false);
  };

  const onSubmit = (data: LoginForm) => {
    setShowVerificationAlert(false);
    loginMutation.mutate(data);
  };

  // Step 2: OTP Verification
  if (step === 'verify' && unverifiedEmail) {
    return (
      <OTPVerification
        email={unverifiedEmail}
        type="user"
        userData={null} // No userData needed for existing account verification
        onSuccess={handleVerificationSuccess}
        onBack={handleBack}
      />
    );
  }

  // Step 1: Login Form
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-900">Sign In</CardTitle>
          <CardDescription className="text-center text-slate-600">
            Welcome back to Tradyfi.ng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Email Verification Alert */}
          {showVerificationAlert && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-orange-800">
                    Your email address is not verified. Please verify your email to continue.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleVerifyEmail}
                    disabled={sendOTPMutation.isPending}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {sendOTPMutation.isPending ? "Sending..." : "Send Verification Code"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
                    Forgot your password?
                  </Link>
                </div>
              </div>

         
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === 'success' && (
                <Alert className="mt-4 border-green-200 bg-green-50">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    Your password has been reset successfully! You can now sign in with your new password.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Success message for verified registration */}
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('verified') === 'true' && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                Your email has been verified successfully! You can now sign in.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}