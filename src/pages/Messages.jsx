import { useState } from 'react';
import { Search, Send, MessageCircle, User, Clock, ArrowLeft } from 'lucide-react';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  // Close chat on mobile (go back to list)
  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const chats = [
    {
      id: 1,
      name: 'Pizza Palace',
      lastMessage: 'Your order is on the way!',
      time: '10:30 AM',
      unread: 2,
      avatar: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
      messages: [
        { id: 1, text: 'Hi! I just placed an order', sent: true, time: '10:15 AM' },
        { id: 2, text: 'Thank you for your order! We are preparing it now.', sent: false, time: '10:20 AM' },
        { id: 3, text: 'Your order is on the way!', sent: false, time: '10:30 AM' },
      ]
    },
    {
      id: 2,
      name: "Burger King's",
      lastMessage: 'Can I add extra cheese?',
      time: 'Yesterday',
      unread: 0,
      avatar: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
      messages: [
        { id: 1, text: 'Can I add extra cheese?', sent: true, time: '2:30 PM' },
        { id: 2, text: 'Of course! We have added it to your order.', sent: false, time: '2:35 PM' },
      ]
    },
    {
      id: 3,
      name: 'Healthy Bites',
      lastMessage: 'Thank you for your feedback!',
      time: '2 days ago',
      unread: 0,
      avatar: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
      messages: [
        { id: 1, text: 'The salad was amazing!', sent: true, time: '1:00 PM' },
        { id: 2, text: 'Thank you for your feedback! We are glad you enjoyed it.', sent: false, time: '1:10 PM' },
      ]
    },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      // Add message logic here
      setMessageInput('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Hidden when chat is selected on mobile */}
      {!selectedChat && (
        <div className="mb-4 xs:mb-6 md:mb-8">
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900 mb-1 xs:mb-2">Messages</h1>
          <p className="text-sm xs:text-base text-gray-600">Chat with restaurants and support</p>
        </div>
      )}

      <div className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Chat List - Hidden on mobile when chat is selected */}
            <div className={`md:border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
              {/* Search */}
              <div className="p-3 xs:p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 text-sm xs:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
                  />
                </div>
              </div>

              {/* Chats */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-3 xs:p-4 border-b border-gray-100 hover:bg-[#EBD5AB] transition-colors text-left ${
                      selectedChat?.id === chat.id ? 'bg-[#8BAE66]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 xs:gap-3">
                      <div className="relative">
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-10 h-10 xs:w-12 xs:h-12 rounded-full object-cover"
                        />
                        {chat.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 xs:w-5 xs:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm xs:text-base font-semibold text-gray-900 truncate">{chat.name}</h4>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-xs xs:text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window - Hidden on mobile when no chat selected */}
            <div className={`md:col-span-2 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 xs:p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 xs:gap-3">
                      {/* Back button - Only on mobile */}
                      <button
                        onClick={handleBackToList}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                      </button>

                      <img
                        src={selectedChat.avatar}
                        alt={selectedChat.name}
                        className="w-9 h-9 xs:w-10 xs:h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm xs:text-base font-semibold text-gray-900">{selectedChat.name}</h3>
                        <p className="text-xs xs:text-sm text-green-600">Active now</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide p-3 xs:p-4 space-y-3 xs:space-y-4">
                    {selectedChat.messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] xs:max-w-[70%] rounded-2xl px-3 xs:px-4 py-2 xs:py-3 ${
                            message.sent
                              ? 'bg-[#E67E22] text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-xs xs:text-sm">{message.text}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 opacity-70" />
                            <span className="text-xs opacity-70">{message.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-3 xs:p-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2 xs:p-3 bg-[#E67E22] text-white rounded-xl hover:bg-[#d4721d] transition-colors"
                      >
                        <Send className="w-4 h-4 xs:w-5 xs:h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 xs:w-14 xs:h-14 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 xs:mb-4" />
                    <h3 className="text-lg xs:text-xl font-bold text-gray-900 mb-2">Select a chat</h3>
                    <p className="text-sm xs:text-base text-gray-600">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
