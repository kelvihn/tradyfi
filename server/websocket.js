// server/websocket.js - Updated with Message Aggregation and Smart Notifications
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Import notification aggregator
import notificationAggregator from './services/NotificationAggregator.js';
import { storage } from './storage.js'; // Import your storage instance

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store connected users for online status tracking
  const connectedUsers = new Map(); // userId -> Set of socketIds

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

    // Track user connection
    if (!connectedUsers.has(socket.userId)) {
      connectedUsers.set(socket.userId, new Set());
    }
    connectedUsers.get(socket.userId).add(socket.id);

    // Update user's last activity
    updateUserActivity(socket.userId);

    // Join chat room
    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
      socket.currentRoomId = roomId;
      console.log(`User ${socket.userId} joined room ${roomId}`);
      
      // Update activity when joining room
      updateUserActivity(socket.userId);
      
      // Notify others in the room that user is online
      socket.to(`room_${roomId}`).emit('user_online', {
        userId: socket.userId,
        isOnline: true
      });
    });

    // Leave chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      socket.currentRoomId = null;
      console.log(`User ${socket.userId} left room ${roomId}`);
      
      // Notify others in the room that user is offline
      socket.to(`room_${roomId}`).emit('user_online', {
        userId: socket.userId,
        isOnline: false
      });
    });

    // Handle new message with SMART NOTIFICATION SYSTEM
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
        // Update sender's last activity
        await updateUserActivity(socket.userId);
        
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
        
        // SMART NOTIFICATION LOGIC
        await handleSmartNotifications({
          roomId,
          senderId: socket.userId,
          senderName,
          message,
          isTrader,
          onlineUserIds
        });
        
      } catch (error) {
        console.error('❌ Error handling message:', error);
        
        // Still broadcast via WebSocket even if notification processing fails
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
      // Update activity on typing
      updateUserActivity(socket.userId);
      
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
      
      // Update activity on reading messages
      updateUserActivity(socket.userId);
      
      // Broadcast read status to sender
      socket.to(`room_${roomId}`).emit('message_read', {
        messageId,
        readBy: socket.userId,
        readAt: new Date().toISOString()
      });
    });

    // Handle user activity updates
    socket.on('user_activity', () => {
      updateUserActivity(socket.userId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} for user: ${socket.userId}`);
      
      // Remove from connected users tracking
      if (connectedUsers.has(socket.userId)) {
        connectedUsers.get(socket.userId).delete(socket.id);
        if (connectedUsers.get(socket.userId).size === 0) {
          connectedUsers.delete(socket.userId);
        }
      }
    });
  });

  // Helper function to check if user is online
  function isUserOnline(userId) {
    return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
  }

  return io;
}

// SMART NOTIFICATION HANDLER
async function handleSmartNotifications({ 
  roomId, 
  senderId, 
  senderName, 
  message, 
  isTrader,
  onlineUserIds = []
}) {
  try {
    console.log('🧠 Processing smart notifications...');
    
    // Get chat room details to find recipient
    const chatRoom = await storage.getChatRoom(roomId);
    if (!chatRoom) {
      console.log('❌ Chat room not found:', roomId);
      return;
    }
    
    // Determine recipient
    let recipientId = null;
    let recipientIsTrader = false;
    
    if (isTrader) {
      // Message from trader to user
      recipientId = chatRoom.userId;
      recipientIsTrader = false;
    } else {
      // Message from user to trader
      const trader = await storage.getTrader(chatRoom.traderId);
      if (trader) {
        recipientId = trader.userId;
        recipientIsTrader = true;
      }
    }
    
    if (!recipientId || recipientId === senderId) {
      console.log('🚫 No valid recipient or sender is recipient');
      return;
    }
    
    console.log(`📨 Message recipient: ${recipientId} (isTrader: ${recipientIsTrader})`);
    
    // Check if recipient is online
    if (onlineUserIds.includes(recipientId)) {
      console.log('✅ Recipient is online, skipping notifications');
      return;
    }
    
    // Apply smart notification rules WITH message content
    const shouldSendNotification = await SmartNotificationRules.shouldSendEmailNotification(
      recipientId, 
      roomId,
      message // PASS the message content here
    );
    
    if (!shouldSendNotification) {
      console.log('⏭️ Notification rules blocked email sending');
      return;
    }
    
    // Check message priority AGAIN to determine immediate vs aggregated
    const isHighPriority = SmartNotificationRules.isHighPriorityMessage(message);
    
    if (isHighPriority) {
      console.log('🚨 High priority message - sending immediate notification');
      
      // Send immediate aggregated email
      await notificationAggregator.sendImmediateEmail(
        recipientId,
        senderId,
        senderName,
        message,
        roomId,
        recipientIsTrader
      );
    } else {
      console.log('📦 Regular message - adding to aggregation queue');
      
      // Add to aggregation queue
      notificationAggregator.addPendingMessage(
        recipientId,
        senderId,
        senderName,
        message,
        roomId,
        recipientIsTrader
      );
    }
    
  } catch (error) {
    console.error('💥 Error in smart notifications:', error);
  }
}

// SMART NOTIFICATION RULES
class SmartNotificationRules {
  static async shouldSendEmailNotification(userId, roomId, message) { // ADD message parameter
    try {
      // Rule 1: Check if user has been offline for more than 10 minutes
      const lastActivity = await storage.getUserLastActivity(userId);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      if (lastActivity && lastActivity > tenMinutesAgo) {
        console.log(`⏭️ User ${userId} is recently active, skipping email`);
        return false;
      }

      // Rule 2: Check if we've sent an email for this room in the last hour
      const lastEmailSent = await storage.getLastEmailNotificationTime(userId, roomId);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastEmailSent && lastEmailSent > oneHourAgo) {
        console.log(`⏭️ Already sent email for room ${roomId} within last hour`);
        return false;
      }

      // Rule 3: Check if it's a high-priority message FIRST
      const isHighPriority = this.isHighPriorityMessage(message);
      if (isHighPriority) {
        console.log(`🚨 High priority message detected - bypassing business hours`);
        return true; // Skip business hours check for urgent messages
      }

      // Rule 4: Check if it's business hours (9 AM - 9 PM WAT) - ONLY for regular messages
      const now = new Date();
      const lagosTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Lagos"}));
      const hour = lagosTime.getHours();
      
      if (hour < 9 || hour > 21) {
        console.log(`⏭️ Outside business hours (${hour}:00), skipping regular message email`);
        return false;
      }

      // Rule 5: Check daily email limit
      const todayEmailCount = await storage.getTodayEmailCount(userId);
      const DAILY_EMAIL_LIMIT = 20;
      
      if (todayEmailCount >= DAILY_EMAIL_LIMIT) {
        console.log(`⏭️ Daily email limit reached for user ${userId} (${todayEmailCount}/${DAILY_EMAIL_LIMIT})`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking notification rules:', error);
      return false;
    }
  }

  static isHighPriorityMessage(content) {
    const urgentKeywords = [
      'urgent', 'emergency', 'asap', 'important', 'immediate',
      'bitcoin', 'btc', 'payment', 'transfer', 'buy now', 'sell now', 'trade now',
      'scam', 'fraud', 'help', 'problem', 'issue', 'stuck', 'error',
      'money', 'cash', 'dollar', 'naira', 'usdt', 'eth', 'ethereum'
    ];
    
    const lowerContent = content.toLowerCase();
    const hasUrgentKeyword = urgentKeywords.some(keyword => lowerContent.includes(keyword));
    
    if (hasUrgentKeyword) {
      console.log(`🚨 HIGH PRIORITY MESSAGE DETECTED: "${content}" contains urgent keywords`);
    }
    
    return hasUrgentKeyword;
  }
}


// Helper function to save message to database
async function saveMessageToDatabase({ chatRoomId, senderId, message, attachments }) {
  try {
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

// Helper function to update user activity
async function updateUserActivity(userId) {
  try {
    await storage.updateUserLastActivity(userId);
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
}