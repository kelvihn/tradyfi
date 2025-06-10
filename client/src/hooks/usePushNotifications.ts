// hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react';

interface UsePushNotificationsProps {
  userId: string;
  isTrader?: boolean;
}

export function usePushNotifications({ userId, isTrader = false }: UsePushNotificationsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 
                 'PushManager' in window && 
                 'Notification' in window &&
                 (window.location.protocol === 'https:' || 
                  window.location.hostname === 'localhost' ||
                  window.location.hostname.includes('.localhost'));
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }

      console.log('Push notifications supported:', supported);
      console.log('Current permission:', Notification.permission);
    };

    checkSupport();
  }, []);

  // Register service worker on mount
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!isSupported) {
        console.log('Push notifications not supported, skipping service worker registration');
        return;
      }

      try {
        console.log('Attempting to register service worker...');
        
        // First, check if there's already a registration
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        
        if (existingRegistration) {
          console.log('Existing service worker found:', existingRegistration);
          setRegistration(existingRegistration);
          
          // Check for existing subscription
          const existingSubscription = await existingRegistration.pushManager.getSubscription();
          if (existingSubscription) {
            console.log('Existing push subscription found:', existingSubscription);
            setSubscription(existingSubscription);
          }
        } else {
          console.log('No existing service worker, registering new one...');
          
          const newRegistration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none' // Always check for updates
          });

          console.log('Service worker registered successfully:', newRegistration);
          setRegistration(newRegistration);

          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('Service worker is ready');
        }

      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  const enableNotifications = useCallback(async () => {
    console.log('enableNotifications called');
    console.log('isSupported:', isSupported);
    console.log('current registration:', registration);
    console.log('current permission:', permission);

    if (!isSupported) {
      console.error('Push notifications not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Step 1: Request permission
      console.log('Requesting notification permission...');
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      console.log('Permission result:', newPermission);

      if (newPermission !== 'granted') {
        console.error('Notification permission denied:', newPermission);
        return false;
      }

      // Step 2: Ensure service worker is registered and ready
      let currentRegistration = registration;
      
      if (!currentRegistration) {
        console.log('No registration found, attempting to register service worker...');
        try {
          currentRegistration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          setRegistration(currentRegistration);
          console.log('Service worker registered:', currentRegistration);
        } catch (swError) {
          console.error('Failed to register service worker:', swError);
          throw new Error(`Service worker registration failed: ${swError.message}`);
        }
      }

      // Step 3: Wait for service worker to be ready
      console.log('Waiting for service worker to be ready...');
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('Service worker ready:', readyRegistration);

      // Step 4: Check if we already have a subscription
      const existingSubscription = await readyRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Found existing subscription, using it:', existingSubscription);
        setSubscription(existingSubscription);
        
        // Still try to send to server in case it wasn't saved before
        try {
          await sendSubscriptionToServer(existingSubscription);
        } catch (serverError) {
          console.warn('Failed to update subscription on server:', serverError);
        }
        
        return true;
      }

      // Step 5: Create new push subscription
      console.log('Creating new push subscription...');
      
      // Check if VAPID key is available
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
      console.log('Using VAPID key:', vapidKey ? 'Available' : 'Missing');
      
      if (!vapidKey) {
        throw new Error('VAPID public key not configured');
      }

      const newSubscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      console.log('Push subscription created:', newSubscription);
      setSubscription(newSubscription);

      // Step 6: Send subscription to server
      await sendSubscriptionToServer(newSubscription);

      console.log('Push notification setup completed successfully');
      return true;

    } catch (error) {
      console.error('Error enabling notifications:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to enable notifications. ';
      
      if (error instanceof Error) {
        if (error.message.includes('VAPID')) {
          userMessage += 'Configuration error. Please contact support.';
        } else if (error.message.includes('Service worker')) {
          userMessage += 'Failed to setup background service. Please try refreshing the page.';
        } else if (error.message.includes('subscribe')) {
          userMessage += 'Failed to subscribe to notifications. Please check your browser settings.';
        } else {
          userMessage += 'Please try again or check your browser settings.';
        }
      }
      
      // You might want to show this to the user via a toast/alert
      console.error('User-friendly error:', userMessage);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, registration, permission, userId, isTrader]);

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    console.log('Sending subscription to server...');
    
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? arrayBufferToBase64(subscription.getKey('p256dh')!) : '',
            auth: subscription.getKey('auth') ? arrayBufferToBase64(subscription.getKey('auth')!) : ''
          }
        },
        userId,
        userType: isTrader ? 'trader' : 'user'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    console.log('Subscription saved to server successfully');
  };

  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      console.log('No subscription to unsubscribe from');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Unsubscribing from push notifications...');
      
      // Unsubscribe from push manager
      await subscription.unsubscribe();
      console.log('Unsubscribed from push manager');

      // Remove from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint
        })
      });

      setSubscription(null);
      console.log('Push notification unsubscribed successfully');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, userId]);

  // Helper function to get auth token
  const getToken = () => {
    if (isTrader) {
      return localStorage.getItem('token');
    } else {
      // For users, token might be subdomain-specific
      const subdomain = window.location.hostname.split('.')[0];
      return localStorage.getItem(`userToken_${subdomain}`);
    }
  };

  return {
    isSupported,
    permission,
    subscription: !!subscription,
    isLoading,
    enableNotifications,
    unsubscribe,
    registration: !!registration
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}