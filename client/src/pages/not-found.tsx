import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            404 - Page Not Found
          </CardTitle>
          <CardDescription className="text-slate-600">
            The page you're looking for doesn't exist or you don't have permission to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Possible reasons:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• The URL is incorrect or has been changed</li>
              <li>• You need to log in to access this page</li>
              <li>• You don't have the required permissions</li>
              <li>• The resource has been moved or deleted</li>
            </ul>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button 
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}