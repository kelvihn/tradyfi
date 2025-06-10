import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  userId: string;
  isTrader?: boolean;
}

export function NotificationSettings({ userId, isTrader = false }: NotificationSettingsProps) {
  const { toast } = useToast();
  const {
    isSupported,
    permission,
    subscription,
    enableNotifications,
    unsubscribe
  } = usePushNotifications({ userId, isTrader });

  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await enableNotifications();
      if (success) {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for new messages.",
        });
      } else {
        toast({
          title: "Failed to Enable Notifications",
          description: "Please check your browser settings and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
      toast({
        title: "Notifications Disabled",
        description: "You'll no longer receive push notifications.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellOff className="h-5 w-5 mr-2" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in your browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (permission === 'denied') {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (subscription) {
      return <Badge variant="default">Enabled</Badge>;
    }
    return <Badge variant="secondary">Disabled</Badge>;
  };

  const getStatusMessage = () => {
    if (permission === 'denied') {
      return "Notifications are blocked. Please enable them in your browser settings.";
    }
    if (subscription) {
      return "You'll receive notifications for new messages.";
    }
    return "Enable notifications to get alerts for new messages.";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Push Notifications
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </p>
        
        <div className="flex gap-2">
          {!subscription && permission !== 'denied' && (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isLoading}
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          )}
          
          {subscription && (
            <Button 
              variant="outline"
              onClick={handleDisableNotifications}
              disabled={isLoading}
            >
              {isLoading ? 'Disabling...' : 'Disable Notifications'}
            </Button>
          )}
          
          {permission === 'denied' && (
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Enable in Browser Settings",
                  description: "Go to your browser settings and allow notifications for this site.",
                });
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Browser Settings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}