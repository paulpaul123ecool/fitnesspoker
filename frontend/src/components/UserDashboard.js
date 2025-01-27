import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UserDashboard = ({ 
  onNavigateToProfile, 
  onNavigateToChallenge, 
  onNavigateToAllChallenges,
  onNavigateToOngoing 
}) => {
  const { user, logout } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
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
      setChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <h1>Welcome to FitnessPoker77!</h1>
        <p>Hello, {user.email}</p>
        <div className="header-buttons">
          <button onClick={onNavigateToProfile} className="nav-button">
            Profile
          </button>
          <button onClick={onNavigateToChallenge} className="nav-button">
            Challenge
          </button>
          <button onClick={onNavigateToAllChallenges} className="nav-button">
            All Challenges
          </button>
          <button onClick={onNavigateToOngoing} className="nav-button">
            Ongoing Challenges
          </button>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      <div className="dashboard-content">
        <div className="user-section">
          <h2>Your Fitness Journey</h2>
          <p>Welcome to your personal fitness space! Here you can track your workouts, 
             participate in challenges, and improve your fitness level through our 
             unique poker-inspired workout system.</p>
          
          <div className="challenges-section">
            <h3>Your Active Challenges</h3>
            {loading ? (
              <div className="loading">Loading challenges...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : challenges.length === 0 ? (
              <p className="no-challenges">
                You haven't created any challenges yet. 
                <button onClick={onNavigateToChallenge} className="create-challenge-link">
                  Create your first challenge!
                </button>
              </p>
            ) : (
              <div className="challenges-grid">
                {challenges.map(challenge => (
                  <div key={challenge._id} className="challenge-card">
                    <h4>{challenge.name}</h4>
                    <p className="challenge-description">{challenge.description}</p>
                    <div className="challenge-details">
                      <span className="challenge-bet">
                        Bet: ${challenge.originalBet}
                      </span>
                      <span className="challenge-duration">
                        Duration: {formatDuration(challenge.duration, challenge.durationUnit)}
                      </span>
                      <span className="challenge-status">
                        Status: {challenge.status}
                      </span>
                      <span className="challenge-date">
                        Created: {formatDate(challenge.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 