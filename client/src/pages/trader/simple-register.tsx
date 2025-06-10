import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChartLine } from "lucide-react";
import { Link } from "wouter";

export default function SimpleTraderRegister() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: "",
    contactInfo: "",
    nin: "",
    profileDescription: "",
    subdomain: "",
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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.contactInfo || !formData.nin || !formData.subdomain) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields including subdomain",
        variant: "destructive",
      });
      return;
    }

    if (subdomainStatus.available !== true) {
      toast({
        title: "Invalid Subdomain",
        description: "Please choose an available subdomain",
        variant: "destructive",
      });
      return;
    }

    if (formData.nin.length !== 11) {
      toast({
        title: "Invalid NIN",
        description: "NIN must be exactly 11 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/trader/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const result = await response.json();
      
      toast({
        title: "Registration Successful",
        description: "Your trader application has been submitted for review. You'll be notified once approved.",
      });
      
      // Redirect to home page
      window.location.href = "/";
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register as trader",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <ChartLine className="text-white text-lg" />
                </div>
                <span className="ml-3 text-xl font-bold text-slate-900">Tradyfi.ng</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Trader Registration</CardTitle>
            <CardDescription>
              Register as a trader on Tradyfi.ng. Submit your business details and NIN for verification. 
              Once approved, you'll receive your personalized trading subdomain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter your business/trading name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactInfo">Contact Information *</Label>
                <Textarea
                  id="contactInfo"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="Phone number, email, and other contact details"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nin">National Identification Number (NIN) *</Label>
                <Input
                  id="nin"
                  name="nin"
                  value={formData.nin}
                  onChange={handleChange}
                  placeholder="Enter your 11-digit NIN"
                  maxLength={11}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your NIN will be used for verification purposes and kept secure.
                </p>
              </div>

              <div>
                <Label htmlFor="subdomain">Choose Your Subdomain *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="subdomain"
                    name="subdomain"
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
                    placeholder="yourname"
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
                <p className="text-xs text-slate-500 mt-1">
                  This will be your personalized trading portal URL. Choose carefully as it cannot be changed later.
                </p>
              </div>

              <div>
                <Label htmlFor="profileDescription">Profile Description (Optional)</Label>
                <Textarea
                  id="profileDescription"
                  name="profileDescription"
                  value={formData.profileDescription}
                  onChange={handleChange}
                  placeholder="Tell potential clients about your trading experience and services"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting Application..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}