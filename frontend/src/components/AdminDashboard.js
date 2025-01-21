import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCleanupChallenges = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // January 20, 2024, 6:30 PM Bucharest time (UTC+2)
      const timestamp = '2024-01-20T16:30:00.000Z';
      
      const response = await fetch(`${API_BASE_URL}/api/challenges/before/${timestamp}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete challenges');
      }

      setMessage(`Success: ${data.message}`);
    } catch (error) {
      console.error('Error cleaning up challenges:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>FitnessPoker Administration</h1>
        <p>Welcome, Administrator {user.email}</p>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>
      <div className="dashboard-content">
        <div className="admin-section">
          <h2>System Administration Panel</h2>
          <p>As an administrator, you have access to:</p>
          <ul className="admin-features">
            <li>User Management</li>
            <li>System Configuration</li>
            <li>Activity Monitoring</li>
            <li>Performance Analytics</li>
          </ul>
          <div className="admin-actions">
            <p>Use the controls below to manage the FitnessPoker system:</p>
            <div className="action-buttons">
              <button 
                onClick={handleCleanupChallenges}
                disabled={isLoading}
                className="admin-button cleanup-button"
              >
                {isLoading ? 'Cleaning up...' : 'Delete Old Challenges'}
              </button>
            </div>
            {message && (
              <div className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 