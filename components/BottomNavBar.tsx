import React from 'react';
import { HomeIcon, CloudIcon, SparklesIcon, ShoppingCartIcon, UserCircleIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

type View = 'dashboard' | 'weather' | 'market' | 'profile';

interface BottomNavBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onChatClick: () => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400'
    }`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setActiveView, onChatClick }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-full relative">
        <NavItem label={t('home')} icon={<HomeIcon />} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <NavItem label={t('weather')} icon={<CloudIcon />} isActive={activeView === 'weather'} onClick={() => setActiveView('weather')} />

        <div className="w-16 h-16">
          <button
            onClick={onChatClick}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-green-600 transition-transform duration-200 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700"
            aria-label={t('openAIAssistant')}
          >
            <SparklesIcon className="w-8 h-8" />
          </button>
        </div>

        <NavItem label={t('market')} icon={<ShoppingCartIcon />} isActive={activeView === 'market'} onClick={() => setActiveView('market')} />
        <NavItem label={t('profile')} icon={<UserCircleIcon />} isActive={activeView === 'profile'} onClick={() => setActiveView('profile')} />
      </div>
    </div>
  );
};

export default BottomNavBar;