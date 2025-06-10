// Domain utilities for trader portal routing

export function getBaseDomain(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export function getTraderPortalUrl(subdomain: string): string {
  const baseDomain = getBaseDomain();
  return `${baseDomain}/trader/${subdomain}`;
}

export function getTraderLoginUrl(subdomain: string): string {
  const baseDomain = getBaseDomain();
  return `${baseDomain}/trader/${subdomain}/login`;
}

export function extractTraderSubdomain(pathname: string): string | null {
  const match = pathname.match(/^\/trader\/([^\/]+)/);
  if (!match) return null;
  
  const subdomain = match[1];
  
  // Exclude system routes from being treated as trader subdomains
  const systemRoutes = ['dashboard', 'register', 'profile', 'login'];
  if (systemRoutes.includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}

export function isTraderPortalRoute(pathname: string): boolean {
  return pathname.startsWith('/trader/');
}