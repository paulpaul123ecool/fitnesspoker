import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateChallenge from './CreateChallenge';
import OngoingChallenges from './OngoingChallenges';
import AllChallenges from './AllChallenges';
import Profile from './Profile';
import Chats from './Chats';
import './Dashboard.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState('main');

  const renderContent = () => {
    switch (currentView) {
      case 'createChallenge':
        return <CreateChallenge onBack={() => setCurrentView('main')} />;
      case 'ongoingChallenges':
        return <OngoingChallenges onBack={() => setCurrentView('main')} />;
      case 'allChallenges':
        return <AllChallenges onBack={() => setCurrentView('main')} onNavigateToOngoing={() => setCurrentView('ongoingChallenges')} />;
      case 'profile':
        return <Profile onBack={() => setCurrentView('main')} />;
      case 'chats':
        return <Chats onBack={() => setCurrentView('main')} />;
      default:
        return (
          <div className="dashboard-main">
            <div className="dashboard-buttons">
              <button onClick={() => setCurrentView('createChallenge')}>
                Create Challenge
              </button>
              <button onClick={() => setCurrentView('ongoingChallenges')}>
                Ongoing Challenges
              </button>
              <button onClick={() => setCurrentView('allChallenges')}>
                All Active Challenges
              </button>
              <button onClick={() => setCurrentView('profile')}>
                Profile
              </button>
              <button onClick={() => setCurrentView('chats')}>
                Chats
              </button>
            </div>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {renderContent()}
    </div>
  );
};

export default Dashboard; 