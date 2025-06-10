// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSubdomain } from '@/lib/subdomain';

interface UseWebSocketProps {
  roomId: number;
  userId: string;
  onMessage: (message: any) => void;
  onTyping: (isTyping: boolean, senderId: string) => void;
  onUserOnline?: (userId: string, isOnline: boolean) => void;
  onMessageRead?: (messageId: number, readBy: string) => void;
  isTrader?: boolean; // Add this flag
}

export function useWebSocket({
  roomId,
  userId,
  onMessage,
  onTyping,
  onUserOnline,
  onMessageRead,
  isTrader = false // Default to false for portal users
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const subdomain = getSubdomain();

  useEffect(() => {
    // Get the appropriate token based on user type
    const token = isTrader 
      ? localStorage.getItem('token') // Main domain token for traders
      : localStorage.getItem(`userToken_${subdomain}`); // Subdomain token for portal users
    
    console.log('WebSocket: isTrader?', isTrader);
    console.log('WebSocket: Token exists?', !!token);
    console.log('WebSocket: Subdomain:', subdomain);
    
    if (!token) {
      console.log('No token found for WebSocket connection');
      return;
    }

    // Use import.meta.env instead of process.env for Vite
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    console.log('Connecting to WebSocket:', socketUrl);

    // Initialize socket connection
    const socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'] // Allow fallback to polling
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      
      // Join the chat room
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Message handlers
    socket.on('new_message', (message) => {
        console.log('🔔 RECEIVED new_message event:', message);
      console.log('Current user ID:', userId);
      console.log('Message sender ID:', message.senderId)
      console.log('Received new message:', message);
      onMessage(message);
    });

    socket.on('user_typing', ({ userId: typingUserId, isTyping }) => {
      if (typingUserId !== userId) {
        onTyping(isTyping, typingUserId);
      }
    });

    socket.on('user_online', ({ userId: onlineUserId, isOnline }) => {
      if (onUserOnline) {
        onUserOnline(onlineUserId, isOnline);
      }
    });

    socket.on('message_read', ({ messageId, readBy }) => {
      if (onMessageRead && readBy !== userId) {
        onMessageRead(messageId, readBy);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave_room', roomId);
        socket.disconnect();
      }
    };
  }, [roomId, userId, subdomain, isTrader, onMessage, onTyping, onUserOnline, onMessageRead]);

  // Send message function
  const sendMessage = (message: string, senderName: string, isTrader: boolean, attachments?: any[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        roomId,
        message,
        senderName,
        isTrader,
        attachments
      });
    }
  };

  // Send typing status
  const sendTypingStatus = (isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      if (isTyping) {
        socketRef.current.emit('typing_start', { roomId });
      } else {
        socketRef.current.emit('typing_stop', { roomId });
      }
    }
  };

  // Mark message as read
  const markMessageAsRead = (messageId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_message_read', { roomId, messageId });
    }
  };

  return {
    isConnected,
    sendMessage,
    sendTypingStatus,
    markMessageAsRead
  };
}