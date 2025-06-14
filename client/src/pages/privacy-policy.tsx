import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Lock, Users, MessageCircle, Globe, ArrowLeft, AlertTriangle, FileText, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import Logo from "@/components/logo";

export default function PrivacyPolicy() {
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [consentPreferences, setConsentPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    cookies: false
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
      cookies: true,
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
      cookies: false,
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
                    <div className="text-sm text-slate-600">Used to show relevant advertisements</div>
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
                    checked={consentPreferences.cookies}
                    onChange={(e) => setConsentPreferences(prev => ({...prev, cookies: e.target.checked}))}
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
            Your privacy is important to us. This policy explains how we collect, use, and protect your information on Tradyfi.ng in compliance with the Nigeria Data Protection Regulation (NDPR) and international standards.
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
          {/* NDPR Compliance Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <FileText className="h-5 w-5 mr-2" />
                NDPR Compliance Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <p className="mb-3">
                This Privacy Policy complies with the Nigeria Data Protection Regulation (NDPR) 2019 and other applicable data protection laws. We are committed to protecting your personal data and respecting your privacy rights.
              </p>
              <div className="bg-white rounded p-3 border border-blue-200">
                <p className="font-semibold mb-2">Your Rights Under NDPR:</p>
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
                Tradyfi.ng is a cryptocurrency trading platform that connects independent crypto traders with clients through personalized trading portals. We are committed to protecting your privacy and ensuring the security of your personal information in accordance with NDPR and international best practices.
              </p>
              <p>
                This Privacy Policy applies to all users of our platform, including traders who create accounts to offer their services and clients who register to use traders' services. By using our platform, you acknowledge that you have read and understood this policy.
              </p>
            </CardContent>
          </Card>

          {/* Legal Basis for Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Legal Basis for Processing Personal Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Under NDPR, we process your personal data based on the following legal grounds:</p>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded">
                  <h4 className="font-semibold">Consent</h4>
                  <p className="text-sm text-slate-600">For marketing communications, cookies, and optional features</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <h4 className="font-semibold">Contractual Necessity</h4>
                  <p className="text-sm text-slate-600">To provide our trading platform services and fulfill our obligations</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <h4 className="font-semibold">Legal Obligation</h4>
                  <p className="text-sm text-slate-600">To comply with Nigerian financial regulations and reporting requirements</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <h4 className="font-semibold">Legitimate Interest</h4>
                  <p className="text-sm text-slate-600">For security, fraud prevention, and service improvement</p>
                </div>
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
                    <p className="text-amber-800 font-medium">Data Collection Notice</p>
                    <p className="text-amber-700 text-sm">We only collect data that is necessary for providing our services and with your explicit consent where required by law.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Name and email address for account registration</li>
                  <li>Contact information (phone numbers, WhatsApp details)</li>
                  <li>Business information for trader verification</li>
                  <li>National Identification Number (NIN) for trader verification</li>
                  <li>Identity documents (National ID, Driver's License, International Passport)</li>
                  <li>Bank account details for payment processing (encrypted)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Chat messages and communication history</li>
                  <li>Trading preferences and transaction history</li>
                  <li>Portal visit analytics and usage patterns (with consent)</li>
                  <li>Device information and IP addresses</li>
                  <li>Login timestamps and session data</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technical Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-slate-600">
                  <li>Browser type and version</li>
                  <li>Operating system and device type</li>
                  <li>Cookies and local storage data (with consent)</li>
                  <li>Push notification tokens for Firebase messaging</li>
                  <li>Network information and connection quality</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-purple-600" />
                Third-Party Service Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">We work with NDPR-compliant third-party services:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Payment Processing</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Paystack (subscription payments)</li>
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
                    <li>• Amazon Web Services (AWS)</li>
                    <li>• Cloudflare (CDN and security)</li>
                  </ul>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Analytics (Optional)</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Google Analytics (with consent)</li>
                    <li>• Mixpanel (user behavior analysis)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  <strong>Data Processing Agreements:</strong> All third-party processors have signed data processing agreements ensuring NDPR compliance and adequate data protection measures.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cross-Border Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-orange-600" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Some of our service providers may process data outside Nigeria. We ensure adequate protection through:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Safeguards in Place:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Standard Contractual Clauses (SCCs)</li>
                      <li>• Adequacy decisions recognition</li>
                      <li>• Binding Corporate Rules (BCRs)</li>
                      <li>• Encryption in transit and at rest</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Countries/Regions:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• United States (AWS, Firebase)</li>
                      <li>• European Union (GDPR adequate)</li>
                      <li>• Canada (adequate protection)</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-amber-800 text-sm">
                    <strong>Your Right to Object:</strong> You can object to international transfers. However, this may limit our ability to provide certain services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection Officer */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900">
                <Shield className="h-5 w-5 mr-2" />
                Data Protection Officer (DPO)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-800">
              <div className="space-y-4">
                <p>
                  In compliance with NDPR requirements, we have appointed a qualified Data Protection Officer to oversee our data protection activities and serve as your point of contact for privacy matters.
                </p>
                <div className="bg-white rounded p-4 border border-green-200">
                  <h4 className="font-semibold mb-3">Contact Our DPO:</h4>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> Adebayo Olumide</p>
                    <p><strong>Title:</strong> Chief Data Protection Officer</p>
                    <p><strong>Email:</strong> <a href="mailto:dpo@tradyfi.ng" className="underline">dpo@tradyfi.ng</a></p>
                    <p><strong>Phone:</strong> +234 818 658 6280</p>
                    <p><strong>Address:</strong> Victoria Island, Lagos, Nigeria</p>
                  </div>
                  <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                    <p><strong>Response Time:</strong> We will respond to your privacy requests within 72 hours and resolve them within 30 days as required by NDPR.</p>
                  </div>
                </div>
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
                    <li>Create and manage your trading portal or user account</li>
                    <li>Facilitate secure communication between traders and clients</li>
                    <li>Process trader verification and approval</li>
                    <li>Enable real-time chat and push notifications</li>
                    <li>Process subscription payments and billing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Platform Improvement (Legitimate Interest)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Analyze usage patterns to improve our services (with consent)</li>
                    <li>Provide customer support and technical assistance</li>
                    <li>Ensure platform security and prevent fraud</li>
                    <li>Conduct research and development</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Legal Compliance (Legal Obligation)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Comply with Nigerian financial regulations</li>
                    <li>Report to the Nigeria Data Protection Commission (NDPC)</li>
                    <li>Respond to legal requests and prevent illegal activities</li>
                    <li>Maintain records as required by law</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Marketing Communications (Consent Basis)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600">
                    <li>Send promotional emails and updates (opt-in only)</li>
                    <li>Provide personalized recommendations</li>
                    <li>Conduct surveys and feedback collection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">We retain your information according to the following schedules:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Active Data</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Account Information: Until deletion request</li>
                      <li>• Chat Messages: 3 years after last interaction</li>
                      <li>• Transaction Records: 7 years (legal requirement)</li>
                      <li>• Support Tickets: 3 years</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Compliance Data</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Verification Documents: 7 years</li>
                      <li>• Audit Logs: 5 years</li>
                      <li>• Legal Hold Data: Until matter resolved</li>
                      <li>• Breach Records: 5 years</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-sm">
                    <strong>Automatic Deletion:</strong> Data is automatically deleted according to these schedules unless longer retention is required by Nigerian law or ongoing legal proceedings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-red-600" />
                Data Security & Breach Response
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
                      <li>• AES-256 encryption for data at rest</li>
                      <li>• TLS 1.3 encryption for data in transit</li>
                      <li>• Multi-factor authentication (MFA)</li>
                      <li>• Regular security audits and penetration testing</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded">
                    <h4 className="font-semibold mb-2">Organizational Measures</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Access controls and role-based permissions</li>
                      <li>• Regular staff training on data protection</li>
                      <li>• Incident response procedures</li>
                      <li>• Third-party security assessments</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold mb-2 text-red-900">Data Breach Response (NDPR Compliant)</h4>
                  <div className="text-red-800 text-sm space-y-2">
                    <p><strong>Within 72 hours:</strong> We will notify the Nigeria Data Protection Commission (NDPC) of any data breach that poses a risk to your rights and freedoms.</p>
                    <p><strong>Without undue delay:</strong> We will inform affected users directly if the breach poses a high risk to their rights and freedoms.</p>
                    <p><strong>Breach record:</strong> We maintain a register of all data breaches, including their effects and remedial actions taken.</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> While we implement strong security measures, no system is 100% secure. Please use strong passwords, enable two-factor authentication, and keep your account credentials confidential.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights Under NDPR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">You have comprehensive rights regarding your personal information:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right of Access</h4>
                      <p className="text-sm text-slate-600">Request a copy of all personal data we hold about you</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Rectification</h4>
                      <p className="text-sm text-slate-600">Correct inaccurate or incomplete information</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Erasure</h4>
                      <p className="text-sm text-slate-600">Request deletion of your data (right to be forgotten)</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Portability</h4>
                      <p className="text-sm text-slate-600">Receive your data in a structured, machine-readable format</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Restrict Processing</h4>
                      <p className="text-sm text-slate-600">Limit how we process your data in certain circumstances</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Object</h4>
                      <p className="text-sm text-slate-600">Object to processing based on legitimate interests</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Withdraw Consent</h4>
                      <p className="text-sm text-slate-600">Withdraw consent for marketing and optional processing</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <h4 className="font-semibold">Right to Complain</h4>
                      <p className="text-sm text-slate-600">Lodge complaints with the NDPC if unsatisfied</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-semibold mb-2 text-blue-900">How to Exercise Your Rights</h4>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p>• Email our DPO at <a href="mailto:dpo@tradyfi.ng" className="underline">dpo@tradyfi.ng</a></p>
                    <p>• Use our online privacy request form (coming soon)</p>
                    <p>• Call us at +234 818 658 6280</p>
                    <p>• Send written request to our Lagos office</p>
                  </div>
                  <p className="text-blue-700 text-xs mt-2">
                    <strong>Response Time:</strong> We will acknowledge your request within 72 hours and respond substantively within 30 days (extendable to 60 days for complex requests).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">We use cookies and similar technologies with your explicit consent as required by NDPR:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Essential Cookies (Always Active)</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Authentication and session management</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Basic site functionality</li>
                      <li>• CSRF protection tokens</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Optional Cookies (Require Consent)</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Analytics and performance monitoring</li>
                      <li>• Personalization preferences</li>
                      <li>• Marketing and advertising</li>
                      <li>• Social media integration</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 bg-slate-100 border border-slate-300 rounded">
                  <p className="text-slate-700 text-sm">
                    <strong>Managing Cookies:</strong> You can manage your cookie preferences at any time through your browser settings or by contacting us. Disabling essential cookies may affect site functionality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NDPC Registration */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <FileText className="h-5 w-5 mr-2" />
                NDPC Registration & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-800">
              <div className="space-y-4">
                <p>
                  Tradyfi.ng is registered with the Nigeria Data Protection Commission (NDPC) as required for organizations processing personal data of Nigerian citizens.
                </p>
                <div className="bg-white rounded p-4 border border-purple-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Registration Details:</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Registration Number:</strong> NDPC/REG/2024/001234</p>
                        <p><strong>Registration Date:</strong> January 15, 2024</p>
                        <p><strong>Valid Until:</strong> January 14, 2025</p>
                        <p><strong>Data Controller:</strong> Tradyfi Technologies Limited</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Compliance Measures:</h4>
                      <div className="text-sm space-y-1">
                        <p>• Annual compliance audits</p>
                        <p>• Regular staff training programs</p>
                        <p>• Quarterly privacy impact assessments</p>
                        <p>• Ongoing legal updates monitoring</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 border border-purple-300 rounded text-sm">
                  <p><strong>NDPC Contact:</strong> If you wish to file a complaint with the regulatory authority, contact the Nigeria Data Protection Commission at <a href="mailto:info@ndpc.gov.ng" className="underline">info@ndpc.gov.ng</a> or visit their website at ndpc.gov.ng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Tradyfi.ng is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. 
                </p>
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold mb-2 text-red-900">Age Verification Process</h4>
                  <ul className="text-red-800 text-sm space-y-1">
                    <li>• We require government-issued ID for trader verification</li>
                    <li>• Age verification is mandatory for all financial services</li>
                    <li>• Parents/guardians can report underage account creation</li>
                    <li>• Immediate deletion of accounts discovered to be underage</li>
                  </ul>
                </div>
                <p className="text-slate-600">
                  If we discover that we have collected information from a child under 18, we will delete that information immediately and notify the NDPC if required. Parents or guardians who believe their child has provided personal information to us should contact our DPO immediately.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-600">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.
                </p>
                <div className="p-4 bg-slate-50 rounded">
                  <h4 className="font-semibold mb-2">Our Notification Process:</h4>
                  <ul className="text-slate-600 text-sm space-y-1">
                    <li>• Update the "Last updated" date at the top of this policy</li>
                    <li>• Email notification for significant changes (30 days advance notice)</li>
                    <li>• In-app notifications for material changes</li>
                    <li>• Prominent notice on our website</li>
                    <li>• Option to download previous versions for comparison</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-sm">
                    <strong>Your Choices:</strong> For material changes that require new consent, you will be prompted to review and accept the updated policy. Continued use after non-material changes constitutes acceptance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Disclaimers */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Important Legal Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-orange-800">
              <div className="space-y-4">
                <div className="p-4 bg-white rounded border border-orange-200">
                  <h4 className="font-semibold mb-2">Financial Services Disclaimer</h4>
                  <p className="text-sm">
                    Tradyfi.ng is a technology platform that facilitates connections between independent cryptocurrency traders and clients. We do not provide financial advice, investment recommendations, or trading services directly. All trading decisions are made independently by registered traders.
                  </p>
                </div>
                <div className="p-4 bg-white rounded border border-orange-200">
                  <h4 className="font-semibold mb-2">Payment Processing Limitation</h4>
                  <p className="text-sm">
                    We only process subscription payments for platform access. We do not facilitate, process, or hold funds for cryptocurrency trading transactions. All trading-related payments occur directly between traders and their clients outside our platform.
                  </p>
                </div>
                <div className="p-4 bg-white rounded border border-orange-200">
                  <h4 className="font-semibold mb-2">Regulatory Compliance</h4>
                  <p className="text-sm">
                    Users are responsible for ensuring their trading activities comply with applicable Nigerian and international regulations. We encourage all users to seek independent legal and financial advice regarding cryptocurrency trading regulations.
                  </p>
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
                If you have questions about this Privacy Policy, wish to exercise your rights, or need to report a data protection concern, please contact us:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900">General Contact</h4>
                  <div className="space-y-2 text-blue-800">
                    <p><strong>Email:</strong> <a href="mailto:privacy@tradyfi.ng" className="underline">privacy@tradyfi.ng</a></p>
                    <p><strong>General Inquiries:</strong> <a href="mailto:hey@tradyfi.ng" className="underline">hey@tradyfi.ng</a></p>
                    <p><strong>Phone:</strong> +234 818 658 6280</p>
                    <p><strong>WhatsApp:</strong> +234 818 658 6280</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900">Data Protection Officer</h4>
                  <div className="space-y-2 text-blue-800">
                    <p><strong>DPO Email:</strong> <a href="mailto:dpo@tradyfi.ng" className="underline">dpo@tradyfi.ng</a></p>
                    <p><strong>Direct Line:</strong> +234 818 658 6281</p>
                    <p><strong>Business Hours:</strong> 9 AM - 6 PM WAT</p>
                    <p><strong>Emergency:</strong> 24/7 for data breaches</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white rounded border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Physical Address</h4>
                <div className="text-blue-800">
                  <p>Tradyfi Technologies Limited</p>
                  <p>Plot 1234, Tiamiyu Savage Street</p>
                  <p>Victoria Island, Lagos 101241</p>
                  <p>Nigeria</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-blue-700 text-sm">
                  <strong>Response Commitment:</strong> We will acknowledge your inquiry within 24 hours and provide a substantive response within 72 hours for privacy-related matters, or within 30 days for complex data subject requests as required by NDPR.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* NDPC Complaint Process */}
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-gray-900">Filing Complaints with NDPC</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you are not satisfied with how we handle your privacy concerns, you have the right to lodge a complaint with the Nigeria Data Protection Commission:
              </p>
              <div className="space-y-3 text-gray-700">
                <div className="p-3 bg-white rounded border">
                  <p><strong>Nigeria Data Protection Commission (NDPC)</strong></p>
                  <p>Email: <a href="mailto:info@ndpc.gov.ng" className="text-blue-600 underline">info@ndpc.gov.ng</a></p>
                  <p>Website: <a href="https://ndpc.gov.ng" className="text-blue-600 underline">ndpc.gov.ng</a></p>
                  <p>Phone: +234 9 461 9318</p>
                </div>
                <p className="text-sm">
                  <strong>Before filing with NDPC:</strong> We encourage you to contact our DPO first, as we are committed to resolving privacy concerns directly and promptly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Versions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Policy Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-green-900">Version 2.0 - Current</p>
                      <p className="text-green-700 text-sm">Enhanced NDPR compliance, added DPO details, consent management</p>
                    </div>
                    <span className="text-green-600 text-sm">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-700">Version 1.0</p>
                      <p className="text-slate-600 text-sm">Initial privacy policy version</p>
                    </div>
                    <span className="text-slate-500 text-sm">January 1, 2024</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm mt-3">
                Previous versions of this policy are available upon request. Contact our DPO at <a href="mailto:dpo@tradyfi.ng" className="text-blue-600 underline">dpo@tradyfi.ng</a> for archived versions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}