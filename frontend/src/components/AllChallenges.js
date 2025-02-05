import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfilePopup from './ProfilePopup';
import './AllChallenges.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AllChallenges = ({ onBack, onNavigateToOngoing }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAcceptChallenge = async (challengeId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to accept challenge');
      }

      await response.json();
      
      // First update the local state
      setChallenges(prevChallenges => 
        prevChallenges.filter(challenge => challenge._id !== challengeId)
      );

      // Then navigate after a small delay to ensure state update completes
      setTimeout(() => {
        if (onNavigateToOngoing) {
          onNavigateToOngoing();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error accepting challenge:', error);
      setError(error.message);
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

  const handleProfileClick = async (userId) => {
    if (String(userId) === String(user.id)) return; // Don't show popup for current user
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setSelectedProfile(profileData);
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
                    {String(challenge.createdBy) === String(user.id) ? (
                      <button
                        className="action-button cancel"
                        onClick={() => handleDeleteChallenge(challenge._id)}
                        disabled={isLoading}
                      >
                        Delete Challenge
                      </button>
                    ) : (
                      <>
                        {!challenge.isParticipant && (
                          <button
                            className="action-button"
                            onClick={() => handleAcceptChallenge(challenge._id)}
                            disabled={isLoading}
                          >
                            Accept Challenge
                          </button>
                        )}
                      </>
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
                  <div className="challenge-creator">
                    {challenge.isCreator ? (
                      'Created by: You'
                    ) : (
                      <div className="creator-info">
                        <div className="creator-avatar">
                          {challenge.creatorProfilePicture ? (
                            <img 
                              src={challenge.creatorProfilePicture} 
                              alt={`${challenge.creatorName}'s profile`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.classList.add('no-image');
                                e.target.parentElement.innerText = challenge.creatorName.charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            <div className="creator-avatar no-image">
                              {challenge.creatorName ? challenge.creatorName.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                        </div>
                        <div 
                          className="creator-details clickable"
                          onClick={() => handleProfileClick(challenge.createdBy)}
                        >
                          <span className="creator-name">{challenge.creatorName || 'Unknown User'}</span>
                          <span className="creator-label">Creator</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {challenge.isParticipant && !challenge.isCreator && (
                    <span className="challenge-participant-status">
                      You are participating in this challenge
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProfile && (
        <ProfilePopup
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default AllChallenges; 