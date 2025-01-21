import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Challenge.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Challenge = ({ onBack }) => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState({
    name: '',
    description: '',
    originalBet: '',
    duration: '',
    durationUnit: 'days'
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallenge(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!challenge.name.trim()) {
      throw new Error('Challenge name is required');
    }
    if (!challenge.description.trim()) {
      throw new Error('Challenge description is required');
    }
    if (!challenge.originalBet || isNaN(challenge.originalBet) || challenge.originalBet <= 0) {
      throw new Error('Original bet must be a positive number');
    }
    if (!challenge.duration || isNaN(challenge.duration) || challenge.duration <= 0) {
      throw new Error('Duration must be a positive number');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMessage('');
      
      validateForm();

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const challengeData = {
        ...challenge,
        originalBet: parseFloat(challenge.originalBet),
        duration: parseInt(challenge.duration),
        createdBy: user.id
      };

      console.log('Submitting challenge:', challengeData);

      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(challengeData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create challenge');
      }

      console.log('Challenge created successfully:', data);
      setSuccessMessage('Challenge created successfully!');
      if (onBack) {
        setTimeout(onBack, 2000);
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError(error.message);
    }
  };

  return (
    <div className="challenge-container">
      <h1>Create New Challenge</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className="challenge-form">
        <div className="form-group">
          <label htmlFor="name">Challenge Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={challenge.name}
            onChange={handleInputChange}
            placeholder="Enter challenge name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={challenge.description}
            onChange={handleInputChange}
            placeholder="Describe your challenge"
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="originalBet">Original Bet ($)</label>
          <input
            type="number"
            id="originalBet"
            name="originalBet"
            value={challenge.originalBet}
            onChange={handleInputChange}
            placeholder="Enter bet amount"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group time-input">
          <label htmlFor="duration">Duration</label>
          <div className="duration-container">
            <input
              type="number"
              id="duration"
              name="duration"
              value={challenge.duration}
              onChange={handleInputChange}
              placeholder="Enter duration"
              min="1"
              required
            />
            <select
              name="durationUnit"
              value={challenge.durationUnit}
              onChange={handleInputChange}
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="create-button">
            Create Challenge
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

export default Challenge; 