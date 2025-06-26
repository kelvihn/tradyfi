// server/routes/chat.js
import express from 'express';
import { upload } from '../config/cloudinary.js';
import { storage } from '../storage.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Extract user ID from token
    req.user = { 
      id: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role 
    };
    
    console.log('Authenticated user:', req.user);
    next();
  } catch (error) {
    console.log('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get chat room messages
router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log(`Getting messages for room ${roomId}, user ${req.user.id}`);
    
    const hasAccess = await storage.verifyUserChatAccess(req.user.id, parseInt(roomId));
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }
    
    const messages = await storage.getChatMessages(parseInt(roomId), parseInt(page), parseInt(limit));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send a new message
router.post('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, attachments } = req.body;
    
    console.log(`Sending message to room ${roomId} from user ${req.user.id}`);
    
    const hasAccess = await storage.verifyUserChatAccess(req.user.id, parseInt(roomId));
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }
    
    const message = await storage.createChatMessage({
      chatRoomId: parseInt(roomId),
      senderId: req.user.id,
      message: content,
      attachments: attachments || null,
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload file attachment
router.post('/upload', authenticateToken, upload.array('files', 5), async (req, res) => {
  console.log("making API calls", req);
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files.map(file => ({
      type: file.mimetype.startsWith('image/') ? 'image' : 'file',
      name: file.originalname,
      url: file.path, // Cloudinary URL
      size: file.size,
      public_id: file.filename
    }));

    console.log("uploaded files @@@@");
    
    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

// Mark messages as read
router.post('/rooms/:roomId/mark-read', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log(`Marking messages as read for room ${roomId}, user ${req.user.id}`);
    
    const hasAccess = await storage.verifyUserChatAccess(req.user.id, parseInt(roomId));
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }
    
    await storage.markMessagesAsRead(parseInt(roomId), req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new chat room
router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { tradingOption, subdomain } = req.body;
    
    console.log(`Creating chat room for user ${req.user.id}, trader subdomain: ${subdomain}, trading option: ${tradingOption}`);
    
    // Get trader by subdomain
    const trader = await storage.getTraderBySubdomain(subdomain);
    if (!trader) {
      console.log(`Trader not found for subdomain: ${subdomain}`);
      return res.status(404).json({ message: 'Trader not found' });
    }
    
    console.log(`Found trader:`, trader);
    
    // Check if user exists in database
    const user = await storage.getUser(req.user.id);
    if (!user) {
      console.log(`User not found: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found user:`, user);
    
    // Check if chat room already exists
    const existingRoom = await storage.getExistingChatRoom(trader.id, req.user.id, tradingOption);
    if (existingRoom) {
      console.log(`Returning existing chat room:`, existingRoom);
      return res.json(existingRoom);
    }
    
    // Create new chat room
    const chatRoom = await storage.createChatRoom({
      traderId: trader.id,
      userId: req.user.id,
      tradingOption,
    });
    
    console.log(`Created new chat room:`, chatRoom);
    res.status(201).json(chatRoom);
    
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's chat rooms
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    console.log(`Getting chat rooms for user: ${req.user.id}`);
    
    const chatRooms = await storage.getUserChatRooms(req.user.id);
    console.log(`Found ${chatRooms.length} chat rooms for user`);
    
    res.json(chatRooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get trader's chat rooms (for trader dashboard)
router.get('/trader/chats', authenticateToken, async (req, res) => {
  try {
    console.log(`Getting trader chats for user: ${req.user.id}`);
    
    // First, get the trader profile for this user
    const trader = await storage.getTraderByUserId(req.user.id);
    if (!trader) {
      console.log(`No trader profile found for user: ${req.user.id}`);
      return res.status(404).json({ message: 'Trader profile not found' });
    }
    
    console.log(`Found trader:`, trader);
    
    // Get chat rooms for this trader
    const chatRooms = await storage.getTraderChatRooms(trader.id);
    console.log(`Found ${chatRooms.length} chat rooms for trader`);
    
    res.json(chatRooms);
  } catch (error) {
    console.error('Error fetching trader chat rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;