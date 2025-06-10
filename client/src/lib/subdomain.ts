export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // For local development (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for subdomain simulation via query parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');
    if (subdomainParam) {
      localStorage.setItem('dev-subdomain', subdomainParam);
      return subdomainParam;
    }
    
    const storedSubdomain = localStorage.getItem('dev-subdomain');
    if (storedSubdomain) {
      return storedSubdomain;
    }
    
    return null;
  }
  
  // For Replit domains (replit.app, replit.dev, etc) - treat as main domain
  if (hostname.includes('replit.app') || hostname.includes('replit.dev') || hostname.includes('replit.com')) {
    return null;
  }
  
  // For production (tradyfi domain) - updated from besttrades
  const parts = hostname.split('.');
  
  // If it's just tradyfi.ng or www.tradyfi.ng, no subdomain
  if ((parts.length === 3 && parts[0] === 'www')) {
    return null;
  }
  
  // Return the first part as subdomain
  return parts[0];
}

export function isMainDomain(): boolean {
  const subdomain = getSubdomain();
  return !subdomain || subdomain === 'www';
}

export function isAdminDomain(): boolean {
  const subdomain = getSubdomain();
  return subdomain === 'admin';
}

export function isTraderDomain(): boolean {
  const subdomain = getSubdomain();
  return !!subdomain && subdomain !== 'www' && subdomain !== 'admin';
}

export function getMainDomainUrl(): string {
  if (typeof window === 'undefined') return '';
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}`;
  }
  
  // For production
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.');
    return `${protocol}//${domain}`;
  }
  
  return `${protocol}//${hostname}`;
}

export function getTraderPortalUrl(subdomain: string): string {
  if (typeof window === 'undefined') return '';
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}?subdomain=${subdomain}`;
  }
  
  // For production
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.');
    return `${protocol}//${subdomain}.${domain}`;
  }
  
  return `${protocol}//${subdomain}.${hostname}`;
}
