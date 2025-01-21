import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Chat from './Chat';
import './ViewChallenge.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ViewChallenge = ({ challengeId, onBack }) => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChallenge(data);
      } else {
        setError('Failed to load challenge');
      }
    } catch (err) {
      setError('Error loading challenge');
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!challenge) {
    return <div>Loading...</div>;
  }

  return (
    <div className="view-challenge-container">
      <div className="challenge-details">
        <h2>{challenge.title}</h2>
        <p className="description">{challenge.description}</p>
        <div className="challenge-info">
          <p><strong>Bet Amount:</strong> ${challenge.originalBet}</p>
          <p><strong>Start Date:</strong> {new Date(challenge.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> {new Date(challenge.endDate).toLocaleDateString()}</p>
          <p><strong>Created by:</strong> {challenge.creatorName}</p>
        </div>
        
        {user.id !== challenge.createdBy && (
          <button 
            className="chat-toggle-button"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Hide Chat' : 'Chat with Creator'}
          </button>
        )}

        {showChat && (
          <Chat 
            challengeId={challengeId} 
            creatorId={challenge.createdBy}
          />
        )}

        <button onClick={onBack} className="back-button">
          Back
        </button>
      </div>
    </div>
  );
};

export default ViewChallenge; 