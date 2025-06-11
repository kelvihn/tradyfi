// server/websocket.js - Updated with Firebase FCM integration
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      console.log(`User ${socket.userId} connected to WebSocket`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} for user: ${socket.userId}`);

    // Join chat room
    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`User ${socket.userId} joined room ${roomId}`);
      
      // Notify others in the room that user is online
      socket.to(`room_${roomId}`).emit('user_online', {
        userId: socket.userId,
        isOnline: true
      });
    });

    // Leave chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      console.log(`User ${socket.userId} left room ${roomId}`);
      
      // Notify others in the room that user is offline
      socket.to(`room_${roomId}`).emit('user_online', {
        userId: socket.userId,
        isOnline: false
      });
    });

    // Handle new message with Firebase FCM integration
    socket.on('send_message', async (data) => {
      const { roomId, message, senderName, isTrader, attachments } = data;
      
      console.log('=== MESSAGE RECEIVED ===');
      console.log('From user:', socket.userId);
      console.log('Room:', roomId);
      console.log('Message:', message);
      console.log('Sender name:', senderName);
      console.log('Is trader:', isTrader);
      console.log('=======================');
      
      try {
        // First, save the message to database
        const savedMessage = await saveMessageToDatabase({
          chatRoomId: roomId,
          senderId: socket.userId,
          message,
          attachments
        });
        
        // Enhanced broadcast data with saved message ID
        const broadcastData = {
          id: savedMessage.id,
          senderId: socket.userId,
          senderName,
          content: message,
          timestamp: savedMessage.createdAt || new Date().toISOString(),
          isTrader,
          attachments: attachments || [],
          isRead: false
        };
        
        console.log('📡 Broadcasting to WebSocket clients in room_' + roomId);
        
        // Get all sockets in the room to check who's online
        const socketsInRoom = await io.in(`room_${roomId}`).fetchSockets();
        const onlineUserIds = socketsInRoom.map(s => s.userId);
        
        console.log('👥 Online users in room:', onlineUserIds);
        
        // Broadcast to WebSocket clients in the room
        socket.to(`room_${roomId}`).emit('new_message', broadcastData);
        console.log('✅ Message broadcasted via WebSocket');
        
        // Send Firebase push notifications to offline users
        await sendFirebasePushNotification({
          roomId,
          senderId: socket.userId,
          senderName,
          message,
          isTrader,
          onlineUserIds // Pass online users to avoid sending push to them
        });
        
      } catch (error) {
        console.error('❌ Error handling message:', error);
        
        // Still broadcast via WebSocket even if push notification fails
        const fallbackData = {
          id: Date.now(),
          senderId: socket.userId,
          senderName,
          content: message,
          timestamp: new Date().toISOString(),
          isTrader,
          attachments: attachments || [],
          isRead: false
        };
        
        socket.to(`room_${roomId}`).emit('new_message', fallbackData);
      }
    });

    // Handle typing status
    socket.on('typing_start', (data) => {
      socket.to(`room_${data.roomId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`room_${data.roomId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle message read status
    socket.on('mark_message_read', (data) => {
      const { roomId, messageId } = data;
      
      // Broadcast read status to sender
      socket.to(`room_${roomId}`).emit('message_read', {
        messageId,
        readBy: socket.userId,
        readAt: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} for user: ${socket.userId}`);
    });
  });

  return io;
}

// Helper function to save message to database
async function saveMessageToDatabase({ chatRoomId, senderId, message, attachments }) {
  try {
    const { storage } = await import('./storage.js');
    
    const savedMessage = await storage.createChatMessage({
      chatRoomId,
      senderId,
      message,
      attachments: attachments ? JSON.stringify(attachments) : null
    });
    
    console.log('💾 Message saved to database:', savedMessage.id);
    return savedMessage;
  } catch (error) {
    console.error('❌ Error saving message to database:', error);
    throw error;
  }
}

// Enhanced Firebase push notification logic
async function sendFirebasePushNotification({ 
  roomId, 
  senderId, 
  senderName, 
  message, 
  isTrader,
  onlineUserIds = []
}) {
  try {
    console.log('🔥 Preparing Firebase push notifications for new message...');
    
    // Import required modules
    const { storage } = await import('./storage.js');
    const { FirebaseService } = await import('./services/firebaseService.js');
    
    // Get chat room details to find recipients
    const chatRoom = await storage.getChatRoom(roomId);
    if (!chatRoom) {
      console.log('❌ Chat room not found:', roomId);
      return;
    }
    
    console.log('📋 Chat room details:', {
      id: chatRoom.id,
      userId: chatRoom.userId,
      traderId: chatRoom.traderId,
      senderId
    });
    
    // Determine who should receive the notification
    let recipientId = null;
    let recipientIsTrader = false;
    
    if (isTrader) {
      // Message from trader to user
      recipientId = chatRoom.userId;
      recipientIsTrader = false;
      console.log('📤 Trader sent message, notifying user:', recipientId);
    } else {
      // Message from user to trader
      const trader = await storage.getTrader(chatRoom.traderId);
      if (trader) {
        recipientId = trader.userId;
        recipientIsTrader = true;
        console.log('📤 User sent message, notifying trader:', recipientId);
      }
    }
    
    if (!recipientId) {
      console.log('❌ Could not determine recipient for notification');
      return;
    }
    
    // Don't send notification to the sender
    if (recipientId === senderId) {
      console.log('🚫 Skipping notification to sender');
      return;
    }
    
    // Don't send push notification if recipient is online
    if (onlineUserIds.includes(recipientId)) {
      console.log('👁️ Recipient is online, skipping push notification');
      return;
    }
    
    // Get recipient's FCM tokens
    const fcmTokens = await storage.getFCMTokensByUserId(recipientId);
    
    if (fcmTokens.length === 0) {
      console.log('📭 No FCM tokens found for recipient:', recipientId);
      return;
    }
    
    console.log(`📱 Found ${fcmTokens.length} FCM token(s) for recipient`);
    
    // Send Firebase push notification
    const result = await FirebaseService.sendChatNotification(
      fcmTokens.map(token => token.token),
      senderName,
      message,
      roomId,
      recipientIsTrader
    );
    
    console.log('📊 Firebase push notification result:', result);
    
    if (result.success && result.sent > 0) {
      console.log(`✅ Firebase push notification sent successfully to ${result.sent} device(s)`);
    } else {
      console.log('⚠️ Firebase push notification was not sent or failed');
    }
    
  } catch (error) {
    console.error('💥 Error sending Firebase push notification:', error);
    // Don't throw - we don't want to break the message flow
  }
}