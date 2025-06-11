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

function TraderRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: traderStatus, isLoading: traderLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    retry: false,
    enabled: !!user && !authLoading,
  });

  console.log('🏠 TraderRedirect render');
  console.log('👤 Auth user:', user);
  console.log('⏳ Auth loading:', authLoading);
  console.log('⏳ Trader loading:', traderLoading);
  console.log('📊 Trader status:', traderStatus);

  if (authLoading || traderLoading) {
    console.log('⏳ Still loading...');
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user && traderStatus?.status === 'verified') {
    console.log('✅ Showing TraderDashboard');
    return <TraderDashboard />;
  }

  console.log('🏠 Showing Home page');
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

    console.log("it broke here");
    return (
      <Switch>
        <Route path="/login" component={UserLogin} />
        <Route path="/register" component={UserRegister} />
        
        {/* Add password reset routes for subdomains */}
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/verify-reset-otp" component={VerifyResetOTP} />
        <Route path="/reset-password" component={ResetPassword} />
        
        <Route path="/chat/:roomId" component={() => <UserPortal subdomain={subdomain} />} />
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
        
        {/* Add password reset routes for admin subdomain */}
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/verify-reset-otp" component={VerifyResetOTP} />
        <Route path="/reset-password" component={ResetPassword} />
        
        <Route path="/" component={isAuthenticated ? AdminDashboard : AdminLogin} />
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
      {/* Admin routes - available to both authenticated and non-authenticated */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      
      {isAuthenticated ? (
        <>
          <Route path="/" component={TraderRedirect} />
          <Route path="/home" component={Home} />
          <Route path="/trader/register" component={TraderRegister} />
          <Route path="/trader/profile" component={TraderProfile} />
          <Route path="/trader/dashboard" component={TraderDashboard} />
          
          {/* Password reset routes available to authenticated users */}
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/verify-reset-otp" component={VerifyResetOTP} />
          <Route path="/reset-password" component={ResetPassword} />
          
          <Route path="/test-portal" component={TestTraderPortal} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          
          {/* Password reset routes available to non-authenticated users */}
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/verify-reset-otp" component={VerifyResetOTP} />
          <Route path="/reset-password" component={ResetPassword} />
          
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

export default App;