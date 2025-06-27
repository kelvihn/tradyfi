import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { getSubdomain } from "@/lib/subdomain";
import { useQuery } from "@tanstack/react-query";
import { extractTraderSubdomain } from "@/lib/domain";

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import UserLogin from "@/pages/user/login";
import UserRegister from "@/pages/user/register";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLogin from "@/pages/admin/login";
import SimpleTraderRegister from "@/pages/trader/simple-register";
import TraderRegister from "@/pages/trader/register";
import TraderDashboard from "@/pages/trader/dashboard";
import TraderProfile from "@/pages/trader/profile";
import TraderPortal from "@/pages/trader/portal";
import UserPortal from "@/pages/user/portal";
import TestTraderPortal from "@/pages/trader-portal";
import { TraderPortalMain } from "@/pages/trader/trader-portal-main";
import NotFound from "@/pages/not-found";
import PaymentSuccess from "@/pages/payment-success";
import { useSubdomainValidator } from "./hooks/useSubdomainValidator";

import ForgotPassword from "@/pages/forgot-password";
import VerifyResetOTP from "@/pages/verify-reset-otp";
import ResetPassword from "@/pages/reset-password";
import PrivacyPolicy from "@/pages/privacy-policy";
import ContactUs from "@/pages/contact-us";
import DiscoverTraders from "@/pages/discover-trader";

// Import chat components
import { ChatInterface } from "@/components/chat/chat-interface";
import { useUserAuth } from "@/hooks/useUserAuth";

import { AuthProvider } from "@/hooks/useAuth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Protected Route Component for Trader Routes
function ProtectedTraderRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { data: traderStatus, isLoading: traderLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    retry: false,
    enabled: !!user && !isLoading,
  });

  if (isLoading || traderLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Return 404 if not authenticated or not a trader
  if (!user || !traderStatus || traderStatus.status !== 'verified') {
    return <NotFound />;
  }

  return <>{children}</>;
}

// Protected Route Component for Admin Routes
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Return 404 if not authenticated or not an admin
  if (!user || (user as any).role !== 'admin') {
    return <NotFound />;
  }

  return <>{children}</>;
}

// Trader Chat Route Component
function TraderChatRoute({ roomId }: { roomId: string }) {
  const { user, isLoading } = useAuth();
  const { data: traderStatus, isLoading: traderLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    retry: false,
    enabled: !!user && !isLoading,
  });

  if (isLoading || traderLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !traderStatus || traderStatus.status !== 'verified') {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.location.href = '/trader/dashboard'}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-xl font-semibold">Chat Room #{roomId}</h1>
            <p className="text-sm text-slate-600">Trader Chat Interface</p>
          </div>
        </div>
      </div>
      <ChatInterface 
        roomId={parseInt(roomId)} 
        userId={user.id} 
        onBack={() => window.location.href = '/trader/dashboard'}
      />
    </div>
  );
}

// User Chat Route Component for Subdomains
function UserChatRoute({ roomId, subdomain }: { roomId: string; subdomain: string }) {
  const { user, isAuthenticated, isLoading } = useUserAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Portal
          </button>
          <div>
            <h1 className="text-xl font-semibold">Chat Room #{roomId}</h1>
            <p className="text-sm text-slate-600">Trading Chat</p>
          </div>
        </div>
      </div>
      <ChatInterface 
        roomId={parseInt(roomId)} 
        userId={user.id} 
        onBack={() => window.location.href = '/'}
      />
    </div>
  );
}

// Updated TraderRedirect function in App.tsx
function TraderRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: traderStatus, isLoading: traderLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    retry: false,
    enabled: !!user && !authLoading && user.role === 'trader', // Only fetch if user is a trader
  });

  console.log('🏠 TraderRedirect render');
  console.log('👤 Auth user:', user);
  console.log('👤 User role:', user?.role);
  console.log('⏳ Auth loading:', authLoading);
  console.log('⏳ Trader loading:', traderLoading);
  console.log('📊 Trader status:', traderStatus);

  if (authLoading) {
    console.log('⏳ Auth still loading...');
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    console.log('❌ No user found, showing Landing');
    return <Landing />;
  }

  // Role-based routing
  if (user.role === 'admin') {
    console.log('🔀 Admin detected, redirecting to admin panel');
    window.location.href = '/admin';
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  if (user.role === 'trader') {
    if (traderLoading) {
      console.log('⏳ Trader data still loading...');
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (traderStatus?.status === 'verified') {
      console.log('✅ Verified trader, showing TraderDashboard');
      return <TraderDashboard />;
    }

    console.log('🏠 Trader not verified, showing Home page');
    return <Home />;
  }

  // Regular user or fallback
  console.log('🏠 Regular user, showing Home page');
  return <Home />;
}

function Router() {
  const subdomain = getSubdomain();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();
  const { loading, valid } = useSubdomainValidator();

  console.log("🏠 ROUTER DEBUG (with context):", subdomain);
  console.log("- Is Authenticated:", isAuthenticated);
  console.log("- User:", user);
  console.log("=================");

  // If we're on a trader subdomain, show user portal with user authentication
  if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    
    if (valid === false) {
      console.log("its checking for validity");
      return <Route path="/" component={Landing} />;
    }

    return (
      <Switch>
        <Route path="/login" component={UserLogin} />
        <Route path="/register" component={UserRegister} />

        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/contact" component={ContactUs} />
        
        {/* Add password reset routes for subdomains */}
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/verify-reset-otp" component={VerifyResetOTP} />
        <Route path="/reset-password" component={ResetPassword} />
        
        {/* Separate chat route for better navigation */}
        <Route path="/chat/:roomId">
          {(params) => <UserChatRoute roomId={params.roomId} subdomain={subdomain} />}
        </Route>
        
        <Route path="/" component={() => <UserPortal subdomain={subdomain} />} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Admin subdomain
  if (subdomain === 'admin') {
    return (
      <Switch>
        <Route path="/login" component={AdminLogin} />

        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/contact" component={ContactUs} />
        
        {/* Add password reset routes for admin subdomain */}
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/verify-reset-otp" component={VerifyResetOTP} />
        <Route path="/reset-password" component={ResetPassword} />
        
        {/* Protected admin routes */}
        <Route path="/">
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Main domain routing - check authentication
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      {/* Public routes - available to everyone */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-reset-otp" component={VerifyResetOTP} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/payment-success" component={PaymentSuccess} />
      
      {/* Admin routes - separate login, protected dashboard */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      </Route>
      
      {/* Protected trader routes */}
      <Route path="/trader/register" component={TraderRegister} />
      
      <Route path="/trader/dashboard">
        <ProtectedTraderRoute>
          <TraderDashboard />
        </ProtectedTraderRoute>
      </Route>
      <Route path="/trader/profile">
        <ProtectedTraderRoute>
          <TraderProfile />
        </ProtectedTraderRoute>
      </Route>
      <Route path="/trader/chat/:roomId">
        {(params) => <TraderChatRoute roomId={params.roomId} />}
      </Route>

      <Route path="/discover" component={DiscoverTraders} />
      
      {/* General authenticated routes */}
      {isAuthenticated && (
        <> 
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/contact" component={ContactUs} />
          <Route path="/home" component={Home} />
          <Route path="/test-portal" component={TestTraderPortal} />
        </>
      )}
      
      {/* Catch-all 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;