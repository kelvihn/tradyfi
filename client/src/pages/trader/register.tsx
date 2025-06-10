import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, Building, Phone, CreditCard, FileText } from "lucide-react";

export default function TraderRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactInfo: '',
    nin: '',
    profileDescription: '',
    subdomain: ''
  });
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: ""
  });

  // Get existing trader data to pre-fill form
  const { data: trader, isLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    enabled: !!user,
  });

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: null, message: "" });
      return;
    }

    setSubdomainStatus({ checking: true, available: null, message: "Checking availability..." });

    try {
      const response = await fetch(`/api/trader/check-subdomain/${subdomain.toLowerCase()}`);
      const result = await response.json();
      setSubdomainStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    } catch (error) {
      setSubdomainStatus({
        checking: false,
        available: false,
        message: "Error checking availability"
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/trader/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Verification Submitted",
        description: "Your verification details have been submitted. You will be notified once reviewed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trader/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.contactInfo || !formData.nin || !formData.subdomain) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including subdomain.",
        variant: "destructive",
      });
      return;
    }

    if (subdomainStatus.available !== true) {
      toast({
        title: "Invalid Subdomain",
        description: "Please choose an available subdomain before submitting.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading verification form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-slate-900">Start Verification</h1>
          <p className="text-slate-600 mt-2">
            Complete your business verification to access all trader features and get your personalized trading portal.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-6 w-6 text-primary mr-2" />
              Business Information
            </CardTitle>
            <CardDescription>
              Provide your business details for verification. All information will be reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Enter your business or trading name"
                  value={formData.businessName}
                  onChange={handleInputChange('businessName')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Information *
                </Label>
                <Input
                  id="contactInfo"
                  type="text"
                  placeholder="Phone number or primary contact method"
                  value={formData.contactInfo}
                  onChange={handleInputChange('contactInfo')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nin" className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  National Identification Number (NIN) *
                </Label>
                <Input
                  id="nin"
                  type="text"
                  placeholder="Enter your 11-digit NIN"
                  value={formData.nin}
                  onChange={handleInputChange('nin')}
                  maxLength={11}
                  required
                />
                <p className="text-sm text-slate-500">
                  Your NIN is required for identity verification and compliance.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Choose Your Subdomain *
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="yourname"
                    value={formData.subdomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData(prev => ({ ...prev, subdomain: value }));
                      if (value.length >= 3) {
                        checkSubdomainAvailability(value);
                      } else {
                        setSubdomainStatus({ checking: false, available: null, message: "" });
                      }
                    }}
                    className={`flex-1 ${
                      subdomainStatus.available === true ? 'border-green-500' : 
                      subdomainStatus.available === false ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <span className="text-sm text-slate-600">.tradyfi.ng</span>
                </div>
                {subdomainStatus.checking && (
                  <p className="text-xs text-blue-600 mt-1">Checking availability...</p>
                )}
                {subdomainStatus.available === true && (
                  <p className="text-xs text-green-600 mt-1">✓ {subdomainStatus.message}</p>
                )}
                {subdomainStatus.available === false && (
                  <p className="text-xs text-red-600 mt-1">✗ {subdomainStatus.message}</p>
                )}
                <p className="text-sm text-slate-500">
                  This will be your personalized trading portal URL. Choose carefully as it cannot be changed later.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileDescription" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Trading Profile Description
                </Label>
                <Textarea
                  id="profileDescription"
                  placeholder="Describe your trading experience, specialties, or services (optional)"
                  value={formData.profileDescription}
                  onChange={handleInputChange('profileDescription')}
                  rows={4}
                />
                <p className="text-sm text-slate-500">
                  This will be displayed on your public trading portal.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your information will be reviewed by our verification team</li>
                  <li>• We'll verify your NIN and business details</li>
                  <li>• Once approved, you'll get your personalized trading portal</li>
                  <li>• Verification typically takes 1-3 business days</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}