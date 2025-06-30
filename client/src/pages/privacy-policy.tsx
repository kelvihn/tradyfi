import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Lock, Users, MessageCircle, ArrowLeft, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function PrivacyPolicy() {
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [consentPreferences, setConsentPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already provided consent
    const hasConsent = localStorage.getItem('tradyfi-consent');
    if (!hasConsent) {
      setShowConsentBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('tradyfi-consent', JSON.stringify(allConsent));
    setConsentPreferences(allConsent);
    setShowConsentBanner(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('tradyfi-consent', JSON.stringify(minimalConsent));
    setConsentPreferences(minimalConsent);
    setShowConsentBanner(false);
  };

  const handleCustomizeConsent = () => {
    const customConsent = {
      ...consentPreferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('tradyfi-consent', JSON.stringify(customConsent));
    setShowConsentBanner(false);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Consent Banner */}
      {showConsentBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold">Your Privacy Choices</h3>
              </div>
              <p className="text-slate-600 mb-4">
                We use cookies and similar technologies to improve your experience. Under the Nigeria Data Protection Regulation (NDPR), we need your explicit consent before processing your personal data.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <div className="font-medium">Essential Cookies</div>
                    <div className="text-sm text-slate-600">Required for basic site functionality</div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded cursor-pointer">
                  <div>
                    <div className="font-medium">Analytics Cookies</div>
                    <div className="text-sm text-slate-600">Help us understand how you use our site</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentPreferences.analytics}
                    onChange={(e) => setConsentPreferences(prev => ({...prev, analytics: e.target.checked}))}
                    className="rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded cursor-pointer">
                  <div>
                    <div className="font-medium">Marketing Cookies</div>
                    <div className="text-sm text-slate-600">Used for email marketing and promotions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentPreferences.marketing}
                    onChange={(e) => setConsentPreferences(prev => ({...prev, marketing: e.target.checked}))}
                    className="rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded cursor-pointer">
                  <div>
                    <div className="font-medium">Functional Cookies</div>
                    <div className="text-sm text-slate-600">Remember your preferences and settings</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentPreferences.functional}
                    onChange={(e) => setConsentPreferences(prev => ({...prev, functional: e.target.checked}))}
                    className="rounded"
                  />
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAcceptAll} className="flex-1">
                  Accept All
                </Button>
                <Button onClick={handleCustomizeConsent} variant="outline" className="flex-1">
                  Save Preferences
                </Button>
                <Button onClick={handleRejectAll} variant="ghost" className="flex-1">
                  Reject All
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 mt-3">
                You can change your preferences at any time by contacting us at privacy@tradyfi.ng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
                <span className="text-xl font-bold text-blue-600">Tradyfi.ng</span>
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
            Your privacy is important to us. This policy explains how we collect, use, and protect your information on Tradyfi.ng in compliance with the Nigeria Data Protection Regulation (NDPR).
          </p>
          <p className="text-sm text-slate-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">NDPR Compliant</span>
            </div>
          </div>
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
                Tradyfi.ng is a technology platform that connects independent cryptocurrency traders with potential clients through personalized trading portals. We provide the technology infrastructure for communication and do not process cryptocurrency transactions, hold digital assets, or provide financial services directly.
              </p>
              <p>
                This Privacy Policy applies to all users of our platform, including traders who subscribe to our service and clients who visit trading portals. By using our platform, you acknowledge that you have read and understood this policy.
              </p>
            </CardContent>
          </Card>

          {/* NDPR Compliance Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <FileText className="h-5 w-5 mr-2" />
                Your Rights Under NDPR
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <p className="mb-3">
                As a Nigerian citizen or resident, you have the following rights regarding your personal data under the Nigeria Data Protection Regulation (NDPR):
              </p>
              <div className="bg-white rounded p-3 border border-blue-200">
                <ul className="text-sm space-y-1">
                  <li>• Right to be informed about data processing</li>
                  <li>• Right of access to your personal data</li>
                  <li>• Right to rectification of inaccurate data</li>
                  <li>• Right to erasure (right to be forgotten)</li>
                  <li>• Right to restrict processing</li>
                  <li>• Right to data portability</li>
                  <li>• Right to object to processing</li>
                  <li>• Right to withdraw consent at any time</li>
                </ul>
              </div>
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">Data Minimization</p>
                    <p className="text-amber-700 text-sm">We only collect data that is necessary for providing our platform services and with your explicit consent where required by law.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Name and email address for account registration</li>
                  <li>Contact information (phone numbers, WhatsApp details) for traders</li>
                  <li>Business information for trader verification</li>
                  <li>National Identification Number (NIN) for trader verification</li>
                  <li>Identity documents for trader verification (ID card, passport, etc.)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Communication Data</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Chat messages between traders and clients on our platform</li>
                  <li>Email communications and support requests</li>
                  <li>Push notification preferences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technical Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Browser type and device information</li>
                  <li>IP addresses and connection information</li>
                  <li>Portal visit analytics (with consent)</li>
                  <li>Session data for authentication</li>
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
                  <h4 className="font-semibold mb-2">Service Provision (Contractual Basis)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Create and manage trader portals and user accounts</li>
                    <li>Facilitate secure communication between traders and clients</li>
                    <li>Process trader verification and account approval</li>
                    <li>Enable real-time chat and push notifications</li>
                    <li>Process monthly subscription payments for traders</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Platform Security (Legitimate Interest)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Prevent fraud and abuse of our platform</li>
                    <li>Ensure platform security and stability</li>
                    <li>Provide customer support and technical assistance</li>
                    <li>Monitor for suspicious activities</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Service Improvement (Consent Basis)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Analyze portal usage to improve our services (with consent)</li>
                    <li>Send promotional emails and platform updates (opt-in only)</li>
                    <li>Conduct surveys and feedback collection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                Third-Party Service Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">We work with trusted third-party services to provide our platform:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Payment Processing</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Paystack (subscription payments only)</li>
                    <li>• Flutterwave (backup payment processor)</li>
                  </ul>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Communication</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Firebase (push notifications)</li>
                    <li>• SendGrid (email services)</li>
                  </ul>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Hosting & Storage</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Nigerian-based hosting services</li>
                    <li>• Cloudflare (CDN and security)</li>
                  </ul>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Analytics (Optional)</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Google Analytics (with consent only)</li>
                    <li>• Basic portal visit tracking</li>
                  </ul>
                </div>
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
                <p className="text-slate-600">We retain your information according to the following schedules:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Active Users</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Account Information: Until deletion request</li>
                      <li>• Chat Messages: 2 years after last activity</li>
                      <li>• Support Requests: 1 year</li>
                      <li>• Payment Records: 7 years (legal requirement)</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Verification Data</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Identity Documents: Until account deletion</li>
                      <li>• NIN Records: Until account deletion</li>
                      <li>• Business Information: Until account deletion</li>
                      <li>• Audit Logs: 3 years</li>
                    </ul>
                  </div>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Encryption for data transmission and storage</li>
                      <li>• Secure authentication systems</li>
                      <li>• Regular security updates and monitoring</li>
                      <li>• Access controls and user permissions</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Operational Measures</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Staff training on data protection</li>
                      <li>• Regular backup procedures</li>
                      <li>• Incident response protocols</li>
                      <li>• Limited access to personal data</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> While we implement strong security measures, please use strong passwords, keep your account credentials confidential, and report any suspicious activity immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Disclaimers */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Important Service Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-orange-800">
              <div className="space-y-4">
                <div className="p-4 bg-white rounded border border-orange-200">
                  <h4 className="font-semibold mb-2">Platform Service Only</h4>
                  <p className="text-sm">
                    Tradyfi.ng provides a technology platform for communication between traders and clients. We do not provide financial advice, facilitate trading transactions, or hold cryptocurrency funds. All trading activities occur independently between traders and their clients.
                  </p>
                </div>
                <div className="p-4 bg-white rounded border border-orange-200">
                  <h4 className="font-semibold mb-2">No Cryptocurrency Handling</h4>
                  <p className="text-sm">
                    We do not process, store, or handle any cryptocurrency transactions or funds. Our platform only facilitates communication and subscription payments for access to trading portals.
                  </p>
                </div>
                <div className="p-4 bg-white rounded border border-orange-200">
                  <h4 className="font-semibold mb-2">User Responsibility</h4>
                  <p className="text-sm">
                    Users are responsible for their own trading decisions and ensuring compliance with applicable regulations. We encourage all users to conduct due diligence and seek independent advice regarding cryptocurrency trading.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Exercising Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">You can exercise your rights by contacting us through any of these methods:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Contact Methods</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Email: privacy@tradyfi.ng</li>
                      <li>• General inquiries: hey@tradyfi.ng</li>
                      <li>• Phone: +234 818 658 6280</li>
                      <li>• WhatsApp: +234 818 658 6280</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Response Times</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Initial response: Within 72 hours</li>
                      <li>• Simple requests: Within 7 days</li>
                      <li>• Complex requests: Within 30 days</li>
                      <li>• Emergency issues: Within 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Tradyfi.ng is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
                </p>
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold mb-2 text-red-900">Age Verification</h4>
                  <ul className="text-red-800 text-sm space-y-1">
                    <li>• Government-issued ID required for trader verification</li>
                    <li>• Immediate account suspension for underage users</li>
                    <li>• Parents can report underage account creation</li>
                    <li>• Immediate data deletion for accounts discovered to be underage</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-white rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Tradyfi Technologies</h4>
                  <div className="space-y-2 text-blue-800">
                    <p><strong>Email:</strong> <a href="mailto:privacy@tradyfi.ng" className="underline">privacy@tradyfi.ng</a></p>
                    <p><strong>General Inquiries:</strong> <a href="mailto:hey@tradyfi.ng" className="underline">hey@tradyfi.ng</a></p>
                    <p><strong>Phone:</strong> +234 818 658 6280</p>
                    <p><strong>WhatsApp:</strong> +234 818 658 6280</p>
                    <p><strong>Business Hours:</strong> 9 AM - 6 PM WAT, Monday-Friday</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-blue-700 text-sm">
                  <strong>Response Commitment:</strong> We will acknowledge your inquiry within 24 hours and provide a substantive response within 72 hours for privacy-related matters.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
                </p>
                <div className="p-4 bg-slate-50 rounded">
                  <h4 className="font-semibold mb-2">Our Notification Process:</h4>
                  <ul className="text-slate-600 text-sm space-y-1">
                    <li>• Update the "Last updated" date at the top of this policy</li>
                    <li>• Email notification for significant changes</li>
                    <li>• Prominent notice on our website</li>
                    <li>• 30 days advance notice for material changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-2">Tradyfi.ng</div>
            <p className="text-sm">Connecting crypto traders with clients through secure technology</p>
            <div className="mt-4 text-xs text-slate-400">
              © {new Date().getFullYear()} Tradyfi Technologies. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}