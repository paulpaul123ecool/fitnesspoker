import React from 'react';
import './ProfilePopup.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProfilePopup = ({ profile, onClose }) => {
  if (!profile) return null;

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  return (
    <div className="profile-popup-overlay" onClick={onClose}>
      <div className="profile-popup-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="profile-header">
          <div className="profile-picture-container">
            {profile.profilePicture ? (
              <img
                src={getImageUrl(profile.profilePicture)}
                alt={`${profile.name}'s profile`}
                className="profile-picture"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('profile-picture-placeholder');
                  e.target.parentElement.innerText = profile.name?.charAt(0) || '?';
                }}
              />
            ) : (
              <div className="profile-picture-placeholder">
                {profile.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <h2>{profile.name}</h2>
        </div>

        <div className="profile-info">
          <div className="info-row">
            <label>Age:</label>
            <span>{profile.age}</span>
          </div>
          <div className="info-row">
            <label>Fitness Experience:</label>
            <span>{profile.fitnessExperience}</span>
          </div>
        </div>

        {(profile.showcasePicture1 || profile.showcasePicture2) && (
          <div className="showcase-pictures">
            <h3>Showcase Pictures</h3>
            <div className="showcase-grid">
              {profile.showcasePicture1 && (
                <img
                  src={getImageUrl(profile.showcasePicture1)}
                  alt="Showcase 1"
                  className="showcase-picture"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {profile.showcasePicture2 && (
                <img
                  src={getImageUrl(profile.showcasePicture2)}
                  alt="Showcase 2"
                  className="showcase-picture"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePopup; 