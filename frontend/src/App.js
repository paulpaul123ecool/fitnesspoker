import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import Auth from './components/Auth';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import Challenge from './components/Challenge';
import AllChallenges from './components/AllChallenges';
import OngoingChallenges from './components/OngoingChallenges';
import Chats from './components/Chats';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
      console.log('User role:', user.role);
    }
  }, [user]);

  if (!user) {
    return <Auth />;
  }

  const handleNavigateToProfile = () => {
    setCurrentView('profile');
  };

  const handleNavigateToChallenge = () => {
    setCurrentView('challenge');
  };

  const handleNavigateToAllChallenges = () => {
    setCurrentView('allChallenges');
  };

  const handleNavigateToOngoing = () => {
    setCurrentView('ongoingChallenges');
  };

  const handleNavigateToChats = () => {
    setCurrentView('chats');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (currentView === 'profile') {
      return <Profile onBack={handleBackToDashboard} />;
    }

    if (currentView === 'challenge') {
      return <Challenge onBack={handleBackToDashboard} />;
    }

    if (currentView === 'allChallenges') {
      return <AllChallenges onBack={handleBackToDashboard} onNavigateToOngoing={handleNavigateToOngoing} />;
    }

    if (currentView === 'ongoingChallenges') {
      return <OngoingChallenges onBack={handleBackToDashboard} />;
    }

    if (currentView === 'chats') {
      return <Chats onBack={handleBackToDashboard} />;
    }

    if (user.role === 'admin') {
      console.log('Rendering AdminDashboard');
      return <AdminDashboard />;
    }

    console.log('Rendering UserDashboard');
    return (
      <UserDashboard 
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToChallenge={handleNavigateToChallenge}
        onNavigateToAllChallenges={handleNavigateToAllChallenges}
        onNavigateToOngoing={handleNavigateToOngoing}
        onNavigateToChats={handleNavigateToChats}
      />
    );
  };

  return renderContent();
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
