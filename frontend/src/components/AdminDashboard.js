import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import AdminReports from './AdminReports';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('challenges'); // 'challenges' or 'profiles' or 'reports'
  const [profiles, setProfiles] = useState([]);
  const [profilesError, setProfilesError] = useState(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [verifyingProfile, setVerifyingProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentPage === 'challenges') {
      fetchOngoingChallenges();
    } else if (currentPage === 'profiles') {
      fetchProfiles();
    } else if (currentPage === 'reports') {
      fetchReports();
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

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
      setLoading(false);
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

  const handleVerifyProfile = async (profileId) => {
    try {
      setVerifyingProfile(profileId);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/${profileId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify profile');
      }

      // Update the profiles list with the verified profile
      setProfiles(profiles.map(profile => 
        profile._id === profileId 
          ? { ...profile, isVerified: true }
          : profile
      ));

      setMessage('Profile verified successfully');
    } catch (error) {
      console.error('Error verifying profile:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setVerifyingProfile(null);
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      // Update the report status in the local state
      setReports(reports.map(report => 
        report._id === reportId ? { ...report, status: newStatus } : report
      ));
    } catch (error) {
      console.error('Error updating report status:', error);
      setError('Failed to update report status');
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

  const renderImageModal = () => {
    if (!selectedImage) return null;
    
    return (
      <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
        <div className="image-modal-content" onClick={e => e.stopPropagation()}>
          <img src={selectedImage} alt="Verification" className="enlarged-image" />
          <button className="close-modal-button" onClick={() => setSelectedImage(null)}>×</button>
        </div>
      </div>
    );
  };

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
                  {profile.isVerified && (
                    <div className="verification-badge">✓</div>
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
              <div className="verification-section">
                <h4>Verification Documents</h4>
                <div className="verification-images">
                  <div className="verification-image-container">
                    <span className="verification-label">ID Picture:</span>
                    {profile.verificationIdPicture ? (
                      <img
                        src={`${API_BASE_URL}${profile.verificationIdPicture}`}
                        alt="ID verification"
                        className="verification-pic clickable"
                        onClick={() => setSelectedImage(`${API_BASE_URL}${profile.verificationIdPicture}`)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = 'Image not available';
                        }}
                      />
                    ) : (
                      <span className="no-verification">Not uploaded</span>
                    )}
                  </div>
                  <div className="verification-image-container">
                    <span className="verification-label">Frontal Picture:</span>
                    {profile.verificationFrontalPicture ? (
                      <img
                        src={`${API_BASE_URL}${profile.verificationFrontalPicture}`}
                        alt="Frontal verification"
                        className="verification-pic clickable"
                        onClick={() => setSelectedImage(`${API_BASE_URL}${profile.verificationFrontalPicture}`)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = 'Image not available';
                        }}
                      />
                    ) : (
                      <span className="no-verification">Not uploaded</span>
                    )}
                  </div>
                </div>
                <button 
                  className={`verify-button ${profile.isVerified ? 'verified' : ''}`}
                  onClick={() => handleVerifyProfile(profile._id)}
                  disabled={profile.isVerified || verifyingProfile === profile._id}
                >
                  {profile.isVerified ? 'Profile Verified ✓' : 'Verify this profile'}
                </button>
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
      {renderImageModal()}
    </div>
  );

  const renderReportsPage = () => (
    <div className="admin-section reports-section">
      <h2>Report Management</h2>
      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : reports.length === 0 ? (
        <div className="no-reports">No reports found</div>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <h3>Report #{report._id}</h3>
                <span className={`status ${report.status}`}>{report.status}</span>
              </div>
              
              <div className="report-content">
                <div className="user-details">
                  <div className="reporter-info">
                    <strong>Reporter:</strong> {report.reporterId?.name || 'Unknown User'}
                  </div>
                  <div className="reported-user-info">
                    <strong>Reported User:</strong> {report.reportedUserId?.name || 'Unknown User'}
                  </div>
                </div>

                {report.challengeId && (
                  <div className="challenge-info">
                    <strong>Challenge:</strong> {report.challengeId.name}
                    <p>{report.challengeId.description}</p>
                  </div>
                )}

                <div className="report-reason">
                  <strong>Reason:</strong>
                  <p>{report.reason}</p>
                </div>

                {report.videoUrl && (
                  <div className="video-container">
                    <strong>Reported Video:</strong>
                    <video 
                      controls 
                      preload="metadata"
                      className="reported-video"
                    >
                      <source src={`${API_BASE_URL}${report.videoUrl}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                <div className="report-date">
                  <strong>Reported on:</strong> {formatDate(report.createdAt)}
                </div>

                <div className="report-actions">
                  <button
                    onClick={() => handleUpdateReportStatus(report._id, 'reviewed')}
                    className={`action-button ${report.status === 'reviewed' ? 'active' : ''}`}
                    disabled={report.status === 'reviewed'}
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateReportStatus(report._id, 'dismissed')}
                    className={`action-button ${report.status === 'dismissed' ? 'active' : ''}`}
                    disabled={report.status === 'dismissed'}
                  >
                    Dismiss Report
                  </button>
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
          <button 
            className={`nav-button ${currentPage === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentPage('reports')}
          >
            Report Management
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
        {currentPage === 'challenges' ? renderChallengesPage() :
         currentPage === 'profiles' ? renderProfilesPage() :
         currentPage === 'reports' ? renderReportsPage() : null}
      </div>
    </div>
  );
};

export default AdminDashboard; 