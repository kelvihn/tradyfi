import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  ShoppingCart, 
  TrendingUp, 
  Gift, 
  Star,
  Clock,
  Shield,
  ChartLine,
  LogOut,
  User
} from "lucide-react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { apiRequest } from "@/lib/queryClient";
import { getSubdomain } from "@/lib/subdomain";

interface UserPortalProps {
  subdomain: string;
}

export default function UserPortal({ subdomain }: UserPortalProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated } = useUserAuth();

  // Get trader data by subdomain
  const { data: trader, isLoading: traderLoading, error: traderError } = useQuery({
    queryKey: ["trader", "subdomain", subdomain],
    queryFn: async () => {
      console.log('Fetching trader for subdomain:', subdomain);
      const response = await fetch(`/api/trader/subdomain/${subdomain}`);
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch trader: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      return data;
    },
    enabled: !!subdomain,
    retry: 1,
  });

  // Get user's chat rooms - UPDATED TO NEW API
  const { data: userChats, refetch: refetchChats } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: async () => {
      const token = localStorage.getItem(`userToken_${subdomain}`);
      console.log('Fetching user chat rooms with token:', !!token);
      
      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Chat rooms response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching chat rooms:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Chat rooms data:', data);
      return data;
    },
    enabled: isAuthenticated,
  });

  // Create chat room mutation - UPDATED TO NEW API
  const createChatMutation = useMutation({
    mutationFn: async (tradingOption: string) => {
      const token = localStorage.getItem(`userToken_${subdomain}`);
      console.log('Creating chat room with:', { tradingOption, subdomain });
      
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tradingOption, subdomain }),
      });
      
      console.log('Create chat response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create chat error:', errorText);
        throw new Error("Failed to create chat room");
      }
      
      const data = await response.json();
      console.log('Created chat room:', data);
      return data;
    },
    onSuccess: (chatRoom) => {
      console.log('Chat room created successfully:', chatRoom);
      // Navigate to the chat route instead of showing inline
      window.location.href = `/chat/${chatRoom.id}`;
      // Refetch chat rooms to update the list
      queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
    onError: (error) => {
      console.error('Create chat mutation error:', error);
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // For subdomain users, we can just clear tokens locally
      // No need for server-side logout since we're using JWT
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear subdomain-specific tokens
      localStorage.removeItem(`userToken_${subdomain}`);
      localStorage.removeItem(`userData_${subdomain}`);
      
      // Clear any cached queries
      queryClient.clear();
      
      // Redirect to login page on same subdomain
      window.location.href = `/`;
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if there's an error, still clear tokens and redirect
      localStorage.removeItem(`userToken_${subdomain}`);
      localStorage.removeItem(`userData_${subdomain}`);
      queryClient.clear();
      window.location.href = `/`;
    }
  });

  const handleServiceClick = (service: string) => {
    setSelectedService(service);
  };

  const handleWhatsappClick = () => {
    const message = "Hello! I'm interested in your trading services.";
    const formattedNumber = trader?.contactInfo.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleStartChat = (tradingOption: string) => {
    console.log("Starting chat for trading option:", tradingOption);
    createChatMutation.mutate(tradingOption);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Handle chat navigation
  const handleViewChat = (chatId: number) => {
    window.location.href = `/chat/${chatId}`;
  };

  // Show loading state while checking authentication and trader data
  if (isLoading || traderLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-medium text-slate-900">Loading portal...</h1>
        </div>
      </div>
    );
  }

  // Show error if trader not found
  if (!trader && !traderLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Portal Not Found</h1>
          <p className="text-slate-600 mb-4">
            The trading portal "{subdomain}" doesn't exist or hasn't been set up yet.
          </p>
          {traderError && (
            <p className="text-red-600 text-sm mb-4">
              Error: {traderError.message}
            </p>
          )}
          <Button onClick={() => window.location.href = "/"}>
            Go to Main Site
          </Button>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome to {trader?.businessName || 'Trading Portal'}</h1>
          <p className="text-slate-600 mb-6">Sign in to access this trading portal and start your transactions.</p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/login"} 
              className="w-full"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/register"}
              className="w-full"
            >
            Signup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
     <header className="bg-white border-b border-slate-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-3 sm:py-4">
      <div className="flex items-center min-w-0 flex-1">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <ChartLine className="text-white text-sm sm:text-lg" />
        </div>
        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
          <h1 className="text-sm sm:text-xl font-bold text-slate-900 truncate">
            {trader?.businessName || 'Trading Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
            Crypto Trading Portal
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* Welcome text - hidden on mobile */}
        <span className="text-sm text-slate-600 hidden md:block">
          Welcome, {user?.firstName}
        </span>
        
        {/* Badge - simplified on mobile */}
        <Badge variant="default" className="bg-green-500 hidden sm:flex">
          <Shield className="h-3 w-3 mr-1" />
          Verified Trader
        </Badge>
        <Badge variant="default" className="bg-green-500 sm:hidden px-2 py-1">
          <Shield className="h-3 w-3" />
        </Badge>
        
        {/* Logout button - simplified on mobile */}
        <Button variant="outline" onClick={handleLogout} className="px-2 sm:px-4">
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  </div>
</header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Welcome to {trader?.businessName || 'Trading Portal'}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {trader?.profileDescription || "Your trusted crypto trading partner"}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleServiceClick("buy_crypto")}>
            <CardHeader>
              <CardTitle className="flex items-center text-teal-600">
                <ShoppingCart className="text-teal-500 h-6 w-6 mr-2" />
                Buy Crypto
              </CardTitle>
              <CardDescription>
                Purchase cryptocurrency with secure payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Fast & Secure</p>
                  <p className="text-lg font-semibold text-green-600">Best Rates</p>
                </div>
                <Button variant="outline" size="sm">
                  Start →
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleServiceClick("sell_crypto")}>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <TrendingUp className="h-6 w-6 mr-2" />
                Sell Crypto
              </CardTitle>
              <CardDescription>
                Sell your cryptocurrency for competitive market rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Instant Transfer</p>
                  <p className="text-lg font-semibold text-blue-600">Top Prices</p>
                </div>
                <Button variant="outline" size="sm">
                  Start →
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleServiceClick("sell_gift_card")}>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <Gift className="h-6 w-6 mr-2" />
                Sell Gift Cards
              </CardTitle>
              <CardDescription>
                Convert gift cards to cash with instant verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Quick Process</p>
                  <p className="text-lg font-semibold text-purple-600">Fair Value</p>
                </div>
                <Button variant="outline" size="sm">
                  Start →
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleWhatsappClick()}>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <MessageCircle className="text-green-500 h-6 w-6 mr-2" />
                Chat on Whatsapp
              </CardTitle>
              <CardDescription>
                Click here to chat with {trader?.businessName} directly on Whatsapp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-lg font-semibold text-green-600">Chat Now</p>
                </div>
                <Button variant="outline" size="sm">
                  Start →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Chats Section */}
        {userChats && userChats.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Your Active Conversations</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userChats.map((chat: any) => (
                <Card key={chat.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewChat(chat.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {chat.tradingOption?.replace('_', ' ') || 'Chat'}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={chat.isActive ? "default" : "secondary"}>
                        {chat.isActive ? "Active" : "Closed"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive" className="mt-2">
                        {chat.unreadCount} unread
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Service Selection Modal */}
        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="capitalize">
                  {selectedService.replace('_', ' ')} Service
                </CardTitle>
                <CardDescription>
                  Start a conversation with {trader?.businessName || 'the trader'} to begin your transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">What happens next?</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Direct chat with the trader</li>
                      <li>• Secure transaction process</li>
                      <li>• Real-time support</li>
                    </ul>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedService(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => handleStartChat(selectedService)}
                      disabled={createChatMutation.isPending}
                    >
                      {createChatMutation.isPending ? "Starting..." : "Start Chat"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="bg-white rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Why Choose {trader?.businessName || 'This Trader'}?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-2">Verified & Secure</h4>
              <p className="text-sm text-slate-600">
                Fully verified trader with secure transaction processes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-2">Fast Processing</h4>
              <p className="text-sm text-slate-600">
                Quick transaction processing and instant support
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-2">Best Rates</h4>
              <p className="text-sm text-slate-600">
                Competitive rates and transparent pricing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}