import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminReports.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_BASE_URL}/api/reports`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Fetched reports:', response.data); // Add logging
        if (response.data) {
          setReports(response.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError(error.response?.data?.message || 'Failed to fetch reports');
        setLoading(false);
      }
    };

    fetchReports();
    // Poll for new reports every minute
    const interval = setInterval(fetchReports, 60000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleBanUser = (userId) => {
    // Placeholder for ban functionality
    console.log('Ban user clicked for:', userId);
    alert('Ban functionality will be implemented in the future');
  };

  if (loading) {
    return (
      <div className="admin-reports">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-reports">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="admin-reports">
        <h2>Reported Users</h2>
        <div className="no-reports">No reports found</div>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      <h2>Reported Users</h2>
      <div className="reports-list">
        {reports.map(report => (
          <div key={report._id} className="report-card">
            <div className="reported-user">
              <h3>Reported User: {report.reportedUserId}</h3>
              <p>Reported by: {report.reporterId}</p>
              <p>Reason: {report.reason}</p>
              <p>Status: {report.status}</p>
              <p>Date: {new Date(report.createdAt).toLocaleString()}</p>
              {report.challengeId && (
                <p>Challenge ID: {report.challengeId}</p>
              )}
              <button 
                onClick={() => handleBanUser(report.reportedUserId)}
                className="ban-button"
              >
                Ban This User
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports; 