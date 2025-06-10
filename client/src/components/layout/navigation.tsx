import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  ChartLine, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  Home,
  Shield
} from "lucide-react";

interface NavigationProps {
  showAuthButtons?: boolean;
  variant?: 'main' | 'trader' | 'admin';
  title?: string;
}

export function Navigation({ 
  showAuthButtons = true, 
  variant = 'main',
  title
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getBrandInfo = () => {
    switch (variant) {
      case 'admin':
        return {
          icon: <Shield className="text-white" />,
          title: "Admin Portal",
          bgColor: "bg-red-500"
        };
      case 'trader':
        return {
          icon: <ChartLine className="text-white" />,
          title: title || "Trader Portal",
          bgColor: "bg-primary"
        };
      default:
        return {
          icon: <ChartLine className="text-white" />,
          title: "Tradyfi.ng",
          bgColor: "bg-primary"
        };
    }
  };

  const brandInfo = getBrandInfo();

  const NavItems = () => (
    <>
      {variant === 'main' && (
        <>
          <a 
            href="#features" 
            className="text-slate-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-slate-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
          >
            How It Works
          </a>
          <a 
            href="#support" 
            className="text-slate-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
          >
            Support
          </a>
        </>
      )}
      
      {variant === 'trader' && isAuthenticated && (
        <>
          <Link href="/trader/dashboard">
            <Button variant="ghost" className="text-slate-700 hover:text-primary">
              Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-700 hover:text-primary">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </>
      )}

      {variant === 'admin' && isAuthenticated && user?.role === 'admin' && (
        <>
          <Link href="/admin">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <Home className="h-4 w-4 mr-2" />
              Main Site
            </Button>
          </Link>
        </>
      )}
    </>
  );

  const UserMenu = () => {
    if (!isAuthenticated || !showAuthButtons) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} alt={user?.email} />
              <AvatarFallback>
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user?.firstName && (
                <p className="font-medium">{user.firstName}</p>
              )}
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          {user?.trader && (
            <DropdownMenuItem asChild>
              <Link href="/trader/dashboard">
                <ChartLine className="mr-2 h-4 w-4" />
                Trader Portal
              </Link>
            </DropdownMenuItem>
          )}
          {user?.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className={`border-b border-slate-200 sticky top-0 z-50 ${
      variant === 'admin' ? 'bg-slate-900' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <div className={`w-10 h-10 ${brandInfo.bgColor} rounded-lg flex items-center justify-center`}>
                    {brandInfo.icon}
                  </div>
                  <span className={`ml-3 text-xl font-bold ${
                    variant === 'admin' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {brandInfo.title}
                  </span>
                </div>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <NavItems />
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {showAuthButtons && (
              <>
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={handleLogin}
                      className={variant === 'admin' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-primary'}
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={handleLogin} 
                      className={variant === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`md:hidden ${
                    variant === 'admin' ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  <NavItems />
                  {showAuthButtons && !isAuthenticated && (
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <Button onClick={handleLogin} variant="outline">
                        Sign In
                      </Button>
                      <Button onClick={handleLogin} className="btn-primary">
                        Get Started
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
