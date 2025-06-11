// public/firebase-messaging-sw.js - Dynamic config version

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Get Firebase config from a dedicated endpoint
let firebaseConfig = null;

// Try to get config from server
self.addEventListener('install', async (event) => {
  console.log('🔥 Firebase Service Worker installing...');
  
  try {
    // Fetch config from your server
    const response = await fetch('/api/firebase-config');
    if (response.ok) {
      firebaseConfig = await response.json();
      console.log('✅ Firebase config loaded from server');
    } else {
      throw new Error('Failed to fetch Firebase config');
    }
  } catch (error) {
    console.error('❌ Failed to load Firebase config, using fallback:', error);
    // Fallback config (replace with your actual values)
    firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
        };
  }
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized in service worker');
  
  self.skipWaiting();
});

// Initialize messaging after Firebase is ready
let messaging = null;

self.addEventListener('activate', (event) => {
  console.log('🔥 Firebase Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        messaging = firebase.messaging();
        console.log('🔥 Firebase messaging ready');
        
        // Set up background message handler
        messaging.onBackgroundMessage((payload) => {
          console.log('🔥 Firebase background message received:', payload);

          const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
          const notificationOptions = {
            body: payload.notification?.body || payload.data?.body || 'You have a new message',
            icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: payload.data?.tag || 'default',
            data: payload.data || {},
            actions: [
              {
                action: 'open',
                title: 'Open Chat'
              },
              {
                action: 'close', 
                title: 'Dismiss'
              }
            ],
            requireInteraction: true,
            vibrate: [200, 100, 200],
            silent: false
          };

          console.log('🔥 Showing Firebase notification:', notificationTitle);
          return self.registration.showNotification(notificationTitle, notificationOptions);
        });
        
      } catch (error) {
        console.error('❌ Error setting up Firebase messaging:', error);
      }
      
      await clients.claim();
    })()
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔥 Firebase notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'close') {
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            if (data.chatRoomId) {
              // Send message to client to navigate
              client.postMessage({
                type: 'NAVIGATE_TO_CHAT',
                chatRoomId: data.chatRoomId,
                url: data.clickAction || '/'
              });
            }
            return client.focus();
          }
        }
        
        // Open new window
        let url = self.location.origin;
        if (data.chatRoomId) {
          // Determine if this is trader or user portal
          if (data.isTrader === 'true' || self.location.hostname === 'tradyfi.ng') {
            url += `/trader/dashboard?tab=chats&room=${data.chatRoomId}`;
          } else {
            url += `/chat/${data.chatRoomId}`;
          }
        } else if (data.clickAction) {
          url = data.clickAction;
        }
        
        console.log('🔥 Opening Firebase notification URL:', url);
        return clients.openWindow(url);
      })
  );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('🔥 Firebase Service Worker message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});