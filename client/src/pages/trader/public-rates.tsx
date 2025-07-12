import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MessageCircle, Clock, DollarSign, ExternalLink } from "lucide-react";

interface TraderRate {
  id: number;
  currency: string;
  type: 'crypto' | 'giftcard';
  ratePerDollar: string;
  currencySymbol: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TraderInfo {
  id: number;
  businessName: string;
  subdomain: string;
}

interface RatesData {
  trader: TraderInfo;
  rates: {
    crypto: TraderRate[];
    giftcard: TraderRate[];
  };
  lastUpdated: string | null;
}

interface PublicTraderRatesProps {
  subdomain: string;
}

export default function PublicTraderRates({ subdomain }: PublicTraderRatesProps) {
  const [ratesData, setRatesData] = useState<RatesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
  }, [subdomain]);

  const fetchRates = async () => {
    try {
      const response = await fetch(`/api/trader/${subdomain}/rates`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Trader not found");
        } else if (response.status === 403) {
          setError("This trader portal is not active");
        } else {
          setError("Failed to load rates");
        }
        return;
      }

      const data = await response.json();
      setRatesData(data);
    } catch (error) {
      console.error("Error fetching rates:", error);
      setError("Failed to load rates");
    } finally {
      setIsLoading(false);
    }
  };

  const formatRate = (rate: TraderRate) => {
    const rateValue = parseFloat(rate.ratePerDollar);
    return {
      formattedRate: rateValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }),
      symbol: rate.currencySymbol || (rate.type === 'giftcard' ? 'NGN' : rate.currency),
    };
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Rates Unavailable</h1>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Main Site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ratesData) {
    return null;
  }

  const { trader, rates, lastUpdated } = ratesData;
  const totalRates = rates.crypto.length + rates.giftcard.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white h-5 w-5" />
              </div>
              <div className="ml-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900">{trader.businessName}</div>
                <div className="text-xs text-slate-600">Current Trading Rates</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {lastUpdated && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatLastUpdated(lastUpdated)}</span>
                </div>
              )}
              <Button 
                onClick={() => window.location.href = `/`}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
            Current Trading Rates
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
            View our real-time exchange rates for cryptocurrencies and gift cards. 
            All rates are updated regularly to reflect current market conditions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rates</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRates}</div>
              <p className="text-xs text-slate-500">Available currencies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cryptocurrency</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rates.crypto.length}</div>
              <p className="text-xs text-slate-500">Crypto options</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gift Cards</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rates.giftcard.length}</div>
              <p className="text-xs text-slate-500">Gift card types</p>
            </CardContent>
          </Card>
        </div>

        {totalRates === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Rates Available</h3>
              <p className="text-slate-500 mb-6">
                This trader hasn't published any rates yet. Please check back later or contact them directly.
              </p>
              <Button 
                onClick={() => window.location.href = `/`}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Trader
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Cryptocurrency Rates */}
            {rates.crypto.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Cryptocurrency Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {rates.crypto.map((rate) => {
                      const { formattedRate, symbol } = formatRate(rate);
                      return (
                        <div key={rate.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-1 sm:space-y-0">
                            <div className="font-semibold text-base sm:text-lg">{rate.currency}</div>
                            <Badge className="bg-green-100 text-green-800 w-fit">
                              Crypto
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-1">
                            <strong>1 USD = {formattedRate} {symbol}</strong>
                          </div>
                          <div className="text-xs text-slate-500">
                            <strong>Updated: {formatLastUpdated(rate.updatedAt)}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gift Card Rates */}
            {rates.giftcard.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                    Gift Card Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {rates.giftcard.map((rate) => {
                      const { formattedRate, symbol } = formatRate(rate);
                      return (
                        <div key={rate.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-1 sm:space-y-0">
                            <div className="font-semibold text-base sm:text-lg">{rate.currency}</div>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 w-fit">
                              Gift Card
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-1">
                            <strong>1 USD = {formattedRate} {symbol}</strong>
                          </div>
                          <div className="text-xs text-slate-500">
                            <strong>Updated: {formatLastUpdated(rate.updatedAt)}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-6 sm:mt-8">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Ready to Trade?
            </h3>
            <p className="text-slate-600 mb-4 text-sm sm:text-base">
              Contact {trader.businessName} to start your transaction with these current rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = `/`}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = `https://${trader.subdomain}.tradyfi.ng`}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Trader Portal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-800">
              <strong>Disclaimer:</strong> Rates are subject to change and may vary based on transaction amount, 
              market conditions, and other factors. Please confirm current rates with the trader before proceeding 
              with any transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}