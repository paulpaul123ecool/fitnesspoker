import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Chat from './Chat';
import './AllChallenges.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AllChallenges = ({ onBack }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    fetchAllChallenges();
  }, []);

  const fetchAllChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/challenges/all`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    try {
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

      // Remove the deleted challenge from the state
      setChallenges(challenges.filter(challenge => challenge._id !== challengeId));
    } catch (error) {
      console.error('Error deleting challenge:', error);
    }
  };

  const formatDuration = (duration, unit) => {
    return `${duration} ${unit}${duration > 1 ? 's' : ''}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleChatClick = (challengeId) => {
    setActiveChatId(activeChatId === challengeId ? null : challengeId);
  };

  const getChallengeStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="all-challenges">
      <header className="all-challenges-header">
        <h1>All Active Challenges</h1>
        <button onClick={onBack} className="back-button">
          Back to Dashboard
        </button>
      </header>

      <div className="all-challenges-content">
        {loading ? (
          <div className="loading">Loading challenges...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : challenges.length === 0 ? (
          <p className="no-challenges">
            No challenges available at the moment.
          </p>
        ) : (
          <div className="challenges-grid">
            {challenges.map(challenge => (
              <div key={challenge._id} className="challenge-card">
                <div className="challenge-header">
                  <h4>{challenge.title}</h4>
                  <div className="challenge-actions">
                    {challenge.isCreator ? (
                      <>
                        <button 
                          className={`chat-button ${activeChatId === challenge._id ? 'active' : ''}`}
                          onClick={() => handleChatClick(challenge._id)}
                        >
                          {activeChatId === challenge._id ? 'Hide Chat' : 'Chat'}
                        </button>
                        <button 
                          onClick={() => handleDeleteChallenge(challenge._id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button 
                        className={`chat-button ${activeChatId === challenge._id ? 'active' : ''}`}
                        onClick={() => handleChatClick(challenge._id)}
                      >
                        {activeChatId === challenge._id ? 'Hide Chat' : 'Chat'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="challenge-description">{challenge.description}</p>
                <div className="challenge-details">
                  <span className="challenge-bet">
                    Bet: ${challenge.originalBet}
                  </span>
                  <span className="challenge-duration">
                    Duration: {formatDuration(challenge.duration, challenge.durationUnit)}
                  </span>
                  <span className={`challenge-status ${getChallengeStatusClass(challenge.status)}`}>
                    Status: {challenge.status}
                  </span>
                  <span className="challenge-date">
                    Created: {formatDate(challenge.createdAt)}
                  </span>
                  <span className={`challenge-creator ${challenge.isCreator ? 'is-creator' : ''}`}>
                    {challenge.isCreator ? (
                      'Created by: You'
                    ) : (
                      <div className="creator-info">
                        {challenge.creatorProfilePicture && (
                          <img 
                            src={challenge.creatorProfilePicture}
                            alt={`${challenge.creatorName}'s profile`}
                            className="creator-profile-pic"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        )}
                        <span>Created by: {challenge.creatorName}</span>
                      </div>
                    )}
                  </span>
                  {challenge.isParticipant && !challenge.isCreator && (
                    <span className="challenge-participant-status">
                      You are participating in this challenge
                    </span>
                  )}
                </div>
                {activeChatId === challenge._id && (
                  <div className="chat-section">
                    <Chat 
                      challengeId={challenge._id}
                      creatorId={challenge.createdBy}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllChallenges; 