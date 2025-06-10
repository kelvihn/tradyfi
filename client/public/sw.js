// public/sw.js
const CACHE_NAME = 'tradyfi-v1';

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker: Install event');
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activate event');
  
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Push event
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push event received');
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('Push notification data:', data);
  } catch (error) {
    console.error('Failed to parse push data:', error);
    // Fallback for text data
    data = {
      title: 'New Message',
      body: event.data.text() || 'You have a new message',
      icon: '/favicon.ico'
    };
  }

  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image,
    data: {
      url: data.url || '/',
      roomId: data.roomId,
      senderId: data.senderId,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ],
    requireInteraction: false, // Changed to false for better UX
    silent: false,
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification', // Prevents duplicate notifications
    renotify: true // Show notification even if tag exists
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Tradyfi.ng', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  
  if (event.action === 'close') {
    return;
  }

  // Determine the URL to open
  let url = data.url || '/';
  
  // If it's a chat notification, construct the proper chat URL
  if (data.roomId) {
    // Check if it's a trader dashboard or user chat
    url = window.location.hostname.includes('localhost') || window.location.hostname === 'yourdomain.com'
      ? `/trader/dashboard?tab=chats&room=${data.roomId}`
      : `/chat/${data.roomId}`;
  }

  console.log('Opening URL:', url);

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(function(clientList) {
      
      // Try to focus existing window with the app
      for (let client of clientList) {
        if (client.url.includes(window.location.host) || client.url.includes('localhost')) {
          console.log('Focusing existing client:', client.url);
          
          return client.focus().then(() => {
            // Send message to client to navigate to chat
            if (data.roomId) {
              client.postMessage({
                type: 'NAVIGATE_TO_CHAT',
                roomId: data.roomId,
                url: url
              });
            }
          });
        }
      }
      
      // Open new window if none found
      console.log('Opening new window with URL:', url);
      return clients.openWindow(url);
    }).catch(error => {
      console.error('Error handling notification click:', error);
    })
  );
});

// Listen for messages from clients
self.addEventListener('message', function(event) {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Service Worker: Push subscription changed');
  
  event.waitUntil(
    // Re-subscribe logic here if needed
    console.log('Push subscription change handled')
  );
});

// Error handling
self.addEventListener('error', function(event) {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('Service Worker unhandled rejection:', event.reason);
});