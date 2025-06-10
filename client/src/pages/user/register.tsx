import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { getSubdomain } from "@/lib/subdomain";
import { ArrowLeft, Mail, User } from "lucide-react";
import OTPVerification from "@/components/verify-email";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;
type RegistrationStep = 'register' | 'verify';

export default function UserRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const subdomain = getSubdomain();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<RegistrationStep>('register');
  const [registrationData, setRegistrationData] = useState<RegisterForm | null>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
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

  const handleVerificationSuccess = (data: any) => {
    // After successful verification, the account is created
    // Store token and redirect
    if (data.token) {
      localStorage.setItem(`userToken_${subdomain}`, data.token);
      
      if (data.user) {
        localStorage.setItem(`userData_${subdomain}`, JSON.stringify(data.user));
      }
    }
    
    toast({
      title: "Registration successful!",
      description: "Welcome! Your account has been created and verified.",
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/user/auth"] });
    navigate("/");
  };

  const handleBack = () => {
    setStep('register');
    setRegistrationData(null);
  };

  const onSubmit = (data: RegisterForm) => {
    setRegistrationData(data);
    sendOTPMutation.mutate(data);
  };

  // Step 2: OTP Verification
  if (step === 'verify' && registrationData) {
    return (
      <OTPVerification
        email={registrationData.email}
        type="user"
        userData={{
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          password: registrationData.password,
          subdomain,
        }}
        onSuccess={handleVerificationSuccess}
        onBack={handleBack}
      />
    );
  }

  // Step 1: Registration Form
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-primary">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                1
              </div>
              <span className="ml-2">Account Details</span>
            </div>
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                2
              </div>
              <span className="ml-2">Email Verification</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
            <CardDescription>
              Register to start trading with {subdomain ? `${subdomain}.tradyfi.ng` : "Tradyfi.ng"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={sendOTPMutation.isPending}
                >
                  {sendOTPMutation.isPending ? "Sending Verification Code..." : "Send Verification Code"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-slate-600">Already have an account? </span>
              <Link href="/login">
                <Button variant="link" className="p-0 h-auto font-normal">
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Information Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                What happens next?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We'll send a 6-digit verification code to your email</li>
                <li>• Enter the code to verify your email address</li>
                <li>• Your account will be created after successful verification</li>
                <li>• You can then start trading immediately</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}