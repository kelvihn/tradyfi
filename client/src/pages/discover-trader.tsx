import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ExternalLink, Users, Search } from "lucide-react";

export default function DiscoverTraders() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  
  const { data: tradersData, isLoading } = useQuery({
    queryKey: ["traders", "discover", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      const response = await fetch(`/api/traders/discover?${params}`);
      if (!response.ok) throw new Error("Failed to fetch traders");
      return response.json();
    },
  });
  
  const visitTraderPortal = (subdomain: string) => {
    window.open(`http://${subdomain}.${window.location.hostname}`, '_blank');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Traders</h1>
        <p className="text-muted-foreground">Find and connect with verified traders on our platform</p>
      </div>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search traders by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading traders...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tradersData?.traders?.map((trader) => (
            <Card key={trader.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {trader.businessName}
                  <Badge variant="secondary">Verified</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {trader.profileDescription || "Professional trading services"}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {trader.userCount} users
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active
                  </Badge>
                </div>
                
                <Button 
                  onClick={() => visitTraderPortal(trader.subdomain)}
                  className="w-full"
                  variant="outline"
                >
                  Visit Portal
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {tradersData?.traders?.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No traders found matching your search.</p>
        </div>
      )}
    </div>
  );
}