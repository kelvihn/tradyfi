import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
// Import the type from your shared schema
import { TraderWithUser } from "@shared/schema";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Settings,
  BarChart3,
  LogOut,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  Shield,
  ShieldOff,
  AlertTriangle,
  Power,
  PowerOff
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Document viewer state
  const [documentDialog, setDocumentDialog] = useState<{
    isOpen: boolean;
    trader: TraderWithUser | null;
  }>({
    isOpen: false,
    trader: null
  });

  // Deactivation dialog state
  const [deactivationDialog, setDeactivationDialog] = useState<{
    isOpen: boolean;
    trader: TraderWithUser | null;
    reason: string;
  }>({
    isOpen: false,
    trader: null,
    reason: ''
  });

  // Check if user is admin
  useEffect(() => {
    console.log('Admin check:', { authLoading, isAuthenticated, user });
    
    if (!authLoading && user) {
      if ((user as any).role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive",
        });
        setLocation("/admin/login");
      }
    } else if (!authLoading && !user && !localStorage.getItem('token')) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, user, setLocation, toast]);

  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: () => adminApiRequest('GET', '/api/admin/stats'),
    enabled: !!user && (user as any).role === 'admin',
  });

  // Fetch pending traders
  const { data: pendingTraders = [], isLoading: pendingLoading } = useQuery<TraderWithUser[]>({
    queryKey: ['/api/admin/traders/pending'],
    queryFn: () => adminApiRequest('GET', '/api/admin/traders/pending'),
    enabled: !!user && (user as any).role === 'admin',
  });

  // Fetch subscription analytics
  const { data: subscriptionAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/subscription-analytics'],
    queryFn: () => adminApiRequest('GET', '/api/admin/subscription-analytics'),
    enabled: !!user && (user as any).role === 'admin',
  });

  // Fetch all traders
  const { data: allTraders = [], isLoading: tradersLoading } = useQuery<TraderWithUser[]>({
    queryKey: ['/api/admin/traders'],
    queryFn: () => adminApiRequest('GET', '/api/admin/traders'),
    enabled: !!user && (user as any).role === 'admin',
  });

  // Approve trader mutation
  const approveMutation = useMutation({
    mutationFn: async (traderId: number) => {
      return await adminApiRequest("POST", `/api/admin/traders/${traderId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/traders/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/traders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Trader Approved",
        description: "Trader has been successfully approved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject trader mutation
  const rejectMutation = useMutation({
    mutationFn: async (traderId: number) => {
      return await adminApiRequest("POST", `/api/admin/traders/${traderId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/traders/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/traders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Trader Rejected",
        description: "Trader has been successfully rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Suspend trader mutation (instead of deactivate)
  const suspendMutation = useMutation({
    mutationFn: async ({ traderId, reason }: { traderId: number; reason: string }) => {
      return await adminApiRequest("POST", `/api/admin/traders/${traderId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/traders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDeactivationDialog({ isOpen: false, trader: null, reason: '' });
      toast({
        title: "Trader Suspended",
        description: "Trader has been successfully suspended",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Suspension Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unsuspend trader mutation (instead of activate)
  const unsuspendMutation = useMutation({
    mutationFn: async (traderId: number) => {
      return await adminApiRequest("POST", `/api/admin/traders/${traderId}/unsuspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/traders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Trader Unsuspended",
        description: "Trader has been successfully reactivated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unsuspension Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await adminApiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "Successfully logged out",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
    onError: (error: Error) => {
      localStorage.removeItem('token');
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'verification_pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Suspended</Badge>;
      case 'unverified':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unverified</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case 'national_id':
        return 'National ID Card';
      case 'drivers_license':
        return "Driver's License";
      case 'international_passport':
        return 'International Passport';
      default:
        return 'Government Document';
    }
  };

  const handleViewDocument = (trader: TraderWithUser) => {
    setDocumentDialog({
      isOpen: true,
      trader
    });
  };

  const handleDeactivateTrader = (trader: TraderWithUser) => {
    setDeactivationDialog({
      isOpen: true,
      trader,
      reason: ''
    });
  };

  const handleConfirmDeactivation = () => {
    if (deactivationDialog.trader) {
      suspendMutation.mutate({
        traderId: deactivationDialog.trader.id,
        reason: deactivationDialog.reason
      });
    }
  };

  const handleDownloadDocument = (documentUrl: string, traderName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = `${traderName.replace(/\s+/g, '_')}_document`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Document viewer component
  const DocumentViewer = ({ trader }: { trader: TraderWithUser }) => {
    if (!trader?.documentUrl) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No document uploaded</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{getDocumentTypeLabel(trader.documentType || '')}</h3>
            <p className="text-sm text-gray-600">Uploaded by {trader.businessName}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadDocument(trader.documentUrl!, trader.businessName)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(trader.documentUrl!, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          {isImageFile(trader.documentUrl) ? (
            <img
              src={trader.documentUrl}
              alt={`${trader.businessName} ${getDocumentTypeLabel(trader.documentType || '')}`}
              className="w-full h-auto max-h-96 object-contain"
            />
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                PDF Document - {getDocumentTypeLabel(trader.documentType || '')}
              </p>
              <Button onClick={() => window.open(trader.documentUrl!, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Trader card component with all actions
  const TraderCard = ({ trader, showActions = false }: { trader: TraderWithUser; showActions?: boolean }) => (
    <div key={trader.id} className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{trader.businessName}</h3>
            {getStatusBadge(trader.status)}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Owner:</strong> {trader.firstName} {trader.lastName}
            </div>
            <div>
              <strong>Email:</strong> {trader.email}
            </div>
            <div>
              <strong>Contact:</strong> {trader.contactInfo}
            </div>
            <div>
              <strong>Subdomain:</strong> {trader.subdomain}
            </div>
            {trader.documentType && (
              <div>
                <strong>Document:</strong> {getDocumentTypeLabel(trader.documentType)}
              </div>
            )}
            <div>
              <strong>Joined:</strong> {new Date(trader.createdAt!).toLocaleDateString()}
            </div>
          </div>
          {trader.profileDescription && (
            <div className="mt-2">
              <strong className="text-sm">Description:</strong>
              <p className="text-sm text-gray-600">{trader.profileDescription}</p>
            </div>
          )}
          {trader.status === 'suspended' && (trader as any).deactivationReason && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
              <strong className="text-sm text-orange-800">Suspension Reason:</strong>
              <p className="text-sm text-orange-700">{(trader as any).deactivationReason}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 ml-4">
          {/* Document view button */}
          {trader.documentUrl && (
            <Button
              onClick={() => handleViewDocument(trader)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Document
            </Button>
          )}
          
          {/* Action buttons for pending traders */}
          {showActions && trader.status === 'verification_pending' && (
            <>
              <Button
                onClick={() => approveMutation.mutate(trader.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => rejectMutation.mutate(trader.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant="destructive"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}

          {/* Suspend/Unsuspend buttons for verified traders */}
          {trader.status === 'verified' && (
            <Button
              onClick={() => handleDeactivateTrader(trader)}
              disabled={suspendMutation.isPending}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <PowerOff className="h-4 w-4 mr-1" />
              Suspend
            </Button>
          )}

          {trader.status === 'suspended' && (
            <Button
              onClick={() => unsuspendMutation.mutate(trader.id)}
              disabled={unsuspendMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Power className="h-4 w-4 mr-1" />
              Unsuspend
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (authLoading || !user || (user as any).role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isLoading = statsLoading || pendingLoading || tradersLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <Button 
              onClick={() => logoutMutation.mutate()} 
              variant="outline"
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Traders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : (adminStats as any)?.totalTraders || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : (adminStats as any)?.pendingApprovals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Traders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : allTraders.filter(t => t.status === 'verified').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : allTraders.filter(t => t.status === 'suspended').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected Traders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : (adminStats as any)?.rejectedTraders || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="all">All Traders</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions & Revenue</TabsTrigger>
          </TabsList>

          {/* Pending Traders Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Trader Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading traders...</div>
                ) : pendingTraders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No pending approvals</div>
                ) : (
                  <div className="space-y-4">
                    {pendingTraders.map((trader) => (
                      <TraderCard key={trader.id} trader={trader} showActions={true} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Traders Tab */}
          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Traders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading traders...</div>
                ) : allTraders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No traders registered</div>
                ) : (
                  <div className="space-y-4">
                    {allTraders.map((trader) => (
                      <TraderCard 
                        key={trader.id} 
                        trader={trader} 
                        showActions={trader.status === 'verification_pending'} 
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions & Revenue Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{analyticsLoading ? "..." : (adminStats as any)?.totalRevenue?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{analyticsLoading ? "..." : (adminStats as any)?.monthlyRevenue?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsLoading ? "..." : (adminStats as any)?.activeSubscriptions || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Trial Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsLoading ? "..." : (adminStats as any)?.trialSubscriptions || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Recent Paid Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading subscription data...</div>
                ) : !subscriptionAnalytics?.recentSubscriptions?.length ? (
                  <div className="text-center py-8 text-gray-500">No paid subscriptions yet</div>
                ) : (
                  <div className="space-y-4">
                    {(subscriptionAnalytics as any)?.recentSubscriptions?.map((subscription: any) => (
                      <div key={subscription.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{subscription.userName}</h3>
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                {subscription.planName}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <strong>Amount:</strong> ₦{subscription.amount?.toLocaleString()}
                              </div>
                              <div>
                                <strong>Status:</strong> {subscription.status}
                              </div>
                              <div>
                                <strong>Date:</strong> {new Date(subscription.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  6-Month Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading trend data...</div>
                ) : !subscriptionAnalytics?.monthlyTrend?.length ? (
                  <div className="text-center py-8 text-gray-500">No trend data available</div>
                ) : (
                  <div className="space-y-4">
                    {(subscriptionAnalytics as any)?.monthlyTrend?.map((month: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{month.month}</div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            {month.subscriptions} subscription{month.subscriptions !== 1 ? 's' : ''}
                          </div>
                          <div className="font-bold text-green-600">
                            ₦{month.revenue?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog 
        open={documentDialog.isOpen} 
        onOpenChange={(open) => setDocumentDialog({ isOpen: open, trader: null })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
          </DialogHeader>
          {documentDialog.trader && <DocumentViewer trader={documentDialog.trader} />}
        </DialogContent>
      </Dialog>

      {/* Suspension Confirmation Dialog */}
      <Dialog 
        open={deactivationDialog.isOpen} 
        onOpenChange={(open) => setDeactivationDialog({ isOpen: open, trader: null, reason: '' })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Suspend Trader
            </DialogTitle>
          </DialogHeader>
          
          {deactivationDialog.trader && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to suspend <strong>{deactivationDialog.trader.businessName}</strong>? 
                This will suspend their trader portal and prevent customers from accessing their services.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="deactivation-reason">Reason for suspension (optional)</Label>
                <Textarea
                  id="deactivation-reason"
                  placeholder="Enter reason for suspension..."
                  value={deactivationDialog.reason}
                  onChange={(e) => setDeactivationDialog(prev => ({ ...prev, reason: e.target.value }))}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-gray-500">
                  This reason will be sent to the trader via email notification.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeactivationDialog({ isOpen: false, trader: null, reason: '' })}
              disabled={suspendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeactivation}
              disabled={suspendMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {suspendMutation.isPending ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Suspend Trader
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}