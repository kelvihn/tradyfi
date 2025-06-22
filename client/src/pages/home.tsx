import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartLine, Users, MessageCircle, Settings, LogOut, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Footer from "@/components/footer";
import Logo from "@/components/logo";

export default function Home() {
  const { user } = useAuth();

  // Fetch trader status for current user (disabled for admin users)
  const { data: traderStatus } = useQuery({
    queryKey: ["/api/trader/status"],
    enabled: !!user && user.role !== 'admin',
  });

  // Fetch user's chat history (disabled for admin users)
  const { data: userChats } = useQuery({
    queryKey: ["/api/user/chats"],
    enabled: !!user && user.role !== 'admin',
  });



  const { logout } = useAuth();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "verification_pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Verification Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unverified
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <Logo/>
            <div className="flex items-center space-x-4">
              {/* <span className="text-slate-600">Welcome, {user?.firstName || user?.email}</span> */}
              <Button variant="ghost" onClick={logout} className="text-slate-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome to your Dashboard
              </h1>
              <p className="text-slate-600">
                Manage your trading account and verification status.
              </p>
            </div>
            <div>
              {getStatusBadge(traderStatus?.status || "unverified")}
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Trader Verification Status</span>
                {getStatusBadge(traderStatus?.status || "unverified")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!traderStatus || traderStatus.status === "unverified") && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    You need to complete trader verification to access your personalized trading subdomain and start managing clients.
                  </p>
                <br></br>
                  <Link href="/trader/register">
                    <Button className="btn-primary">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Start Verification
                    </Button>
                  </Link>
                </div>
              )}
              
              {traderStatus?.status === "verification_pending" && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Your trader verification is under review. We'll notify you once it's been processed.
                  </p>
                  <div className="text-sm text-slate-500">
                    <p>Submitted: {new Date(traderStatus.submittedAt).toLocaleDateString()}</p>
                    <p>Business Name: {traderStatus.businessName}</p>
                  </div>
                </div>
              )}
              
              {traderStatus?.status === "verified" && (
                <div className="space-y-4">
                  <p className="text-green-700">
                    Congratulations! Your trader account is verified.
                  </p>
                  <div className="text-sm text-slate-600">
                    <p>Your subdomain: <strong>{traderStatus.subdomain}.tradyfi.ng</strong></p>
                    <p>Business Name: {traderStatus.businessName}</p>
                  </div>
                  <br></br>
                  <Link href="/trader/dashboard">
                    <Button className="btn-primary">
                      <ChartLine className="h-4 w-4 mr-2" />
                      View Trading Portal
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat History Section */}
        {userChats && userChats.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-6 w-6 text-blue-500 mr-2" />
                  My Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userChats.map((chat: any) => (
                    <div key={chat.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-slate-900">{chat.traderBusinessName}</p>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="bg-red-500 text-white text-xs px-2 py-1">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {chat.lastMessageTime ? (() => {
                              const date = new Date(chat.lastMessageTime);
                              return isNaN(date.getTime()) ? 'Recent' : date.toLocaleDateString();
                            })() : 'No messages yet'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/${chat.traderSubdomain}/chat/${chat.id}`}
                      >
                        Continue Chat
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Settings */}
          {(!traderStatus || traderStatus.status === 'rejected') && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-6 w-6 text-primary mr-2" />
                  Become a Trader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Register as an independent crypto trader and get your own trading portal.
                </p>
                <Link href="/trader/register">
                  <Button className="w-full btn-primary">
                   Signup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Trader Dashboard */}
          {traderStatus && traderStatus.status === 'verified' && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartLine className="h-6 w-6 text-green-500 mr-2" />
                  Trader Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Manage your trading portal, chat with clients, and view analytics.
                </p>
                <Link href="/trader/dashboard">
                  <Button className="w-full btn-success">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Trader Profile */}
          {user?.trader && (user.trader.status === 'verification_pending' || user.trader.status === 'suspended') && (
            <Card className="hover:shadow-md transition-shadow border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-6 w-6 text-yellow-500 mr-2" />
                  Trader Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  View your trader profile and verification status.
                </p>
                <Link href="/trader/profile">
                  <Button className="w-full" variant="outline">
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Verification Pending */}
          {user?.trader && user.trader.status === 'verification_pending' && (
            <Card className="hover:shadow-md transition-shadow border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-6 w-6 text-yellow-500 mr-2" />
                  Application Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Your trader application is under review. You'll be notified once approved.
                </p>
                <Button disabled className="w-full">
                  Awaiting Approval
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Suspended Account */}
          {user?.trader && user.trader.status === 'suspended' && (
            <Card className="hover:shadow-md transition-shadow border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-6 w-6 text-red-500 mr-2" />
                  Account Suspended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Your trader account has been suspended. Contact support for assistance.
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Panel */}
          {user?.role === 'admin' && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-6 w-6 text-red-500 mr-2" />
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Manage traders, verify accounts, and oversee platform operations.
                </p>
                <Link href="/admin">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                    Admin Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Platform Stats */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-6 w-6 text-blue-500 mr-2" />
                Platform Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Real-time chat system
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Custom trader subdomains
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  NIN verification system
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Multi-trader support
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

       
      </div>
      {/* Footer */}
       <div className="py-20"></div>
      <Footer/>
    </div>
    
  );
}
