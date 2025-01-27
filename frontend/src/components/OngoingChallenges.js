import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './OngoingChallenges.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OngoingChallenges = ({ onBack }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
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

      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      console.log('Fetched challenges:', data); // Debug log
      
      // Filter only active challenges where the user is a participant or creator
      const ongoingChallenges = data.filter(challenge => 
        challenge.status === 'active' && 
        (String(challenge.createdBy) === String(user.id) || challenge.participants.some(p => String(p.userId) === String(user.id)))
      );
      setChallenges(ongoingChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

      fetchOngoingChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      setError(error.message);
    }
  };

  return (
    <div className="ongoing-challenges">
      <header className="ongoing-challenges-header">
        <h1>Ongoing Challenges</h1>
        <button onClick={onBack} className="back-button">
          Back to Dashboard
        </button>
      </header>

      <div className="ongoing-challenges-content">
        {loading ? (
          <div className="loading">Loading challenges...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : challenges.length === 0 ? (
          <p className="no-challenges">
            You don't have any ongoing challenges.
          </p>
        ) : (
          <div className="challenges-grid">
            {challenges.map(challenge => (
              <div key={challenge._id} className="challenge-card">
                <div className="challenge-header">
                  <h3>{challenge.name}</h3>
                  <div className="challenge-actions">
                    {challenge.isCreator && (
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteChallenge(challenge._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="challenge-description">{challenge.description}</p>
                <div className="challenge-info">
                  <div className="creator-info">
                    <span className="label">Created by:</span>
                    <div className="value">
                      <span>{challenge.isCreator ? 'You' : challenge.creatorName || 'Unknown User'}</span>
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
                    </div>
                  </div>
                  <div className="participants-info">
                    <h4>Participants:</h4>
                    <ul>
                      {challenge.participants.map(participant => (
                        <li key={`${participant.userId}-${participant.joinedAt}`}>
                          <span>{String(participant.userId) === String(user.id) ? 'You' : 'Other Participant'}</span>
                          <span>Joined: {formatDate(participant.joinedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="challenge-details">
                    <span className="challenge-bet">
                      Bet Amount: ${challenge.originalBet}
                    </span>
                    <span className="challenge-status">
                      Status: {challenge.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingChallenges; 