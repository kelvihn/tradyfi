import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function TraderProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: trader, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const copySubdomain = () => {
    if (trader?.trader?.subdomain) {
      const portalUrl = `${window.location.origin}/trader/${trader.trader.subdomain}`;
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Your portal URL has been copied",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'verification_pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-4 w-4" />,
          label: 'Verification Pending',
          description: 'Your profile is under review. We are verifying your NIN and business information.'
        };
      case 'verified':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Verified',
          description: 'Your profile has been verified and your trading portal is active.'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Rejected',
          description: 'Your verification was rejected. Please contact support for more information.'
        };
      case 'suspended':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Suspended',
          description: 'Your account has been suspended. Please contact support.'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <Clock className="h-4 w-4" />,
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!trader?.trader) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Profile Not Found</h1>
            <p className="text-slate-600 mb-4">
              You don't have a trader profile yet.
            </p>
            <Button onClick={() => window.location.href = "/trader/register"}>
              Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const traderData = trader.trader;
  const statusInfo = getStatusInfo(traderData.status);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-900">Trader Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={statusInfo.color}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alert */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-full ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Account Status: {statusInfo.label}
                </h3>
                <p className="text-slate-600 mb-4">
                  {statusInfo.description}
                </p>
                
                {traderData.status === 'verification_pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Our team is reviewing your NIN and business information</li>
                      <li>• This process typically takes 1-3 business days</li>
                      <li>• You'll receive an email once verification is complete</li>
                      <li>• Your trading portal subdomain will be generated after approval</li>
                    </ul>
                  </div>
                )}

                {traderData.status === 'verified' && traderData.subdomain && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Your Trading Portal is Live!</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-800">Portal URL:</span>
                      <code className="bg-white px-2 py-1 rounded text-sm">
                        {window.location.origin}/trader/{traderData.subdomain}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copySubdomain}
                        className="h-6 px-2"
                      >
                        {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => window.location.href = "/trader/dashboard"}
                      >
                        Go to Dashboard
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`${window.location.origin}/trader/${traderData.subdomain}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Portal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Full Name</label>
                <p className="text-slate-900">{trader.firstName} {trader.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Email Address</label>
                <p className="text-slate-900">{trader.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">NIN (National Identification Number)</label>
                <p className="text-slate-900 font-mono">
                  {traderData.nin.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1-$2-$3-$4')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Business Name</label>
                <p className="text-slate-900">{traderData.businessName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Contact Information</label>
                <p className="text-slate-900">{traderData.contactInfo}</p>
              </div>
              {traderData.subdomain && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Portal Subdomain</label>
                  <p className="text-slate-900 font-mono">{traderData.subdomain}.tradyfi.ng</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {traderData.profileDescription && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Business Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">
                  {traderData.profileDescription}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Registration Date */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-slate-500">
              Registered on {new Date(traderData.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}