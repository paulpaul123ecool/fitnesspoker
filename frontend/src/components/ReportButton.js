import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ReportButton.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ReportButton = ({ reportedUserId, challengeId }) => {
  const { user } = useAuth();

  // Don't render the button if it's the user's own content
  if (user && user.userId === reportedUserId) {
    return null;
  }

  const handleReport = async () => {
    try {
      if (!reportedUserId) {
        throw new Error('Cannot submit report: Missing user ID');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to report content');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/reports`,
        {
          reportedUserId,
          challengeId,
          reason: 'Flagged for review'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        alert('Report submitted successfully');
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error.response?.data?.message || error.message || 'Failed to submit report');
    }
  };

  return (
    <button 
      className="report-button"
      onClick={handleReport}
      title="Report this content"
      disabled={!reportedUserId}
    >
      <i className="fas fa-flag"></i> Report
    </button>
  );
};

export default ReportButton; 