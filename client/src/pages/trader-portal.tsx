import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, User, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getSubdomain } from "@/lib/subdomain";

export default function TraderPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "testuser@example.com",
    password: "password123",
    firstName: "Test User"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current subdomain to check portal status
  const subdomain = getSubdomain();
  
  // Check if this trader portal is active
  const { data: portalStatus, isLoading: portalLoading, error: portalError } = useQuery({
    queryKey: [`/api/trader/${subdomain}/portal-status`],
    enabled: !!subdomain,
    retry: false
  });

  // Simulate login for trader portal
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return await response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      setIsLoggedIn(true);
      toast({
        title: "Success",
        description: "Logged in to Roy's Trading Portal",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create chat room with trader
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tradingOption: 'Bitcoin Trading',
          traderSubdomain: 'roytrading'
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create chat');
      }
      
      return await response.json();
    },
    onSuccess: (chatRoom) => {
      setChatRoomId(chatRoom.id);
      setShowChat(true);
      toast({
        title: "Chat Started",
        description: "Connected with Roy for Bitcoin trading discussion",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password
    });
  };

  const startChat = () => {
    createChatMutation.mutate();
  };

  if (showChat && chatRoomId && user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-blue-600 text-white p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Roy's Crypto Trading Portal</h1>
            <Button 
              variant="outline" 
              className="text-blue-600 bg-white"
              onClick={() => setShowChat(false)}
            >
              Back to Portal
            </Button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto p-4">
          <ChatInterface roomId={chatRoomId} userId={user.id} />
        </div>
      </div>
    );
  }

  // Show loading state while checking portal status
  if (portalLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trader portal...</p>
        </div>
      </div>
    );
  }

  // Show inactive portal message if subscription expired or portal inactive
  if (!portalStatus?.active) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-red-600 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">Trading Portal Inactive</h1>
              <p className="text-red-100 text-lg">This trading portal is currently unavailable</p>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600 flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Portal Unavailable
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {portalStatus?.message || "This trading portal subscription has expired or the trader account is inactive."}
              </p>
              <p className="text-sm text-gray-500">
                Please contact the trader directly or visit our main platform for other available traders.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="mt-4"
              >
                Return to Main Platform
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Trader Portal Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">{portalStatus?.trader?.businessName || "Crypto Trading Portal"}</h1>
            <p className="text-blue-100 text-lg">Professional cryptocurrency trading services</p>
            <div className="mt-4 text-sm text-blue-200">
              📍 {subdomain}.tradyfi.ng
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isLoggedIn ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Portal Information */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    About Roy's Trading
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Verified Trader</h4>
                      <p className="text-sm text-slate-600">Licensed and verified professional trader</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Direct Communication</h4>
                      <p className="text-sm text-slate-600">Chat directly with Roy for personalized trading advice</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-purple-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Secure Platform</h4>
                      <p className="text-sm text-slate-600">Your conversations and data are protected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Login Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Access Roy's Trading Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Access Trading Portal"}
                    </Button>
                  </form>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Test Account:</strong><br />
                      Email: testuser@example.com<br />
                      Password: password123
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {user.firstName || user.email}!
              </h2>
              <p className="text-slate-600">Ready to discuss your trading strategies with Roy?</p>
            </div>

            {/* Trading Options */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bitcoin Trading</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Get expert advice on Bitcoin trading strategies and market analysis.
                  </p>
                  <Button onClick={startChat} className="w-full" disabled={createChatMutation.isPending}>
                    {createChatMutation.isPending ? "Connecting..." : "Start Chat with Roy"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ethereum Trading</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Discuss Ethereum trading opportunities and DeFi strategies.
                  </p>
                  <Button onClick={startChat} className="w-full" disabled={createChatMutation.isPending}>
                    {createChatMutation.isPending ? "Connecting..." : "Start Chat with Roy"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Get your crypto portfolio reviewed and optimized by Roy.
                  </p>
                  <Button onClick={startChat} className="w-full" disabled={createChatMutation.isPending}>
                    {createChatMutation.isPending ? "Connecting..." : "Start Chat with Roy"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}