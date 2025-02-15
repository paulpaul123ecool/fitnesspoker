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
  const [hasOngoingChallenge, setHasOngoingChallenge] = useState(false);
  const [sharedChallenges, setSharedChallenges] = useState([]);
  const [showChallengeDropdown, setShowChallengeDropdown] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      checkOngoingChallenge(selectedChat._id);
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

  const checkOngoingChallenge = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const challenges = await response.json();
      
      // Find all active challenges shared between users
      const shared = challenges.filter(challenge => 
        challenge.status === 'active' && (
          (String(challenge.createdBy) === String(user.id) && 
           challenge.participants.some(p => String(p.userId) === String(otherUserId))) ||
          (String(challenge.createdBy) === String(otherUserId) && 
           challenge.participants.some(p => String(p.userId) === String(user.id)))
        )
      );

      setSharedChallenges(shared);
      setHasOngoingChallenge(shared.length > 0);
    } catch (error) {
      console.error('Error checking ongoing challenge:', error);
      setHasOngoingChallenge(false);
      setSharedChallenges([]);
    }
  };

  const sendVerificationMessage = async (content, videoUrl) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content,
          receiverId: selectedChat._id,
          verification: {
            videoUrl: videoUrl,
            timestamp: new Date()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send verification message');
      }

      const newMsg = await response.json();
      setMessages(prevMessages => [...prevMessages, newMsg]);
    } catch (error) {
      console.error('Error sending verification message:', error);
    }
  };

  const handleVerificationVideoUpload = async (event) => {
    if (!selectedChallenge || !event.target.files || !event.target.files[0]) return;

    try {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('video', file);
      formData.append('challengeId', selectedChallenge._id);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/challenges/${selectedChallenge._id}/verify-daily`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload verification video');
      }

      const result = await response.json();
      
      // Send a message about the verification with the video URL
      const verificationMessage = `[Daily Verification Video Uploaded for Challenge: ${selectedChallenge.name}]`;
      await sendVerificationMessage(verificationMessage, result.verification.videoUrl);

      // Reset states
      setSelectedChallenge(null);
      setShowChallengeDropdown(false);
    } catch (error) {
      console.error('Error uploading verification video:', error);
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

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportedUserId: selectedChat._id,
          videoUrl: selectedVideo,
          reason: reportMessage,
          challengeId: selectedChallenge?._id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      // Reset the report form
      setShowReportPopup(false);
      setReportMessage('');
      setSelectedVideo(null);
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

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
              {messages.map((message, index) => {
                const isVerificationMessage = message.content.startsWith('[Daily Verification Video Uploaded for Challenge:');
                return (
                  <div 
                    key={index}
                    className={`message ${message.senderId === user.id ? 'sent' : 'received'} ${isVerificationMessage ? 'verification-message' : ''}`}
                  >
                    <div className="message-content">
                      {isVerificationMessage ? (
                        <>
                          <div className="verification-text">{message.content}</div>
                          {message.verification && message.verification.videoUrl && (
                            <div className="verification-video-container">
                              <video 
                                className="verification-video" 
                                controls
                                preload="metadata"
                              >
                                <source src={`${API_BASE_URL}${message.verification.videoUrl}`} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              {message.senderId !== user.id && (
                                <button 
                                  className="report-video-button"
                                  onClick={() => {
                                    setSelectedVideo(message.verification.videoUrl);
                                    setShowReportPopup(true);
                                  }}
                                >
                                  Report Video
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        message.content
                      )}
                    </div>
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={sendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              {hasOngoingChallenge && (
                <div className="verification-button-container">
                  <button 
                    type="button" 
                    className="daily-verification-button"
                    onClick={() => setShowChallengeDropdown(!showChallengeDropdown)}
                  >
                    Daily Verification
                  </button>
                  {showChallengeDropdown && (
                    <div className="challenge-dropdown">
                      {sharedChallenges.map(challenge => (
                        <div 
                          key={challenge._id} 
                          className="challenge-dropdown-item"
                          onClick={() => {
                            setSelectedChallenge(challenge);
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'video/*';
                            fileInput.onchange = handleVerificationVideoUpload;
                            fileInput.click();
                          }}
                        >
                          {challenge.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {showReportPopup && (
        <div className="report-popup-overlay">
          <div className="report-popup">
            <h3>Report Verification Video</h3>
            <form onSubmit={handleReportSubmit}>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Please describe your concern about this video..."
                required
              />
              <div className="report-buttons">
                <button type="submit" className="submit-report">Submit Report</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowReportPopup(false);
                    setReportMessage('');
                    setSelectedVideo(null);
                  }}
                  className="cancel-report"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats; 