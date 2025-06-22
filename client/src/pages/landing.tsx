import { ChartLine, Shield, Users, Globe, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthModal } from "@/components/auth/auth-modal";
import { Link } from "wouter";
import Footer from "@/components/footer";
import Logo from "@/components/logo";

export default function Landing() {

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <Logo/>
                  {/* <span className="ml-3 text-xl font-bold text-slate-900">Tradyfi.ng</span> */}
                </div>
              </div>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                <a href="#features" className="text-slate-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Features</a>
                <a href="/contact" className="text-slate-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Contact Us</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* <AuthModal 
                trigger={
                  <Button 
                    variant="ghost" 
                    className="text-slate-700 hover:text-primary"
                  >
                    Sign In
                  </Button>
                }
                defaultMode="login"
              /> */}
              <Link href="/register">
                <Button className="btn-primary">
                  Signup
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="animate-slide-up">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Launch Your 
                  <span className="text-primary"> Crypto Trading </span>
                  Business
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  Get your own personalized trading subdomain on Tradyfi.ng. 
                  Verified traders receive custom portals with secure client chat and professional tools.
                </p>
                <div className="mt-8 flex flex-row flex-wrap gap-4">
                  <Link href="/register">
                    <Button 
                      size="lg"
                      className="btn-primary text-lg px-8 py-4"
                    >
                    Signup
                    </Button>
                  </Link>
                  <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="text-lg px-8 py-4"
                  >
                    Login
                  </Button>
                  </Link>
                </div>
                <div className="mt-8 flex items-center space-x-6 text-sm text-slate-500">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                    Free setup
                  </div>
                  <div className="flex items-center">
                    <Shield className="text-green-500 mr-2 h-4 w-4" />
                    NIN verified traders
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="text-green-500 mr-2 h-4 w-4" />
                    Real-time chat
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative animate-fade-in">
                <Card className="shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-3 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="ml-4 text-xs text-slate-600 font-mono">cryptotrader.tradyfi.ng</div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">CryptoTrader Portal</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-slate-600">Online</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <Button variant="outline" className="p-3 bg-primary/5 hover:bg-primary/10 rounded-lg text-center">
                        <div className="flex flex-col items-center">
                          <ChartLine className="text-primary text-lg mb-1" />
                          <div className="text-xs font-medium text-primary">Buy Crypto</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center">
                        <div className="flex flex-col items-center">
                          <ChartLine className="text-green-500 text-lg mb-1" />
                          <div className="text-xs font-medium text-green-700">Sell Crypto</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center">
                        <div className="flex flex-col items-center">
                          <ChartLine className="text-yellow-500 text-lg mb-1" />
                          <div className="text-xs font-medium text-yellow-700">Gift Cards</div>
                        </div>
                      </Button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-700">Live Chat</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded text-xs text-slate-600">
                          Hi! I'd like to buy $500 worth of Bitcoin
                        </div>
                        <div className="bg-primary text-white p-2 rounded text-xs ml-4">
                          Perfect! I can help you with that. Current rate is...
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Scale Your Trading Business
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Professional tools and features designed specifically for independent crypto traders and their clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Custom Subdomains</h3>
                <p className="text-slate-600">Get your own branded trading portal at tradername.tradyfi.ng with full customization control.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="text-green-500 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Real-time Chat</h3>
                <p className="text-slate-600">Instant messaging with push notifications, sound alerts, and unread message badges for seamless communication.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-yellow-500 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">NIN Verification</h3>
                <p className="text-slate-600">Secure trader verification system with manual admin review for maximum trust and compliance.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Multi-Trader Support</h3>
                <p className="text-slate-600">Users can register with multiple traders, expanding your potential client base and network reach.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="text-green-500 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Connect to WhatsApp</h3>
                <p className="text-slate-600">Link your domain to WhatsApp Business and seamlessly redirect users to your WhatsApp chat for instant support and communication.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-yellow-500 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Mobile Responsive</h3>
                <p className="text-slate-600">Fully responsive design that works perfectly on all devices for traders and users on the go.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Launch Your Professional Trading Portal?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of independent crypto traders who trust Tradyfi.ng to power their business. 
            Get verified, get your subdomain, and start trading professionally today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthModal 
              trigger={
                <Button 
                  size="lg"
                  className="bg-white hover:bg-slate-50 text-primary px-8 py-4 text-lg"
                >
                  Start Free Today
                </Button>
              }
              defaultMode="register"
            />
            {/* <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white hover:bg-white hover:text-primary text-white px-8 py-4 text-lg"
            >
              Schedule a Demo
            </Button> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
     
    </div>
  );
}
