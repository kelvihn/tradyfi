// server/websocket.js - Convert to ES modules
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

    // Handle new message
    // Handle new message
    socket.on('send_message', (data) => {
      const { roomId, message, senderName, isTrader, attachments } = data;
      
      console.log('=== MESSAGE RECEIVED ===');
      console.log('From user:', socket.userId);
      console.log('Room:', roomId);
      console.log('Message:', message);
      console.log('Sender name:', senderName);
      console.log('Is trader:', isTrader);
      console.log('=======================');
      
      // Broadcast message to all users in the room except sender
      const broadcastData = {
        id: Date.now(), // Temporary ID, will be replaced by database ID
        senderId: socket.userId,
        senderName,
        content: message,
        timestamp: new Date().toISOString(),
        isTrader,
        attachments: attachments || [],
        isRead: false
      };
      
      console.log('About to broadcast to room_' + roomId);
      console.log('Broadcast data:', broadcastData);
      
      // This is the key line - make sure it's there!
      socket.to(`room_${roomId}`).emit('new_message', broadcastData);
      
      console.log('✅ Message broadcasted to room_' + roomId);
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