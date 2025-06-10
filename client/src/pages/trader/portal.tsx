import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartLine, MessageCircle, CreditCard, DollarSign, Gift, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TraderPortalProps {
  subdomain: string;
}

export default function TraderPortal({ subdomain }: TraderPortalProps) {
  const { user, isAuthenticated } = useAuth();

  const { data: trader, isLoading } = useQuery({
    queryKey: [`/api/trader/subdomain/${subdomain}`],
    retry: false,
  });

  const handleLogin = () => {
    window.location.href = "/";
  };

  const handleTradingOption = async (option: string) => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    try {
      // Register user to trader portal if not already registered
      await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ traderId: trader.id }),
      });

      // Start chat session
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          traderId: trader.id,
          tradingOption: option,
        }),
      });

      if (response.ok) {
        const chatRoom = await response.json();
        window.location.href = `/chat/${chatRoom.id}`;
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading trader portal...</p>
        </div>
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Trader Not Found</h1>
            <p className="text-slate-600 mb-4">
              The trader portal you're looking for doesn't exist or has been suspended.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Main Site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (trader.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Portal Unavailable</h1>
            <p className="text-slate-600 mb-4">
              This trader portal is currently under review or has been suspended.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Main Site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-white text-lg" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-slate-900">{trader.businessName}</div>
                <div className="text-xs text-slate-600">{subdomain}.tradyfi.ng</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Online</span>
              </div>
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-600">{user?.firstName || user?.email}</span>
                </div>
              ) : (
                <Button onClick={handleLogin} size="sm">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Welcome to {trader.businessName}
          </h1>
          {trader.profileDescription && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {trader.profileDescription}
            </p>
          )}
          <div className="mt-4">
            <Badge variant="default" className="bg-green-500">
              Verified Trader
            </Badge>
          </div>
        </div>

        {/* Trading Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTradingOption("buy_crypto")}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-primary text-2xl" />
              </div>
              <CardTitle className="text-xl text-primary">Buy Crypto</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-4">
                Purchase cryptocurrencies at competitive rates with secure transactions.
              </p>
              <Button className="w-full btn-primary">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTradingOption("sell_crypto")}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-green-500 text-2xl" />
              </div>
              <CardTitle className="text-xl text-green-700">Sell Crypto</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-4">
                Convert your cryptocurrencies to cash quickly and safely.
              </p>
              <Button className="w-full btn-success">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTradingOption("sell_gift_card")}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="text-yellow-500 text-2xl" />
              </div>
              <CardTitle className="text-xl text-yellow-700">Sell Gift Card</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-4">
                Exchange your gift cards for cryptocurrency or cash instantly.
              </p>
              <Button className="w-full btn-warning">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Why Choose {trader.businessName}?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-slate-700">Verified and trusted trader</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-slate-700">Secure and fast transactions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-slate-700">Real-time customer support</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-slate-700">Competitive rates</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm mr-3 mt-1">1</div>
                  <div>
                    <div className="font-medium text-slate-900">Choose Service</div>
                    <div className="text-sm text-slate-600">Select buy crypto, sell crypto, or sell gift card</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm mr-3 mt-1">2</div>
                  <div>
                    <div className="font-medium text-slate-900">Start Chat</div>
                    <div className="text-sm text-slate-600">Connect directly with our trader via real-time chat</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm mr-3 mt-1">3</div>
                  <div>
                    <div className="font-medium text-slate-900">Complete Transaction</div>
                    <div className="text-sm text-slate-600">Follow the trader's guidance to complete your transaction</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Contact Information</h3>
              <p className="text-slate-600 whitespace-pre-line">
                {trader.contactInfo}
              </p>
              <div className="mt-4 text-sm text-slate-500">
                Verified trader on Tradyfi.ng platform
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
