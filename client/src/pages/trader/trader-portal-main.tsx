import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, LogOut, TrendingUp } from "lucide-react";
import { TraderPortalAuth } from "@/components/trader/trader-portal-auth";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useUserAuth } from "@/hooks/useUserAuth";

interface TraderPortalMainProps {
  subdomain: string;
  mode?: 'login' | 'register' | 'chat';
  roomId?: string;
}

export function TraderPortalMain({ subdomain, mode, roomId }: TraderPortalMainProps) {
  const [location] = useLocation();
  const { user } = useUserAuth();
  // Get trader information
  const { data: trader } = useQuery({
    queryKey: [`/api/trader/portal/${subdomain}`],
    queryFn: async () => {
      const response = await fetch(`/api/trader/portal/${subdomain}`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handleStartTrading = async () => {
    try {
      // Create or get existing chat room for trading
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          traderId: trader?.id,
          tradingOption: 'general'
        })
      });

      if (response.ok) {
        const chatRoom = await response.json();
        // Navigate to chat room
        window.location.href = `/${subdomain}/chat/${chatRoom.id}`;
      } else {
        console.error('Failed to create chat room');
      }
    } catch (error) {
      console.error('Error starting trading session:', error);
    }
  };

  // Handle registration route
  if (location.endsWith('/register')) {
    return <TraderPortalAuth traderSubdomain={subdomain} mode="register" />;
  }

  // Handle chat mode
  if (mode === 'chat' && roomId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{trader?.businessName}</h1>
                <p className="text-sm text-slate-500">Trading Chat</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = `/${subdomain}`}>
              Back to Portal
            </Button>
          </div>
        </header>
        <div className="flex-1">
          <ChatInterface roomId={parseInt(roomId)} userId={user?.id || "1"} />
        </div>
      </div>
    );
  }

  return (
    <TraderPortalAuth traderSubdomain={subdomain} mode="login">
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <h1 className="text-xl font-bold text-slate-900">
                    {trader?.businessName || 'Trading Portal'}
                  </h1>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active Portal
                </Badge>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Welcome Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Welcome to {trader?.businessName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-600">
                    {trader?.profileDescription || 'Access professional trading services and real-time market insights.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Crypto Trading</Badge>
                    <Badge variant="secondary">Market Analysis</Badge>
                    <Badge variant="secondary">Portfolio Management</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Phone</p>
                  <p className="text-slate-900">{trader?.contactInfo || 'Contact information not available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Trading Services */}
            <Card>
              <CardHeader>
                <CardTitle>Trading Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" onClick={handleStartTrading}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Start Trading
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Live Chat Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Market Status */}
            <Card>
              <CardHeader>
                <CardTitle>Market Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">BTC/USD</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Live
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">ETH/USD</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Live
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className="text-sm font-medium text-green-600">Markets Open</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Portfolio
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Transaction History
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> Trading cryptocurrencies involves substantial risk and may not be suitable for all investors. 
              Past performance does not guarantee future results. Please trade responsibly.
            </p>
          </div>
        </main>
      </div>
    </TraderPortalAuth>
  );
}