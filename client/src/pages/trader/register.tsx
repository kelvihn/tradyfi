import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, Building, Phone, CreditCard, FileText, Upload } from "lucide-react";

export default function TraderRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactInfo: '',
    documentType: '',
    documentFile: null as File | null,
    profileDescription: '',
    subdomain: ''
  });

  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: ""
  });

  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Get existing trader data to pre-fill form
  const { data: trader, isLoading } = useQuery({
    queryKey: ["/api/trader/status"],
    enabled: !!user,
  });

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: null, message: "" });
      return;
    }

    setSubdomainStatus({ checking: true, available: null, message: "Checking availability..." });

    try {
      const response = await fetch(`/api/trader/check-subdomain/${subdomain.toLowerCase()}`);
      const result = await response.json();
      setSubdomainStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    } catch (error) {
      setSubdomainStatus({
        checking: false,
        available: false,
        message: "Error checking availability"
      });
    }
  };

  // Handle file upload to Cloudinary
  const handleFileUpload = async (file: File) => {
    if (!file) return null;
    
    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      // Get auth token for the request
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        const uploadedFile = data.files[0];
        return {
          url: uploadedFile.url,
          publicId: uploadedFile.public_id
        };
      } else {
        throw new Error('No file uploaded');
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/trader/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Verification Submitted",
        description: "Your verification details have been submitted. You will be notified once reviewed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trader/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.contactInfo || !formData.documentType || !formData.documentFile || !formData.subdomain) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including document upload.",
        variant: "destructive",
      });
      return;
    }

    if (subdomainStatus.available !== true) {
      toast({
        title: "Invalid Subdomain",
        description: "Please choose an available subdomain before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload document first
      const documentData = await handleFileUpload(formData.documentFile);
      
      if (!documentData) {
        throw new Error('Failed to upload document');
      }
      
      // Then submit form with document URL
      const submitData = {
        businessName: formData.businessName,
        contactInfo: formData.contactInfo,
        documentType: formData.documentType,
        documentUrl: documentData.url,
        documentPublicId: documentData.publicId,
        profileDescription: formData.profileDescription,
        subdomain: formData.subdomain
      };
      
      mutation.mutate(submitData);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof Omit<typeof formData, 'documentFile'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image (JPG, PNG, GIF, WEBP) or PDF file.",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }

      setFormData(prev => ({ ...prev, documentFile: file }));
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'national_id':
        return 'National ID Card';
      case 'drivers_license':
        return "Driver's License";
      case 'international_passport':
        return 'International Passport';
      default:
        return 'selected document';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading verification form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-slate-900">Start Verification</h1>
          <p className="text-slate-600 mt-2">
            Complete your business verification to access all trader features and get your personalized trading portal.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-6 w-6 text-primary mr-2" />
              Business Information
            </CardTitle>
            <CardDescription>
              Provide your business details for verification. All information will be reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Enter your business or trading name"
                  value={formData.businessName}
                  onChange={handleInputChange('businessName')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Information (Whatsapp number)*
                </Label>
                <Input
                  id="contactInfo"
                  type="tel"
                  placeholder="Phone number"
                  value={formData.contactInfo}
                  onChange={handleInputChange('contactInfo')}
                  onInput={(e: any) => {
                    // Remove any non-digit characters and limit to 11 digits
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  }}
                  maxLength={11}
                  pattern="[0-9]{11}"
                  required
                />
              </div>

              {/* Document Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="documentType" className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Document Type *
                </Label>
                <select
                  id="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange('documentType')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  required
                >
                  <option value="">Select document type</option>
                  <option value="national_id">National ID Card</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="international_passport">International Passport</option>
                </select>
                <p className="text-sm text-slate-500">
                  Select the type of government-issued document you're uploading.
                </p>
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="documentFile" className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document *
                </Label>
                <Input
                  id="documentFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  required
                />
                <p className="text-sm text-slate-500">
                  Upload a clear photo or scan of your {getDocumentTypeLabel(formData.documentType)}. 
                  Accepted formats: JPG, PNG, GIF, WEBP, PDF. Max size: 10MB.
                </p>
                {formData.documentFile && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>{formData.documentFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(formData.documentFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Choose Your Subdomain *
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="yourname"
                    value={formData.subdomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData(prev => ({ ...prev, subdomain: value }));
                      if (value.length >= 3) {
                        checkSubdomainAvailability(value);
                      } else {
                        setSubdomainStatus({ checking: false, available: null, message: "" });
                      }
                    }}
                    className={`flex-1 ${
                      subdomainStatus.available === true ? 'border-green-500' : 
                      subdomainStatus.available === false ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <span className="text-sm text-slate-600">.tradyfi.ng</span>
                </div>
                {subdomainStatus.checking && (
                  <p className="text-xs text-blue-600 mt-1">Checking availability...</p>
                )}
                {subdomainStatus.available === true && (
                  <p className="text-xs text-green-600 mt-1">✓ {subdomainStatus.message}</p>
                )}
                {subdomainStatus.available === false && (
                  <p className="text-xs text-red-600 mt-1">✗ {subdomainStatus.message}</p>
                )}
                <p className="text-sm text-slate-500">
                  This will be your personalized trading portal URL. Choose carefully as it cannot be changed later.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileDescription" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Trading Profile Description
                </Label>
                <Textarea
                  id="profileDescription"
                  placeholder="Describe your trading experience, specialties, or services (optional)"
                  value={formData.profileDescription}
                  onChange={handleInputChange('profileDescription')}
                  rows={4}
                />
                <p className="text-sm text-slate-500">
                  This will be displayed on your public trading portal.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending || uploadingDocument}
                >
                  {uploadingDocument ? "Uploading Document..." : 
                   mutation.isPending ? "Submitting..." : 
                   "Submit for Verification"}
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your information will be reviewed by our verification team</li>
                  <li>• We'll verify your document and business details</li>
                  <li>• Once approved, you'll get your personalized trading portal</li>
                  <li>• Verification typically takes 1-3 business days</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}