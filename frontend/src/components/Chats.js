import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Chats.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Chats = ({ onBack }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Fetched users:', data); // Debug log
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/chats/${userId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: newMessage,
          receiverId: selectedChat._id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMsg = await response.json();
      setMessages(prevMessages => [...prevMessages, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleOpenChat = (selectedUser) => {
    setSelectedChat(selectedUser);
    setMessages([]); // Clear previous messages
    fetchMessages(selectedUser._id); // Fetch messages for the new chat
  };

  // Only show users when there's a search term and it matches their name
  const filteredUsers = searchTerm.trim() === '' ? [] : users.filter(u => {
    if (!u.profile?.name) return false;
    return u.profile.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chats">
      <header className="chats-header">
        <h1>Chats</h1>
        <button onClick={onBack} className="back-button">
          Back to Dashboard
        </button>
      </header>
      <div className="chats-container">
        <div className="users-section">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search users by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="users-list">
            {loading ? (
              <p className="loading">Loading users...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : searchTerm.trim() === '' ? (
              <p className="no-results">Type a name to search for users</p>
            ) : filteredUsers.length === 0 ? (
              <p className="no-results">No users found with that name</p>
            ) : (
              filteredUsers.map(u => (
                <div key={u._id} className="user-item">
                  <div className="user-info">
                    {u.profile?.profilePicture && (
                      <img 
                        src={`${API_BASE_URL}/${u.profile.profilePicture}`}
                        alt="Profile"
                        className="profile-picture"
                      />
                    )}
                    <span className="user-name">{u.profile.name}</span>
                  </div>
                  <button 
                    className="open-chat-button"
                    onClick={() => handleOpenChat(u)}
                  >
                    Open Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {selectedChat && (
          <div className="chat-section">
            <div className="chat-header">
              <div className="chat-user-info">
                {selectedChat.profile?.profilePicture && (
                  <img 
                    src={`${API_BASE_URL}/${selectedChat.profile.profilePicture}`}
                    alt="Profile"
                    className="profile-picture"
                  />
                )}
                <span className="user-name">{selectedChat.profile.name}</span>
              </div>
              <button 
                className="close-chat-button"
                onClick={() => setSelectedChat(null)}
              >
                ×
              </button>
            </div>
            <div className="messages-container">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`message ${message.senderId === user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats; 