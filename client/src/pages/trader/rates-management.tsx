import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, DollarSign, ArrowLeft, TrendingUp } from "lucide-react";

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

export default function TraderRatesManagement() {
  const [rates, setRates] = useState<TraderRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TraderRate | null>(null);
  const [formData, setFormData] = useState({
    currency: '',
    type: 'crypto' as 'crypto' | 'giftcard',
    ratePerDollar: '',
    currencySymbol: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple alert function for showing messages
  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(`Success: ${message}`);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trader/rates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRates(data);
      } else {
        showAlert("Failed to fetch rates", 'error');
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      showAlert("Failed to fetch rates", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.currency || !formData.ratePerDollar) {
      showAlert("Please fill in all required fields", 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingRate ? `/api/trader/rates/${editingRate.id}` : '/api/trader/rates';
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlert(editingRate ? "Rate updated successfully" : "Rate created successfully");
        
        setIsDialogOpen(false);
        setEditingRate(null);
        setFormData({
          currency: '',
          type: 'crypto',
          ratePerDollar: '',
          currencySymbol: '',
        });
        fetchRates();
      } else {
        const error = await response.json();
        showAlert(error.message || "Failed to save rate", 'error');
      }
    } catch (error) {
      console.error("Error saving rate:", error);
      showAlert("Failed to save rate", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rate: TraderRate) => {
    setEditingRate(rate);
    setFormData({
      currency: rate.currency,
      type: rate.type,
      ratePerDollar: rate.ratePerDollar,
      currencySymbol: rate.currencySymbol || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (rateId: number) => {
    if (!confirm('Are you sure you want to delete this rate?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trader/rates/${rateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showAlert("Rate deleted successfully");
        fetchRates();
      } else {
        showAlert("Failed to delete rate", 'error');
      }
    } catch (error) {
      console.error("Error deleting rate:", error);
      showAlert("Failed to delete rate", 'error');
    }
  };

  const resetForm = () => {
    setEditingRate(null);
    setFormData({
      currency: '',
      type: 'crypto',
      ratePerDollar: '',
      currencySymbol: '',
    });
  };

  const formatRateDisplay = (rate: TraderRate) => {
    const rateValue = parseFloat(rate.ratePerDollar);
    const formattedRate = rateValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
    
    if (rate.type === 'crypto') {
      // For crypto: show "1 ETH = 3,000 USD" (flip the display)
      return `1 ${rate.currency} = ${formattedRate} ${rate.currencySymbol || 'USD'}`;
    } else {
      // For giftcards: keep "1 USD = 1,650 NGN" (original format)
      return `1 USD = ${formattedRate} ${rate.currencySymbol || 'NGN'}`;
    }
  };

  const cryptoRates = rates.filter(rate => rate.type === 'crypto');
  const giftcardRates = rates.filter(rate => rate.type === 'giftcard');

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/trader/dashboard'}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Manage Rates</h1>
                <p className="text-slate-600">Set your trading rates for crypto and gift cards</p>
              </div>
            </div>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Rate
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rates</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crypto Rates</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cryptoRates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gift Card Rates</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{giftcardRates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Modal */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingRate ? 'Edit Rate' : 'Add New Rate'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency">Currency/Item Name</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="e.g., USDT, BTC, Amazon, iTunes"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'crypto' | 'giftcard' }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="crypto">Cryptocurrency</option>
                    <option value="giftcard">Gift Card</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="ratePerDollar">Rate per USD</Label>
                  <Input
                    id="ratePerDollar"
                    type="number"
                    step="0.00000001"
                    value={formData.ratePerDollar}
                    onChange={(e) => setFormData(prev => ({ ...prev, ratePerDollar: e.target.value }))}
                    placeholder="e.g., 1650.50"
                  />
                </div>

                <div>
                  <Label htmlFor="currencySymbol">Currency Symbol (Optional)</Label>
                  <Input
                    id="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                    placeholder="e.g., NGN, USD"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    className="flex-1"
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Saving..." : editingRate ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crypto Rates Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cryptocurrency Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {cryptoRates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No cryptocurrency rates set yet. Add your first crypto rate to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {cryptoRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium text-lg">{rate.currency}</div>
                      <div className="text-sm text-slate-600">
                        <strong>{formatRateDisplay(rate)}</strong>
                      </div>
                      <div className="text-xs text-slate-500">
                        <strong>Updated: {new Date(rate.updatedAt).toLocaleString()}</strong>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">Crypto</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gift Card Rates Section */}
        <Card>
          <CardHeader>
            <CardTitle>Gift Card Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {giftcardRates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No gift card rates set yet. Add your first gift card rate to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {giftcardRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium text-lg">{rate.currency}</div>
                      <div className="text-sm text-slate-600">
                        <strong>{formatRateDisplay(rate)}</strong>
                      </div>
                      <div className="text-xs text-slate-500">
                        <strong>Updated: {new Date(rate.updatedAt).toLocaleString()}</strong>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">Gift Card</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}