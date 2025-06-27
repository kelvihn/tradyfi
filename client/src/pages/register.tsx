import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, User, Store, Users, Briefcase } from "lucide-react";
import OTPVerification from "@/components/verify-email";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  userType: z.enum(['user', 'trader']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;
type RegistrationStep = 'register' | 'verify';

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<RegistrationStep>('register');
  const [registrationData, setRegistrationData] = useState<RegisterForm | null>(null);
  const [activeTab, setActiveTab] = useState<'user' | 'trader'>('user');

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: 'user',
    },
  });

  // Update form when tab changes
  const handleTabChange = (value: string) => {
    const userType = value as 'user' | 'trader';
    setActiveTab(userType);
    form.setValue('userType', userType);
  };

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
          type: data.userType,
          purpose: 'registration'
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
    // Store token and redirect based on user type
    // if (data.token) {
    //   localStorage.setItem("token", data.token);
      
    //   if (data.user) {
    //     localStorage.setItem("userData", JSON.stringify(data.user));
    //   }
    // }

    if (activeTab === 'trader') {
       toast({
      title: "Registration successful!",
      description: `Welcome! Your ${activeTab} account has been created and verified.`,
    });

     navigate("/login", {replace: true});
    } else {
       toast({
      title: "Registration successful!",
      description: `Welcome! Your account has been created and verified. You can now login to any trader portal`,
    });

     navigate("/", {replace: true});
    
    }
    
   
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    // Redirect based on user type
   
    // if (activeTab === 'trader') {
    //   navigate("/", {replace: true});
    // } else {
    //   navigate("/discover"); // Trader discovery page
    // }
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
        type={registrationData.userType}
        userData={{
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          password: registrationData.password,
          userType: registrationData.userType,
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
            <CardTitle className="text-2xl font-bold">Join Tradyfi.ng</CardTitle>
            <CardDescription>
              Choose your account type and get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Regular User</span>
                  <span className="sm:hidden">User</span>
                </TabsTrigger>
                <TabsTrigger value="trader" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Trader</span>
                  <span className="sm:hidden">Trader</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Regular User Account
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Access all verified trader portals</li>
                    <li>• Compare different trading services</li>
                    <li>• Chat with multiple traders</li>
                    <li>• Secure account management</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="trader" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Trader Account
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Create your own trading portal</li>
                    <li>• Get a personalized subdomain</li>
                    <li>• Manage client communications</li>
                    <li>• Access trader analytics</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

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

                {/* Hidden field for userType */}
                <input type="hidden" {...form.register('userType')} />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={sendOTPMutation.isPending}
                >
                  {sendOTPMutation.isPending ? "Please wait..." : 
                   `Create ${activeTab === 'trader' ? 'Trader' : 'User'} Account`}
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
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                What happens next?
              </h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• We'll send a 6-digit verification code to your email</li>
                <li>• Enter the code to verify your email address</li>
                {activeTab === 'trader' ? (
                  <li>• Complete your trader profile and business verification</li>
                ) : (
                  <li>• Start exploring verified trader portals immediately</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}