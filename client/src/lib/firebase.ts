// lib/firebase.ts - Client-side Firebase configuration
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
        apiKey: "AIzaSyDgx2tSSFytVldct36PLY-FjsUxNnggBRk",
        authDomain: "tradyfi-notifications.firebaseapp.com",
        projectId: "tradyfi-notifications",
        storageBucket: "tradyfi-notifications.firebasestorage.app",
        messagingSenderId: "1062736625197",
        appId: "1:1062736625197:web:8eafe0d33f54d923ac82a4"
    };;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: any = null;

try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.log('Firebase messaging not supported:', error);
}

export { messaging };

// Firebase Cloud Messaging Service
export class FCMService {
  
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.log('Messaging not initialized');
        return null;
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Permission not granted');
        return null;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        console.log('FCM registration token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  static onMessageListener(): Promise<MessagePayload> {
    return new Promise((resolve) => {
      if (!messaging) {
        console.log('Messaging not initialized');
        return;
      }

      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        resolve(payload);
      });
    });
  }

  static async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/fcm/subscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token, topic })
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  static async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/fcm/unsubscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token, topic })
      });

      return response.ok;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }
}