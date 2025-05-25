import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../Context/authContext';
import { useNotification } from '../../Context/NotificationContext';
import axios from 'axios';
import { Send, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagerMessage = () => {
  const { user, companyId, loading, authError } = useAuth();
  const { newMessages, setNewMessages, socket, markAsRead } = useNotification();
  const [conversations, setConversations] = useState([]);
  const [conversationsError, setConversationsError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const shouldScrollToBottomRef = useRef(false);
  const navigate = useNavigate();

  // Utility to wait for socket connection
  const waitForSocketConnection = (socket, callback, maxAttempts, interval) => {
    if (maxAttempts === undefined) maxAttempts = 10;
    if (interval === undefined) interval = 500;
    let attempts = 0;
    const checkConnection = () => {
      if (socket && socket.connected) {
        callback();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkConnection, interval);
      } else {
        console.warn('Socket.IO failed to connect after maximum attempts. Real-time notifications may not work.');
      }
    };
    checkConnection();
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setConversationsError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { companyId }
        }
      );
      console.log('DEBUG - Fetched conversations:', res.data);
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        setConversationsError('Conversations endpoint not found. Please contact support.');
      } else if (error.message.includes('Network Error')) {
        setConversationsError('Cannot connect to the server. Please check if the server is running.');
      } else {
        setConversationsError('Failed to load conversations. Please try again.');
      }
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      setMessagesLoading(true);
      console.time('fetchMessages');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/messages/conversations/${selectedConversation._id}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      console.timeEnd('fetchMessages');
      console.log('DEBUG - Fetched messages for conversation:', selectedConversation._id, res.data);
      setMessages(res.data);
      // Mark notifications as read
      const relevantMessages = newMessages.filter(
        (msg) => msg.conversationId.toString() === selectedConversation._id.toString()
      );
      relevantMessages.forEach((msg) => {
        if (msg.notificationId) {
          console.log("DEBUG - Auto-marking message as read for notification ID:", msg.notificationId);
          markAsRead(msg.notificationId);
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error.response?.data || error.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Initial fetch for conversations
  useEffect(() => {
    if (!user || !companyId || loading) return;

    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, companyId, loading]);

  // Fetch messages when selectedConversation changes
  useEffect(() => {
    if (selectedConversation) {
      isUserScrollingRef.current = false;
      shouldScrollToBottomRef.current = true;
      fetchMessages();
    } else {
      setMessages([]);
      setMessagesLoading(false);
    }
  }, [selectedConversation]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === selectedConversation._id) {
        setMessages((prev) => {
          const updatedMessages = [...prev, message];
          shouldScrollToBottomRef.current = true;
          return updatedMessages;
        });
      }
    };

    socket.on('receiveMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket, selectedConversation]);

  // Detect user scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      isUserScrollingRef.current = !isAtBottom;
      console.log('DEBUG - Scroll event, isUserScrolling:', isUserScrollingRef.current, 'scrollTop:', scrollTop, 'time:', Date.now());
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to the latest message
  useEffect(() => {
    if (
      messagesContainerRef.current &&
      messagesEndRef.current &&
      !messagesLoading &&
      !isUserScrollingRef.current &&
      shouldScrollToBottomRef.current
    ) {
      console.log('DEBUG - Scrolling to bottom, messages count:', messages.length, 'scrollTop:', messagesContainerRef.current.scrollTop, 'time:', Date.now());
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [messages, messagesLoading]);

  // Fetch all employees when search modal opens
  useEffect(() => {
    if (!showSearchModal) {
      setAllEmployees([]);
      setFilteredEmployees([]);
      setSearchQuery('');
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    if (!companyId) {
      setSearchError('Company ID is missing. Cannot search employees.');
      setSearchLoading(false);
      return;
    }

    const fetchEmployees = async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/manager/users/search`,
          {
            params: { role: 'Employee', companyId },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        console.log('DEBUG - Fetch all employees response:', res.data);
        if (res.data.success) {
          setAllEmployees(res.data.users);
          setFilteredEmployees(res.data.users);
          if (res.data.users.length === 0) {
            setSearchError('No employees found in your company.');
          }
        } else {
          setSearchError(res.data.error || 'Failed to fetch employees.');
        }
      } catch (error) {
        console.error('Error fetching employees:', error.response?.data || error.message);
        if (error.message.includes('Network Error')) {
          setSearchError('Cannot connect to the server. Please check if the server is running.');
        } else {
          setSearchError('An error occurred while fetching employees. Please try again.');
        }
      } finally {
        setSearchLoading(false);
      }
    };
    fetchEmployees();
  }, [showSearchModal, companyId]);

  // Filter employees client-side
  useEffect(() => {
    if (!searchQuery) {
      setFilteredEmployees(allEmployees);
      return;
    }

    const filtered = allEmployees.filter((emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
    if (filtered.length === 0 && allEmployees.length > 0) {
      setSearchError('No matching employees found.');
    } else {
      setSearchError(null);
    }
  }, [searchQuery, allEmployees]);

  // Start a new conversation
  const handleStartConversation = async (participantId) => {
    if (!user || !companyId || !participantId) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/messages/conversations`,
        { participantIds: [participantId], companyId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConversations((prev) => [res.data, ...prev]);
      setSelectedConversation(res.data);
      setShowSearchModal(false);
      setSearchQuery('');
      setAllEmployees([]);
      setFilteredEmployees([]);
    } catch (error) {
      console.error('Error starting conversation:', error.response?.data || error.message);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user || !companyId) return;

    const messageData = {
      conversationId: selectedConversation._id,
      senderId: user._id,
      content: newMessage,
      companyId
    };

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/messages`,
        messageData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (socket) {
        waitForSocketConnection(socket, () => {
          socket.emit('sendMessage', { ...messageData, _id: res.data._id });
          console.log('DEBUG - Emitted sendMessage event:', { ...messageData, _id: res.data._id });
        });
      } else {
        console.warn('Socket.IO is not initialized. Message sent, but real-time notification may not work.');
      }
      setMessages((prev) => {
        const updatedMessages = [...prev, res.data];
        shouldScrollToBottomRef.current = true;
        return updatedMessages;
      });
      setNewMessage('');
      isUserScrollingRef.current = false;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  };

  // Handle Enter key press to send message
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Count unread messages per conversation
  const getUnreadCount = (conversationId) => {
    return newMessages.filter((msg) => msg.conversationId.toString() === conversationId.toString()).length;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'Manager') {
    return navigate('/unauthorized', { replace: true });
  }

  if (authError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-900">
        <p className="text-red-500">{authError}</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-900">
        <p className="text-red-500">Error: User is not associated with a company.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900 text-gray-100">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-gray-800 shadow-md border-r border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-100">Conversations</h2>
          <button
            onClick={() => setShowSearchModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center text-sm transition-colors"
          >
            <Users size={16} className="mr-1" />
            New Chat
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {conversationsError ? (
            <p className="text-red-500 text-center p-4">{conversationsError}</p>
          ) : conversations.length === 0 ? (
            <p className="text-gray-400 text-center p-4">No conversations yet. Start a new chat!</p>
          ) : (
            conversations.map((conv) => {
              const unreadCount = getUnreadCount(conv._id);
              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                    selectedConversation?._id === conv._id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-100">
                      {conv.participants
                        .filter((p) => p._id !== user._id)
                        .map((p) => p.name)
                        .join(', ')}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Area (Conversation Box) */}
      <div className="w-2/3 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 bg-gray-800 border-b border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-100">
                {selectedConversation.participants
                  .filter((p) => p._id !== user._id)
                  .map((p) => p.name)
                  .join(', ')}
              </h3>
            </div>
            <div
              ref={messagesContainerRef}
              className="flex-1 p-6 overflow-y-auto bg-gray-950 min-h-0"
            >
              {messagesLoading ? (
                <p className="text-gray-400 text-center">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-400 text-center">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`mb-4 flex ${
                      msg.sender._id === user._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-lg shadow-md ${
                        msg.sender._id === user._id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Start New Conversation</h3>
              <button onClick={() => setShowSearchModal(false)} className="text-gray-400 hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="w-full p-2 mb-4 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="max-h-60 overflow-y-auto">
              {searchLoading ? (
                <p className="text-gray-400 text-center">Loading...</p>
              ) : searchError ? (
                <p className="text-red-500 text-center">{searchError}</p>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((result) => (
                  <div
                    key={result._id}
                    onClick={() => handleStartConversation(result._id)}
                    className="p-3 hover:bg-gray-700 cursor-pointer rounded flex items-center transition-colors"
                  >
                    <p className="text-gray-100">{result.name} ({result.role})</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No employees found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMessage;