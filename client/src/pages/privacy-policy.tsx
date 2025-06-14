import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Lock, Users, MessageCircle, Globe, ArrowLeft } from "lucide-react";
import Footer from "@/components/footer";
import Logo from "@/components/logo";

export default function PrivacyPolicy() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={handleGoBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center">
               <Logo/>
              </div>
            </div>
            <Button onClick={handleGoHome}>
              Go to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information on Tradyfi.ng.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Privacy Policy Content */}
        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-600" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Tradyfi.ng is a cryptocurrency trading platform that connects independent crypto traders with clients through personalized trading portals. We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <p>
                This Privacy Policy applies to all users of our platform, including traders who create accounts to offer their services and clients who register to use traders' services.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Name and email address for account registration</li>
                  <li>Contact information (phone numbers, WhatsApp details)</li>
                  <li>Business information for trader verification</li>
                  <li>National Identification Number (NIN) for trader verification</li>
                  <li>Identity documents (National ID, Driver's License, International Passport)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Chat messages and communication history</li>
                  <li>Trading preferences and transaction history</li>
                  <li>Portal visit analytics and usage patterns</li>
                  <li>Device information and IP addresses</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technical Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Browser type and version</li>
                  <li>Operating system and device type</li>
                  <li>Cookies and local storage data</li>
                  <li>Push notification tokens for Firebase messaging</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Service Provision</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Create and manage your trading portal or user account</li>
                    <li>Facilitate secure communication between traders and clients</li>
                    <li>Process trader verification and approval</li>
                    <li>Enable real-time chat and push notifications</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Platform Improvement</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Analyze usage patterns to improve our services</li>
                    <li>Provide customer support and technical assistance</li>
                    <li>Send important updates about your account or our services</li>
                    <li>Ensure platform security and prevent fraud</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Legal Compliance</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Comply with Nigerian financial regulations</li>
                    <li>Respond to legal requests and prevent illegal activities</li>
                    <li>Maintain records as required by law</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-orange-600" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                </p>
                <div>
                  <h4 className="font-semibold mb-2">Between Platform Users</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Basic contact information is shared between verified traders and their clients</li>
                    <li>Chat messages are shared between participating parties</li>
                    <li>Business information is displayed on trader portal pages</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Service Providers</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Email service providers for communication</li>
                    <li>Cloud storage providers for data hosting</li>
                    <li>Firebase for push notifications</li>
                    <li>Payment processors for subscription services</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Legal Requirements</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>When required by law or legal process</li>
                    <li>To protect our rights, property, or safety</li>
                    <li>To prevent fraud or illegal activities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-red-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  We implement robust security measures to protect your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Encryption of sensitive data in transit and at rest</li>
                  <li>Secure authentication systems with JWT tokens</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls limiting who can view your information</li>
                  <li>Secure file upload and storage for identity documents</li>
                  <li>HTTPS encryption for all data transmission</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> While we implement strong security measures, no system is 100% secure. Please use strong passwords and keep your account credentials confidential.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong>Withdrawal:</strong> Withdraw consent for certain data processing activities</li>
                  <li><strong>Objection:</strong> Object to certain types of data processing</li>
                </ul>
                <p className="text-slate-600">
                  To exercise these rights, please contact us at <a href="mailto:privacy@tradyfi.ng" className="text-blue-600 hover:underline">privacy@tradyfi.ng</a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Provide personalized experiences</li>
                </ul>
                <p className="text-slate-600">
                  You can manage cookie preferences through your browser settings, but some features may not work properly if cookies are disabled.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">We retain your information as follows:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li><strong>Account Information:</strong> Until you request account deletion</li>
                  <li><strong>Chat Messages:</strong> Stored indefinitely for transaction records</li>
                  <li><strong>Verification Documents:</strong> 7 years for compliance purposes</li>
                  <li><strong>Usage Analytics:</strong> 2 years for service improvement</li>
                  <li><strong>Support Communications:</strong> 3 years for quality assurance</li>
                </ul>
                <p className="text-slate-600">
                  Some information may be retained longer if required by Nigerian law or for legitimate business interests.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Our servers are primarily located in Nigeria. If we transfer data internationally, we ensure appropriate safeguards are in place to protect your information, including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 mt-2">
                <li>Using services with adequate data protection measures</li>
                <li>Implementing contractual protections</li>
                <li>Ensuring compliance with applicable data protection laws</li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Tradyfi.ng is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we discover that we have collected information from a child under 18, we will delete that information immediately.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                We may update this Privacy Policy from time to time. When we make changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 mt-2">
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Notify you via email if changes are significant</li>
                <li>Post notifications on our platform</li>
              </ul>
              <p className="text-slate-600 mt-2">
                Your continued use of Tradyfi.ng after changes become effective constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-blue-800">
                <p><strong>Email:</strong> <a href="mailto:privacy@tradyfi.ng" className="underline">privacy@tradyfi.ng</a></p>
                <p><strong>General Inquiries:</strong> <a href="mailto:hey@tradyfi.ng" className="underline">hey@tradyfi.ng</a></p>
                <p><strong>Phone:</strong> +234 818 658 6280</p>
                <p><strong>Address:</strong> Lagos, Nigeria</p>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-blue-700 text-sm">
                  <strong>Data Protection Officer:</strong> For specific privacy concerns, you can reach our Data Protection Officer at <a href="mailto:dpo@tradyfi.ng" className="underline">dpo@tradyfi.ng</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}