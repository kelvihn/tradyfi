import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChartLine, MessageCircle, Users, Globe, ExternalLink, Plus, Clock, DollarSign, ArrowLeft, User, Edit } from "lucide-react";
import { SubscriptionCard } from "@/components/subscription/subscription-card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trader } from "@shared/schema";
import { SubscriptionWarningCard } from "@/components/subscription/subscription-warning-card";

export default function TraderDashboard() {
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    contactInfo: '',
    profileDescription: '',
    subdomain: ''
  });
  const { user, isLoading: userLoading } = useAuth(); 
  const { logout } = useAuth();
  const { toast } = useToast();

  // Fetch real trader chat rooms
  const { data: traderChats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/chat/trader/chats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/trader/chats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trader chats: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!user && (user as any).role === 'trader',
  });

  // Fetch real trader statistics
  const { data: traderStats = { portalVisits: 0, transactions: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/trader/stats'],
    enabled: !!user && (user as any).role === 'trader',
  });

  // Fetch trader status from API with custom fetch
  const { data: traderStatus, isLoading: traderLoading, refetch: refetchTraderStatus } = useQuery({
    queryKey: ['/api/trader/status'],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trader/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch response:', data);
      return data;
    },
  });

  // Force cache invalidation on mount
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['/api/trader/status'] });
    }
  }, [user]);

  // Check token and debug
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    console.log('traderStatus received:', traderStatus);
    console.log('traderStatus type:', typeof traderStatus);
    if (traderStatus) {
      console.log('Raw trader status:', traderStatus);
      const trader = traderStatus as any;
      console.log('Trader business name:', trader.businessName);
      console.log('Trader subdomain:', trader.subdomain);
      console.log('Trader status:', trader.status);
      setProfileForm({
        businessName: trader.businessName || '',
        contactInfo: trader.contactInfo || '',
        profileDescription: trader.profileDescription || '',
        subdomain: trader.subdomain || ''
      });
    }
  }, [traderStatus, user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<typeof profileForm>) => {
      const response = await fetch('/api/trader/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your trader profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trader/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Don't send subdomain in update request as it's not editable
    const { subdomain, ...updateData } = profileForm;
    updateProfileMutation.mutate(updateData);
  };

  // Handle chat navigation
  const handleViewChat = (chatId: number) => {
    window.location.href = `/trader/chat/${chatId}`;
  };

  if (userLoading || chatsLoading || traderLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate chat statistics
  const activeChatCount = ((traderChats as any)?.filter((chat: any) => chat.isActive) || []).length;
  const totalChats = (traderChats as any)?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ChartLine className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Trader Dashboard</h1>
                <p className="text-slate-600">Welcome back, {(traderStatus as any)?.businessName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={
                  (traderStatus as any)?.status === 'verified' ? 'default' : 
                  (traderStatus as any)?.status === 'verification_pending' ? 'secondary' : 
                  'destructive'
                }
              >
                {(traderStatus as any)?.status === 'verified' ? 'Verified' : 
                 (traderStatus as any)?.status === 'verification_pending' ? 'Pending Verification' : 
                 'Unverified'}
              </Badge>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionWarningCard traderStatus={traderStatus} />
        <br></br>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="chats">Messages</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeChatCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalChats} total conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portal Visits</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(traderStats as any)?.portalVisits || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total visits
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(traderStats as any)?.transactions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total completed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Portal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Your Trading Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Portal URL:</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {(traderStatus as any)?.subdomain}.tradyfi.ng
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://${(traderStatus as any)?.subdomain}.tradyfi.ng`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Business:</p>
                    <p className="font-medium">{(traderStatus as any)?.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Description:</p>
                    <p className="text-sm">{(traderStatus as any)?.profileDescription || "No description set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Trader Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={profileForm.businessName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Enter your business name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subdomain">Portal Subdomain</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="subdomain"
                          value={profileForm.subdomain}
                          readOnly
                          disabled
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-500">.tradyfi.ng</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Subdomain cannot be changed after registration</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contactInfo">Contact Information (Whatsapp number)</Label>
                    <Input
                      id="contactInfo"
                      value={profileForm.contactInfo}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="profileDescription">Profile Description</Label>
                    <Textarea
                      id="profileDescription"
                      value={profileForm.profileDescription}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, profileDescription: e.target.value }))}
                      placeholder="Tell potential clients about your trading services..."
                      rows={4}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="chats" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Conversations</CardTitle>
                  <Badge variant="secondary">{totalChats} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {totalChats === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No conversations yet</h3>
                    <p className="text-slate-500">When clients start conversations, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(traderChats as any)?.map((chat: any) => (
                      <div key={chat.id} className="border rounded-lg p-4 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium capitalize">
                                {chat.tradingOption?.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-slate-500">User: {chat.userName || 'Unknown User'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={chat.isActive ? "default" : "secondary"}>
                              {chat.isActive ? "Active" : "Closed"}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {(() => {
                                  const date = new Date(chat.lastMessageTime || chat.createdAt);
                                  return isNaN(date.getTime()) ? 'Recent' : date.toLocaleDateString();
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleViewChat(chat.id)}
                          >
                            View Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionCard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}