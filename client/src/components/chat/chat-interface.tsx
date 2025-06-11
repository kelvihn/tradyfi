// Updated chat-interface.tsx with Firebase FCM
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Paperclip, Image, File, X, Bell, BellOff } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
// CHANGE: Import Firebase hook instead of VAPID
import { useFirebaseMessaging } from "@/hooks/useFirebaseMessaging"; 
import { getSubdomain } from "@/lib/subdomain";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isTrader: boolean;
  attachments?: {
    type: 'image' | 'file';
    name: string;
    url: string;
    size: number;
  }[];
  isOptimistic?: boolean;
  isSending?: boolean;
  hasError?: boolean;
}

interface ChatInterfaceProps {
  roomId: number;
  userId: string;
  tradingOption?: string;
  onBack?: () => void;
}

export function ChatInterface({ roomId, userId, tradingOption = "Chat", onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const subdomain = getSubdomain();
  const isTrader = !subdomain || subdomain === 'www';

  // Default back handler if none provided
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (isTrader) {
        window.location.href = '/trader/dashboard';
      } else {
        window.location.href = '/';
      }
    }
  };

  // CHANGE: Use Firebase messaging hook instead of VAPID
  const {
    token: firebaseToken,
    isSupported: notificationsSupported,
    isLoading: notificationsLoading,
    error: notificationError,
    subscribeToNotifications,
    unsubscribe: disableNotifications
  } = useFirebaseMessaging({ userId, isTrader });

  // Check if user has enabled Firebase notifications
  const hasNotificationSubscription = !!firebaseToken;

  // WebSocket handlers with Firebase notification support
  const handleNewMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Firebase handles background notifications automatically
    // Show in-app notification only if tab is visible
    if (!document.hidden && message.senderId !== userId) {
      toast({
        title: `New message from ${message.senderName}`,
        description: message.content.length > 100 ? 
          message.content.substring(0, 100) + '...' : 
          message.content,
        action: message.content.length > 100 ? (
          <Button size="sm" variant="outline">
            View
          </Button>
        ) : undefined,
      });
    }
  }, [userId, toast]);

  const handleTypingStatus = useCallback((isUserTyping: boolean, senderId: string) => {
    if (senderId !== userId) {
      setIsTyping(isUserTyping);
    }
  }, [userId]);

  const { isConnected, sendMessage: sendWebSocketMessage, sendTypingStatus } = useWebSocket({
    roomId,
    userId,
    onMessage: handleNewMessage,
    onTyping: handleTypingStatus,
    isTrader
  });

  // Handle navigation from Firebase service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_CHAT') {
        const { chatRoomId } = event.data;
        if (chatRoomId && chatRoomId !== roomId) {
          window.location.href = isTrader 
            ? `/trader/dashboard?tab=chats&room=${chatRoomId}`
            : `/chat/${chatRoomId}`;
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [roomId, isTrader]);

  // Check and request Firebase notification permissions on mount
  useEffect(() => {
    if (notificationsSupported && !hasNotificationSubscription && !notificationsLoading) {
      // Show a subtle prompt to enable Firebase notifications
      const timer = setTimeout(() => {
        toast({
          title: "Enable Push Notifications",
          description: "Get reliable notifications powered by Firebase, even when the app is closed.",
          action: (
            <Button size="sm" onClick={handleEnableNotifications}>
              Enable
            </Button>
          ),
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notificationsSupported, hasNotificationSubscription, notificationsLoading]);

  const getToken = () => {
    if (isTrader) {
      return localStorage.getItem('token');
    } else {
      return localStorage.getItem(`userToken_${subdomain}`);
    }
  };

  // Handle enabling Firebase notifications
  const handleEnableNotifications = async () => {
    try {
      const success = await subscribeToNotifications();
      if (success) {
        toast({
          title: "🔥 Firebase Notifications Enabled",
          description: "You'll receive reliable push notifications powered by Firebase.",
        });
      } else {
        toast({
          title: "Failed to Enable Notifications",
          description: notificationError || "Please check your browser settings and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable Firebase notifications.",
        variant: "destructive"
      });
    }
  };

  // Handle disabling Firebase notifications
  const handleDisableNotifications = async () => {
    try {
      await disableNotifications();
      toast({
        title: "Notifications Disabled",
        description: "You'll no longer receive Firebase push notifications.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable notifications.",
        variant: "destructive"
      });
    }
  };

  // ... rest of your existing methods remain the same ...
  // (loadMessages, scrollToBottom, sendMessage, etc.)

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = getToken();
        console.log('Loading messages for room:', roomId);
        
        if (!token) {
          console.error('No token available for loading messages');
          return;
        }
        
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const chatMessages = await response.json();
          console.log('Loaded messages:', chatMessages);
          setMessages(chatMessages);
          
          await fetch(`/api/chat/rooms/${roomId}/mark-read`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.error('Failed to load messages:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    if (roomId && userId) {
      loadMessages();
    }
  }, [roomId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    const tempId = Date.now();
    const optimisticAttachments = selectedFiles.map(file => ({
      type: file.type.startsWith('image/') ? 'image' : 'file' as 'image' | 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    }));

    const optimisticMessage: Message = {
      id: tempId,
      senderId: userId,
      senderName: "You",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isTrader: isTrader,
      attachments: optimisticAttachments,
      isOptimistic: true,
      isSending: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);

    const messageContent = newMessage;
    const filesToUpload = [...selectedFiles];
    setNewMessage("");
    setSelectedFiles([]);

    try {
      let uploadedAttachments: any[] = [];
      if (filesToUpload.length > 0) {
        uploadedAttachments = await uploadFiles(filesToUpload);
      }

      const token = getToken();
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
        })
      });

      if (response.ok) {
        const savedMessage = await response.json();
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? {
                  id: savedMessage.id,
                  senderId: userId,
                  senderName: "You",
                  content: messageContent,
                  timestamp: savedMessage.createdAt || new Date().toISOString(),
                  isTrader: isTrader,
                  attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
                  isOptimistic: false,
                  isSending: false,
                }
              : msg
          )
        );

        if (isConnected) {
          sendWebSocketMessage(messageContent, "You", isTrader, uploadedAttachments);
        }
      } else {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, isSending: false, hasError: true }
              : msg
          )
        );
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, isSending: false, hasError: true }
            : msg
        )
      );
    }

    sendTypingStatus(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  // ... rest of your existing methods (renderAttachments, handleInputChange, etc.) ...
  
  const renderAttachments = (attachments: Message['attachments']) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {attachments.map((attachment, index) => (
          <div key={index}>
            {attachment.type === 'image' ? (
              <div className="relative">
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="max-w-48 max-h-48 rounded border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(attachment.url)}
                  onError={(e) => {
                    console.error('Image failed to load:', attachment.url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  <Image className="h-3 w-3 inline mr-1" />
                  {attachment.name}
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center space-x-2 bg-slate-100 rounded p-2 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <File className="h-4 w-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium">{attachment.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      sendTypingStatus(true);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
      
      setTypingTimeout(timeout);
    } else {
      sendTypingStatus(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<any[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const token = getToken();
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setIsUploading(false);
        return result.files || [];
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
      return [];
    }
  };

  const ImageModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-4xl p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl font-bold z-10 bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>
        <img 
          src={imageUrl} 
          alt="Full size" 
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Fixed Chat Header */}
      <Card className="rounded-none border-x-0 border-t-0 flex-shrink-0 sticky top-0 z-10">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {tradingOption.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{tradingOption}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                    {isConnected ? "Online" : "Connecting..."}
                  </Badge>
                  {isTyping && (
                    <span className="text-xs text-slate-500">Typing...</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Firebase notification toggle button */}
              {notificationsSupported && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={hasNotificationSubscription ? handleDisableNotifications : handleEnableNotifications}
                  disabled={notificationsLoading}
                  title={hasNotificationSubscription ? "Disable Firebase notifications" : "Enable Firebase notifications"}
                >
                  {notificationsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : hasNotificationSubscription ? (
                    <Bell className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                message.senderId === userId
                  ? `bg-primary text-white ${message.hasError ? 'bg-red-500' : ''} ${message.isSending ? 'opacity-70' : ''}`
                  : 'bg-white border border-slate-200'
              }`}
            >
              {message.isSending && (
                <div className="absolute top-1 right-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white opacity-50"></div>
                </div>
              )}
              
              {message.hasError && (
                <div className="absolute top-1 right-1">
                  <span className="text-red-200 text-xs">⚠️</span>
                </div>
              )}

              {message.senderId !== userId && (
                <p className="text-xs font-medium text-slate-600 mb-1">
                  {message.senderName}
                </p>
              )}
              
              {message.content && <p className="text-sm">{message.content}</p>}
              
              {renderAttachments(message.attachments)}
              
              <p className={`text-xs mt-1 flex items-center justify-between ${
                message.senderId === userId ? 'text-blue-100' : 'text-slate-500'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {message.isSending && (
                  <span className="text-xs opacity-60">Sending...</span>
                )}
                {message.hasError && (
                  <span className="text-xs text-red-200">Failed</span>
                )}
              </p>
            </div>
          </div>
        ))}

        {selectedImage && (
          <ImageModal 
            imageUrl={selectedImage} 
            onClose={() => setSelectedImage(null)} 
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Message Input */}
      <Card className="rounded-none border-x-0 border-b-0 flex-shrink-0 sticky bottom-0 z-10 bg-white">
        {selectedFiles.length > 0 && (
          <CardContent className="px-4 pt-4 pb-0 border-b border-slate-100">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-slate-50 rounded p-2 text-sm">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-slate-600" />
                  ) : (
                    <File className="h-4 w-4 text-slate-600" />
                  )}
                  <span className="truncate max-w-32">{file.name}</span>
                  <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 hover:bg-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={handleInputChange}
              disabled={isUploading}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={isUploading || (!newMessage.trim() && selectedFiles.length === 0) || !isConnected}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {isConnected ? 'Connected' : 'Reconnecting...'}
              {/* Firebase notification status indicator */}
              {hasNotificationSubscription && (
                <span className="ml-2 text-green-600">• 🔥 Firebase ON</span>
              )}
            </span>
            <span className="text-xs text-slate-500">
              Room #{roomId}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}