import React, { useState, useEffect } from 'react';
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
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

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

    fetchReports();
  }, [user, navigate]);

  const handleUpdateStatus = async (reportId, newStatus) => {
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
      alert('Failed to update report status');
    }
  };

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-reports">
      <h1>Report Management</h1>
      <div className="reports-container">
        {reports.length === 0 ? (
          <p className="no-reports">No reports found</p>
        ) : (
          reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <h2>Report #{report._id}</h2>
                <span className={`status ${report.status}`}>{report.status}</span>
              </div>
              
              <div className="report-details">
                <div className="user-info">
                  <h3>Reporter</h3>
                  <p>{report.reporterId.name || 'Unknown User'}</p>
                </div>
                
                <div className="user-info">
                  <h3>Reported User</h3>
                  <p>{report.reportedUserId.name || 'Unknown User'}</p>
                </div>

                {report.challengeId && (
                  <div className="challenge-info">
                    <h3>Challenge Information</h3>
                    <p><strong>Name:</strong> {report.challengeId.name}</p>
                    <p><strong>Description:</strong> {report.challengeId.description}</p>
                  </div>
                )}

                <div className="report-reason">
                  <h3>Report Reason</h3>
                  <p>{report.reason}</p>
                </div>

                {report.videoUrl && (
                  <div className="video-container">
                    <h3>Reported Video</h3>
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

                <div className="report-actions">
                  <button
                    onClick={() => handleUpdateStatus(report._id, 'reviewed')}
                    className={`action-button ${report.status === 'reviewed' ? 'active' : ''}`}
                    disabled={report.status === 'reviewed'}
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                    className={`action-button ${report.status === 'dismissed' ? 'active' : ''}`}
                    disabled={report.status === 'dismissed'}
                  >
                    Dismiss Report
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReports; 