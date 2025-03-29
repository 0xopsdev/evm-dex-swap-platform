import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getChatMessages, addChatMessage } from '@/utils/api';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { formatTimestamp, getRandomAvatarImage, shortenAddress } from '@/utils/chatUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { TokenWithTransactions } from '@/interface/types';
import SiweAuth from '@/components/auth/SiweAuth';

interface ChatMessage {
  id: number;
  user: string;
  token: string;
  message: string;
  reply_to: number | null;
  timestamp: string;
}

interface ChatsProps {
  tokenAddress: string;
  tokenInfo: TokenWithTransactions;
}

const Chats: React.FC<ChatsProps> = ({ tokenAddress, tokenInfo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [replyToId, setReplyToId] = useState<number | undefined>(undefined);
  const { address } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const userAvatars = useMemo(() => {
    const avatars: { [key: string]: string } = {};
    messages.forEach(msg => {
      if (!avatars[msg.user]) {
        avatars[msg.user] = getRandomAvatarImage();
      }
    });
    return avatars;
  }, [messages]);

  useEffect(() => {
    checkAuth();
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        setIsAuthenticated(true);
        fetchMessages();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    fetchMessages(); 
  };

  const fetchMessages = async () => {
    try {
      const fetchedMessages = await getChatMessages(tokenAddress);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    }
  };

  const handlePostMessage = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in with Ethereum to post a message');
      return;
    }

    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await addChatMessage(address!, tokenAddress, newMessage, replyToId);
      setNewMessage('');
      setIsPopupOpen(false);
      setReplyToId(undefined);
      fetchMessages();
      toast.success('Message posted successfully');
    } catch (error) {
      console.error('Error posting message:', error);
      toast.error('Failed to post message');
    }
  };

  const handleReply = (messageId: number) => {
    setReplyToId(messageId);
    setIsPopupOpen(true);
  };

  const renderMessage = (msg: ChatMessage, depth: number = 0) => {
    const isReply = depth > 0;
    const isCreator = msg.user.toLowerCase() === tokenInfo.creatorAddress.toLowerCase();
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`bg-gray-700 p-3 rounded-lg shadow-md ${isReply ? 'ml-4 sm:ml-8 mt-2 border-l-2 border-blue-400' : 'mb-3'}`}
      >
        <div className="flex items-start gap-2">
          <Image
            src={userAvatars[msg.user] || getRandomAvatarImage()}
            alt="User Avatar"
            width={16}
            height={16}
            className="rounded-full"
          />
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <span className="text-gray-300 text-[10px] font-semibold">
                {shortenAddress(msg.user)}
                {isCreator && <span className="ml-1 text-blue-400">(dev)</span>}
              </span>
              <span className="text-[7px] text-gray-500">{formatTimestamp(msg.timestamp)}</span>
            </div>
            <p className="text-white text-xs mt-1 break-words">{msg.message}</p>
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => handleReply(msg.id)}
                className="text-[8px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
        {messages.filter(reply => reply.reply_to === msg.id).map(reply => renderMessage(reply, depth + 1))}
      </motion.div>
    );
  };

  return (
    <div className="bg-gray-800 p-3 sm:p-4 rounded-lg mb-6 shadow-lg">
      <h2 className="text-sm font-semibold mb-3 text-blue-300">Chats</h2>
      {!isAuthenticated ? (
        <SiweAuth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          {messages.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400">No messages yet. Be the first to chat!</p>
          ) : (
            <div className="space-y-3 mb-3 max-h-80 sm:max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {messages.filter(msg => msg.reply_to === null).map(msg => renderMessage(msg))}
              </AnimatePresence>
            </div>
          )}
          <button
            onClick={() => setIsPopupOpen(true)}
            className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium shadow-md"
          >
            Post a message
          </button>

          <AnimatePresence>
            {isPopupOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md shadow-xl"
                >
                  <h3 className="text-sm sm:text-base font-semibold mb-3 text-blue-300">
                    {replyToId !== undefined ? 'Reply' : 'Post'}
                  </h3>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 sm:p-3 rounded-lg mb-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={4}
                    placeholder="Enter your message..."
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setIsPopupOpen(false);
                        setReplyToId(undefined);
                      }}
                      className="bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostMessage}
                      className="bg-blue-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Post
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Chats;
