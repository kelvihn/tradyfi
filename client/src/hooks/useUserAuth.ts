import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getSubdomain } from "@/lib/subdomain";

export function useUserAuth() {
  const [hasToken, setHasToken] = useState(false);
  const subdomain = getSubdomain();

  useEffect(() => {
    // Check for subdomain-specific token
    const token = localStorage.getItem(`userToken_${subdomain}`);
    setHasToken(!!token);
  }, [subdomain]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user", subdomain],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasToken, // Only fetch if token exists
    queryFn: async () => {
      // Get subdomain-specific token
      const token = localStorage.getItem(`userToken_${subdomain}`);
      if (!token) {
        return null;
      }
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`, // Your authenticate middleware should handle this
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear subdomain-specific token
          localStorage.removeItem(`userToken_${subdomain}`);
          localStorage.removeItem(`userData_${subdomain}`);
          setHasToken(false);
          return null;
        }
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    token: localStorage.getItem(`userToken_${subdomain}`),
  };
}