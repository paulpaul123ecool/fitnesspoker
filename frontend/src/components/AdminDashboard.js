import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOngoingChallenges();
  }, []);

  const fetchOngoingChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/challenges/admin/ongoing`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError(error.message);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete challenge');
      }

      // Remove the deleted challenge from state
      setChallenges(challenges.filter(challenge => challenge._id !== challengeId));
      setMessage('Challenge deleted successfully');
    } catch (error) {
      console.error('Error deleting challenge:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>FitnessPoker Administration</h1>
        <p>Welcome, Administrator {user.email}</p>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>
      <div className="dashboard-content">
        <div className="admin-section">
          <h2>Ongoing Challenges</h2>
          {error ? (
            <div className="error-message">{error}</div>
          ) : challenges.length === 0 ? (
            <p className="no-challenges">No ongoing challenges found.</p>
          ) : (
            <div className="challenges-grid">
              {challenges.map(challenge => (
                <div key={challenge._id} className="challenge-card">
                  <div className="challenge-header">
                    <h3>{challenge.title || challenge.name}</h3>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteChallenge(challenge._id)}
                      disabled={isLoading}
                    >
                      Delete Challenge
                    </button>
                  </div>
                  <div className="challenge-info">
                    <p className="challenge-description">{challenge.description}</p>
                    <div className="challenge-details">
                      <span className="challenge-bet">Bet: ${challenge.originalBet}</span>
                      <span className="challenge-date">Created: {formatDate(challenge.createdAt)}</span>
                    </div>
                    <div className="creator-section">
                      <h4>Creator:</h4>
                      <div className="creator-info">
                        {challenge.creatorProfilePicture ? (
                          <img 
                            src={challenge.creatorProfilePicture} 
                            alt={`${challenge.creatorName}'s profile`}
                            className="profile-pic"
                          />
                        ) : (
                          <div className="profile-pic-placeholder">
                            {challenge.creatorName.charAt(0)}
                          </div>
                        )}
                        <span className="creator-name">{challenge.creatorName}</span>
                      </div>
                    </div>
                    <div className="participants-section">
                      <h4>Participants:</h4>
                      <div className="participants-list">
                        {challenge.participants.map(participant => (
                          <div key={participant.userId} className="participant-info">
                            {participant.profile.profilePicture ? (
                              <img 
                                src={participant.profile.profilePicture} 
                                alt={`${participant.profile.name}'s profile`}
                                className="profile-pic"
                              />
                            ) : (
                              <div className="profile-pic-placeholder">
                                {participant.profile.name.charAt(0)}
                              </div>
                            )}
                            <div className="participant-details">
                              <span className="participant-name">{participant.profile.name}</span>
                              <span className="join-date">Joined: {formatDate(participant.joinedAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {message && (
            <div className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 