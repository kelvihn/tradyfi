import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Send, 
  ArrowLeft,
  Clock,
  Globe,
  Shield
} from "lucide-react";
import Footer from "@/components/footer";

interface ContactFormData {
  title: string;
  email: string;
  fullName: string;
  body: string;
}

export default function ContactUs() {
  const [formData, setFormData] = useState<ContactFormData>({
    title: '',
    email: '',
    fullName: '',
    body: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.email || !formData.fullName || !formData.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Message Sent Successfully!",
          description: "Thank you for contacting us. We'll get back to you within 24 hours.",
        });
        
        // Reset form
        setFormData({
          title: '',
          email: '',
          fullName: '',
          body: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <img className="text-white text-lg" src="/logo.png" alt="Tradyfi.ng" />
              </div>
            </div>
            <Button onClick={handleGoHome}>
              Go to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have questions about Tradyfi.ng? Need help with your trading portal? We're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Phone</h3>
                    <p className="text-slate-600 mb-2">Call us for immediate support</p>
                    <a 
                      href="tel:+2348186586280" 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      +234 818 658 6280
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                    <p className="text-slate-600 mb-2">Send us an email anytime</p>
                    <a 
                      href="mailto:hey@tradyfi.ng" 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      hey@tradyfi.ng
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Address</h3>
                    <p className="text-slate-600 mb-2">Visit us at our location</p>
                    <p className="text-slate-700 font-medium">
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours & Response Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Business Hours</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM (WAT)</p>
                    <p>Saturday: 10:00 AM - 4:00 PM (WAT)</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Times</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Email: Within 24 hours</p>
                    <p>Phone: Immediate during business hours</p>
                    <p>Emergency trader issues: Within 2 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Support */}
            <Card>
              <CardHeader>
                <CardTitle>Other Ways to Get Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Documentation</p>
                    <p className="text-sm text-slate-600">Visit our help center for guides and FAQs</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Security Issues</p>
                    <p className="text-sm text-slate-600">Report security concerns to security@tradyfi.ng</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <p className="text-slate-600">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Subject *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="What is this regarding?"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <Label htmlFor="body">Message *</Label>
                  <Textarea
                    id="body"
                    placeholder="Please describe your question or concern in detail..."
                    rows={6}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    The more details you provide, the better we can help you.
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-sm text-slate-500 text-center">
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How do I become a verified trader?</h3>
                <p className="text-slate-600 text-sm">
                  Register for a trader account, complete your profile with business information, upload your identification documents, and wait for admin approval. The verification process typically takes 1-3 business days.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How do I get my custom subdomain?</h3>
                <p className="text-slate-600 text-sm">
                  During trader registration, you'll choose your desired subdomain (e.g., yourname.tradyfi.ng). Once verified, your custom trading portal will be live and accessible to clients.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-slate-600 text-sm">
                  We accept various payment methods for subscription fees including bank transfers, card payments, and mobile money. Actual crypto transactions are handled directly between traders and their clients.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Is my data safe and secure?</h3>
                <p className="text-slate-600 text-sm">
                  Yes, we use industry-standard encryption, secure authentication, and follow strict data protection practices. All sensitive information is encrypted and stored securely. Read our privacy policy for more details.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How does the chat system work?</h3>
                <p className="text-slate-600 text-sm">
                  Our real-time chat system uses WebSocket technology for instant messaging. You'll receive push notifications for new messages, and all conversations are securely stored for your records.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I have multiple trading portals?</h3>
                <p className="text-slate-600 text-sm">
                  Each trader account is associated with one subdomain. However, you can update your business information and portal content at any time through your dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-12">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-red-900 mb-2">Emergency Support</h3>
              <p className="text-red-800 mb-4">
                For urgent security issues, account compromises, or critical platform problems:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="tel:+2348186586280" 
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Emergency Line
                </a>
                <a 
                  href="mailto:emergency@tradyfi.ng" 
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Emergency Email
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}