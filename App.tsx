

import React, { useState, useCallback } from 'react';
import useSensorData from './hooks/useSensorData';
import BottomNavBar from './components/BottomNavBar';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import ChatModal from './components/ChatModal';
import Weather from './components/Weather';
import Market from './components/Market';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

type View = 'dashboard' | 'weather' | 'market' | 'profile';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
    </div>
);

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { data: sensorData, isLoading, error, lastUpdated, refetch } = useSensorData();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sensorData={sensorData} isLoading={isLoading} error={error} lastUpdated={lastUpdated} refetch={refetch} setActiveView={setActiveView} />;
      case 'weather':
        return <Weather setActiveView={setActiveView} />;
      case 'market':
        return <Market />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard sensorData={sensorData} isLoading={isLoading} error={error} lastUpdated={lastUpdated} refetch={refetch} setActiveView={setActiveView} />;
    }
  };

  const handleChatToggle = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white dark:bg-gray-800 flex flex-col font-sans shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>
      <BottomNavBar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onChatClick={handleChatToggle} 
      />
      {isChatOpen && <ChatModal onClose={handleChatToggle} sensorData={sensorData} />}
    </div>
  );
};

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <AppContent />;
};


export default App;