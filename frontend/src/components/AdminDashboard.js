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
  const [currentPage, setCurrentPage] = useState('challenges'); // 'challenges' or 'profiles'
  const [profiles, setProfiles] = useState([]);
  const [profilesError, setProfilesError] = useState(null);
  const [profilesLoading, setProfilesLoading] = useState(true);

  useEffect(() => {
    if (currentPage === 'challenges') {
      fetchOngoingChallenges();
    } else if (currentPage === 'profiles') {
      fetchProfiles();
    }
  }, [currentPage]);

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

  const fetchProfiles = async () => {
    try {
      setProfilesLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();
      setProfiles(data);
      setProfilesError(null);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfilesError(error.message);
    } finally {
      setProfilesLoading(false);
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

  const renderChallengesPage = () => (
    <div className="admin-section">
      <h2>Managing Challenges</h2>
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
  );

  const renderProfilesPage = () => (
    <div className="admin-section">
      <h2>Managing Profiles</h2>
      {profilesError ? (
        <div className="error-message">{profilesError}</div>
      ) : profilesLoading ? (
        <div className="loading">Loading profiles...</div>
      ) : profiles.length === 0 ? (
        <p className="no-profiles">No user profiles found.</p>
      ) : (
        <div className="profiles-grid">
          {profiles.map(profile => (
            <div key={profile._id} className="profile-card">
              <div className="profile-header">
                <div className="profile-picture-container">
                  {profile.profilePicture ? (
                    <img
                      src={`${API_BASE_URL}${profile.profilePicture}`}
                      alt={`${profile.name}'s profile`}
                      className="profile-pic"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('profile-pic-placeholder');
                        e.target.parentElement.innerText = profile.name?.charAt(0) || '?';
                      }}
                    />
                  ) : (
                    <div className="profile-pic-placeholder">
                      {profile.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <h3 className="profile-name">{profile.name}</h3>
                  <p className="profile-email">{profile.email}</p>
                </div>
              </div>
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">{profile.age || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Fitness Experience:</span>
                  <span className="detail-value">{profile.fitnessExperience || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Member Since:</span>
                  <span className="detail-value">{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>FitnessPoker Administration</h1>
        <div className="admin-nav">
          <button 
            className={`nav-button ${currentPage === 'challenges' ? 'active' : ''}`}
            onClick={() => setCurrentPage('challenges')}
          >
            Managing Challenges
          </button>
          <button 
            className={`nav-button ${currentPage === 'profiles' ? 'active' : ''}`}
            onClick={() => setCurrentPage('profiles')}
          >
            Managing Profiles
          </button>
        </div>
        <div className="admin-info">
          <p>Welcome, Administrator {user.email}</p>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      <div className="dashboard-content">
        {currentPage === 'challenges' ? renderChallengesPage() : renderProfilesPage()}
      </div>
    </div>
  );
};

export default AdminDashboard; 