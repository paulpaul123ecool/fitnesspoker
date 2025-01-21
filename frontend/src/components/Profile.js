import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    fitnessExperience: '',
    profilePicture: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // This is fine - new user doesn't have a profile yet
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        name: data.name || '',
        age: data.age || '',
        fitnessExperience: data.fitnessExperience || ''
      }));
      if (data.profilePicture) {
        setPreviewUrl(`${API_BASE_URL}${data.profilePicture}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setError('Only JPEG and PNG images are allowed');
        return;
      }

      setProfile(prev => ({
        ...prev,
        profilePicture: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('age', profile.age);
      formData.append('fitnessExperience', profile.fitnessExperience);
      if (profile.profilePicture) {
        formData.append('profilePicture', profile.profilePicture);
      }

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setSuccessMessage('Profile updated successfully!');
      if (onBack) {
        setTimeout(onBack, 2000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={profile.name}
            onChange={handleInputChange}
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={profile.age}
            onChange={handleInputChange}
            placeholder="Enter your age"
            min="1"
            max="120"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fitnessExperience">Fitness Experience</label>
          <select
            id="fitnessExperience"
            name="fitnessExperience"
            value={profile.fitnessExperience}
            onChange={handleInputChange}
            required
          >
            <option value="">Select your experience level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="profilePicture">Profile Picture</label>
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            onChange={handleImageChange}
            accept="image/jpeg,image/png"
          />
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Profile preview" />
            </div>
          )}
        </div>

        <div className="button-group">
          <button type="submit" className="save-button">
            Save Profile
          </button>
          {onBack && (
            <button type="button" onClick={onBack} className="back-button">
              Back to Dashboard
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Profile; 