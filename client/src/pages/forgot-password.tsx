// pages/forgot-password.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Mail, ArrowLeft, Info } from "lucide-react";
import { getSubdomain, isMainDomain, isAdminDomain, isTraderDomain } from "@/lib/subdomain";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState<'trader' | 'user'>('trader');
  const [domainInfo, setDomainInfo] = useState<{
    type: string;
    description: string;
  }>({ type: '', description: '' });

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Determine user type based on subdomain
  useEffect(() => {
    const subdomain = getSubdomain();
    
    if (isMainDomain() || isAdminDomain()) {
      // Main domain or admin domain = trader account
      setUserType('trader');
      setDomainInfo({
        type: 'Trader Account',
        description: isAdminDomain() 
          ? 'You are resetting password for an admin account'
          : 'You are resetting password for a trader account'
      });
    } else if (isTraderDomain()) {
      // Trader subdomain = user account
      setUserType('user');
      setDomainInfo({
        type: 'User Account',
        description: `You are resetting password for a user account on ${subdomain}'s portal`
      });
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          type: userType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reset code");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset Code Sent",
        description: "Please check your email for the password reset code.",
      });
      // Navigate to verify reset OTP page with email and type
      navigate(`/verify-reset-otp?email=${encodeURIComponent(form.getValues('email'))}&type=${userType}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Reset Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-900">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center text-slate-600">
            Enter your email address and we'll send you a code to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Account Type Info */}
          {domainInfo.type && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-blue-900">{domainInfo.type}</p>
                  <p className="text-blue-800 text-sm">{domainInfo.description}</p>
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

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}