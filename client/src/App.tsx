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

import { AuthProvider } from "@/hooks/useAuth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Wrap with AuthProvider */}
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}


function TraderRedirect() {
  const { user, isLoading: authLoading } = useAuth(); // Get auth state
  const { data: traderStatus, isLoading: traderLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    retry: false,
    enabled: !!user && !authLoading, // Only run when auth is complete
  });

  console.log('🏠 TraderRedirect render');
  console.log('👤 Auth user:', user);
  console.log('⏳ Auth loading:', authLoading);
  console.log('⏳ Trader loading:', traderLoading);
  console.log('📊 Trader status:', traderStatus);

  // Wait for both auth and trader status to load
  if (authLoading || traderLoading) {
    console.log('⏳ Still loading...');
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Check if user is authenticated and has verified trader status
  if (user && traderStatus?.status === 'verified') {
    console.log('✅ Showing TraderDashboard');
    return <TraderDashboard />;
  }

  // Otherwise show home page
  console.log('🏠 Showing Home page');
  return <Home />;
}

function Router() {
  const subdomain = getSubdomain();
  const { isAuthenticated, isLoading, user } = useAuth(); // Uses shared context
  const [location] = useLocation();
  const { loading, valid } = useSubdomainValidator();

  console.log("🏠 ROUTER DEBUG (with context):");
  console.log("- Is Authenticated:", isAuthenticated);
  console.log("- User:", user);
  console.log("=================");

  // If we're on a trader subdomain, show user portal with user authentication
  if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    
    // Fixed: Added missing return statement
    if (valid === false) {
      console.log("its checking for validity");
      return <Route path="/" component={Landing} />;
    }

    // For trader subdomains, we don't need to check main domain authentication
    // The UserPortal component should handle its own authentication state
    console.log("it broke here");
    return (
      <Switch>
        <Route path="/login" component={UserLogin} />
        <Route path="/register" component={UserRegister} />
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
          <Route path="/test-portal" component={TestTraderPortal} />
          <Route path="/payment-success" component={PaymentSuccess} />
          {/* Removed subdomain routes from main domain - they're handled above */}
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/payment-success" component={PaymentSuccess} />
          {/* Removed subdomain routes from main domain - they're handled above */}
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

export default App;
