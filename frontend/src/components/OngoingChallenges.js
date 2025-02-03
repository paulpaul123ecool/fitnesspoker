import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfilePopup from './ProfilePopup';
import './OngoingChallenges.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OngoingChallenges = ({ onBack }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

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
      
      // Filter only active challenges where the user is a participant or creator
      const ongoingChallenges = data.filter(challenge => 
        challenge.status === 'active' && 
        (String(challenge.createdBy) === String(user.id) || challenge.participants.some(p => String(p.userId) === String(user.id)))
      );

      // Fetch participant details for each challenge
      const challengesWithDetails = await Promise.all(ongoingChallenges.map(async (challenge) => {
        // Fetch creator details if not the current user
        if (String(challenge.createdBy) !== String(user.id)) {
          try {
            const creatorResponse = await fetch(`${API_BASE_URL}/api/profile/${challenge.createdBy}/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (creatorResponse.ok) {
              const creatorData = await creatorResponse.json();
              challenge.creatorName = creatorData.name;
              challenge.creatorProfilePicture = creatorData.profilePicture ? `${API_BASE_URL}${creatorData.profilePicture}` : null;
            }
          } catch (error) {
            console.error('Error fetching creator details:', error);
          }
        } else {
          challenge.creatorName = 'You';
          challenge.creatorProfilePicture = user.profilePicture ? `${API_BASE_URL}${user.profilePicture}` : null;
        }

        // Fetch details for each participant
        const participantsWithDetails = await Promise.all(challenge.participants.map(async (participant) => {
          if (String(participant.userId) === String(user.id)) {
            return {
              ...participant,
              name: 'You',
              profilePicture: user.profilePicture ? `${API_BASE_URL}${user.profilePicture}` : null
            };
          }

          try {
            const participantResponse = await fetch(`${API_BASE_URL}/api/profile/${participant.userId}/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (participantResponse.ok) {
              const participantData = await participantResponse.json();
              return {
                ...participant,
                name: participantData.name,
                profilePicture: participantData.profilePicture ? `${API_BASE_URL}${participantData.profilePicture}` : null
              };
            }
          } catch (error) {
            console.error('Error fetching participant details:', error);
          }
          return participant;
        }));

        return {
          ...challenge,
          participants: participantsWithDetails
        };
      }));

      setChallenges(challengesWithDetails);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              <div key={challenge._id} className="ongoing-challenge-card">
                <div className="challenge-header">
                  <h2 className="challenge-title">{challenge.name}</h2>
                </div>
                
                <p className="challenge-description">{challenge.description}</p>
                
                <div className="bet-info">
                  <span className="bet-amount">Bet: ${challenge.originalBet}</span>
                  <span className="created-date">Created: {formatDate(challenge.createdAt)}</span>
                </div>

                <div className="creator-section">
                  <h3 className="section-title">Creator:</h3>
                  <div className="creator-profile">
                    {challenge.creatorProfilePicture ? (
                      <img 
                        src={challenge.creatorProfilePicture}
                        alt="Creator profile"
                        className="profile-pic"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('no-image');
                          e.target.parentElement.innerText = challenge.creatorName?.charAt(0) || '?';
                        }}
                      />
                    ) : (
                      <div className="profile-pic-placeholder">
                        {challenge.creatorName?.charAt(0) || '?'}
                      </div>
                    )}
                    <span 
                      className={`creator-name ${String(challenge.createdBy) !== String(user.id) ? 'clickable' : ''}`}
                      onClick={() => handleProfileClick(challenge.createdBy)}
                    >
                      {String(challenge.createdBy) === String(user.id) ? 'You' : challenge.creatorName || 'Unknown User'}
                    </span>
                  </div>
                </div>

                <div className="participants-section">
                  <h3 className="section-title">Participants:</h3>
                  <div className="participants-list">
                    {challenge.participants.map(participant => (
                      <div 
                        key={`${participant.userId}-${participant.joinedAt}`} 
                        className="participant-item"
                      >
                        {participant.profilePicture ? (
                          <img 
                            src={participant.profilePicture}
                            alt={`${participant.name}'s profile`}
                            className="profile-pic"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.classList.add('no-image');
                              e.target.parentElement.innerText = participant.name?.charAt(0) || '?';
                            }}
                          />
                        ) : (
                          <div className="profile-pic-placeholder">
                            {participant.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="participant-info">
                          <span 
                            className={`participant-name ${String(participant.userId) !== String(user.id) ? 'clickable' : ''}`}
                            onClick={() => handleProfileClick(participant.userId)}
                          >
                            {String(participant.userId) === String(user.id) ? 'You' : participant.name}
                          </span>
                          <span className="join-date">Joined: {formatDate(participant.joinedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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

export default OngoingChallenges; 