import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, ChartLine, AlertTriangle, Shield } from "lucide-react";
import { getSubdomain } from "@/lib/subdomain";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function UserLogin() {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const subdomain = getSubdomain();

  // Check trader subscription status
  const { data: subscriptionStatus, isLoading: checkingSubscription } = useQuery({
    queryKey: [`/api/trader/subscription-status/${subdomain}`],
    queryFn: async () => {
      const response = await fetch(`/api/trader/subscription-status/${subdomain}`);
      //console.log("response from the API is ===>:", response.json());
      if (!response.ok) {
        throw new Error("Failed to check subscription status");
      }
      return response.json();
    },
    enabled: !!subdomain,
    retry: 1,
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, subdomain }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.log("user login error is:", error);
        throw new Error(error.message || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.token) {
        localStorage.setItem(`userToken_${subdomain}`, data.token);
        
        if (data.user) {
          localStorage.setItem(`userData_${subdomain}`, JSON.stringify(data.user));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user/auth"] });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.log("user login error is:", error);
      setError(error.message || "Login failed. Please try again.");
    },
  });

  const onSubmit = (data: LoginForm) => {
    setError(null);
    loginMutation.mutate(data);
  };

  // Show loading while checking subscription
  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
  }

  // Show portal unavailable message if subscription is inactive
  if (subscriptionStatus && !subscriptionStatus.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Portal Temporarily Unavailable
              </CardTitle>
              <CardDescription className="text-base text-slate-600 mt-2">
                There is a pending payment on this portal. Please contact the owners to resolve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-slate-900 mb-1">
                  Trader Portal
                </div>
                <div className="text-sm text-slate-600">
                  {subdomain}.tradyfi.ng
                </div>
                {subscriptionStatus.traderName && (
                  <>
                    <div className="text-sm font-medium text-slate-900 mb-1 mt-3">
                      Portal Owner
                    </div>
                    <div className="text-sm text-slate-600">
                      {subscriptionStatus.traderName}
                    </div>
                  </>
                )}
              </div>

              {/* {subscriptionStatus.lastPaymentDate && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Additional Information
                  </div>
                  <div className="text-sm text-blue-700">
                    Last payment: {new Date(subscriptionStatus.lastPaymentDate).toLocaleDateString()}
                  </div>
                  {subscriptionStatus.nextPaymentDate && (
                    <div className="text-sm text-blue-700">
                      Next payment due: {new Date(subscriptionStatus.nextPaymentDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )} */}

              <div className="pt-4">
                <Button 
                  onClick={() => window.history.back()} 
                  variant="outline" 
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular login form if subscription is active
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-white text-lg" />
              </div>
              <span className="ml-3 text-xl font-bold text-slate-900">
                {subdomain}.tradyfi.ng
              </span>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to start trading with {subdomain}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

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
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
