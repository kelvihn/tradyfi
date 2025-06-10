import { useEffect, useState } from 'react';
import { getSubdomain, isMainDomain, isAdminDomain } from "@/lib/subdomain";

export function useSubdomainValidator() {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const subdomain = getSubdomain();

  useEffect(() => {
    const validate = async () => {
      // Main domain (tradyfi.ng or www.tradyfi.ng) is always valid
      if (isMainDomain()) {
        setValid(true);
        setLoading(false);
        return;
      }

      // Admin domain (admin.tradyfi.ng) is always valid
      if (isAdminDomain()) {
        setValid(true);
        setLoading(false);
        return;
      }

      // For trader subdomains, check if they exist
      if (!subdomain) {
        setValid(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/trader/check-domain-validity/${subdomain}`);
        const data = await res.json();
        const exists = data.available === true;
        setValid(exists);
      } catch (err) {
        console.error('Subdomain check failed:', err);
        setValid(false);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [subdomain]);

  return { loading, valid };
}