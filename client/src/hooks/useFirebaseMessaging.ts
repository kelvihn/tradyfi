// hooks/useFirebaseMessaging.ts
import { useState, useEffect } from 'react';
import { FCMService } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface FCMHook {
  token: string | null;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  subscribeToNotifications: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

interface UseFirebaseMessagingProps {
  userId: string;
  isTrader?: boolean;
}

export function useFirebaseMessaging({ userId, isTrader = false }: UseFirebaseMessagingProps): FCMHook {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if FCM is supported
        const supported = 
          'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window &&
          (window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname.includes('.localhost'));

        setIsSupported(supported);

        if (supported) {
          // Get existing token if available
          const existingToken = await FCMService.getToken();
          if (existingToken) {
            setToken(existingToken);
            // Send token to your server
            await saveTokenToServer(existingToken);
          }

          // Listen for foreground messages
          FCMService.onMessageListener().then((payload) => {
            console.log('Foreground message received:', payload);
            
            // Show toast notification when app is in foreground
            toast({
              title: payload.notification?.title || 'New Message',
              description: payload.notification?.body,
              action: payload.data?.chatRoomId ? {
                label: 'Open Chat',
                onClick: () => {
                  const chatRoomId = payload.data.chatRoomId;
                  if (isTrader) {
                    window.location.href = `/trader/dashboard?tab=chats&room=${chatRoomId}`;
                  } else {
                    window.location.href = `/chat/${chatRoomId}`;
                  }
                }
              } : undefined
            });
          });

          // Listen for navigation messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'NAVIGATE_TO_CHAT') {
              const chatRoomId = event.data.chatRoomId;
              if (isTrader) {
                window.location.href = `/trader/dashboard?tab=chats&room=${chatRoomId}`;
              } else {
                window.location.href = `/chat/${chatRoomId}`;
              }
            }
          });
        }
      } catch (err) {
        console.error('Error initializing FCM:', err);
        setError('Failed to initialize notifications');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isSupported, isTrader, toast]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      setError(null);
      const hasPermission = await FCMService.requestPermission();
      
      if (!hasPermission) {
        setError('Notification permission denied');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request permission');
      return false;
    }
  };

  const subscribeToNotifications = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupported) {
        setError('Notifications not supported');
        return false;
      }

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }

      const fcmToken = await FCMService.getToken();
      if (!fcmToken) {
        setError('Failed to get notification token');
        return false;
      }

      setToken(fcmToken);

      // Save token to your server
      const saved = await saveTokenToServer(fcmToken);
      if (!saved) {
        setError('Failed to save notification settings');
        return false;
      }

      // Subscribe to user-specific topic
      if (userId) {
        await FCMService.subscribeToTopic(fcmToken, `user_${userId}`);
        
        // Subscribe to trader-specific topic if applicable
        if (isTrader) {
          await FCMService.subscribeToTopic(fcmToken, `trader_${userId}`);
        }
      }

      // Send a test notification to verify everything works
      await sendTestNotification();

      return true;
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      setError('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (token) {
        // Unsubscribe from topics
        if (userId) {
          await FCMService.unsubscribeFromTopic(token, `user_${userId}`);
          if (isTrader) {
            await FCMService.unsubscribeFromTopic(token, `trader_${userId}`);
          }
        }

        // Remove token from server
        await removeTokenFromServer(token);
      }

      setToken(null);
      return true;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError('Failed to disable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to save token to server
  const saveTokenToServer = async (fcmToken: string): Promise<boolean> => {
    try {
      const authToken = isTrader 
        ? localStorage.getItem('token')
        : localStorage.getItem(`userToken_${window.location.hostname.split('.')[0]}`);

      const response = await fetch('/api/fcm/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          fcmToken,
          userId,
          userType: isTrader ? 'trader' : 'user'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving token to server:', error);
      return false;
    }
  };

  // Helper function to remove token from server
  const removeTokenFromServer = async (fcmToken: string): Promise<boolean> => {
    try {
      const authToken = isTrader 
        ? localStorage.getItem('token')
        : localStorage.getItem(`userToken_${window.location.hostname.split('.')[0]}`);

      const response = await fetch('/api/fcm/remove-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken })
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing token from server:', error);
      return false;
    }
  };

  // Helper function to send test notification
  const sendTestNotification = async (): Promise<void> => {
    try {
      const authToken = isTrader 
        ? localStorage.getItem('token')
        : localStorage.getItem(`userToken_${window.location.hostname.split('.')[0]}`);

      await fetch('/api/fcm/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.warn('Test notification failed (non-critical):', error);
    }
  };

  return {
    token,
    isSupported,
    isLoading,
    error,
    requestPermission,
    subscribeToNotifications,
    unsubscribe
  };
}