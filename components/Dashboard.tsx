
import React, { useMemo, useState, useEffect } from 'react';
import type { SensorData } from '../types';
import { getUserData } from '../services/firebaseService';
import { SunIcon, DropletIcon, ThermometerIcon, LeafIcon, ClockIcon, ExclamationTriangleIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';

type View = 'dashboard' | 'weather' | 'market' | 'profile';

const SensorCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-xl shadow-md flex items-center space-x-4 animate-pulse">
      <div className="p-3 rounded-full bg-gray-300 dark:bg-gray-600 w-12 h-12"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    </div>
);

const ErrorDisplay: React.FC<{ message: string; onNavigateToSettings: () => void; }> = ({ message, onNavigateToSettings }) => {
  const { t } = useTranslation();
  return (
    <div className="col-span-2 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md shadow-md" role="alert">
      <p className="font-bold">{t('dataError')}</p>
      <p>{message}</p>
      <button onClick={onNavigateToSettings} className="mt-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 py-1 px-3 rounded-md">
          {t('goToSettings')}
      </button>
    </div>
  );
};

const StatusIndicator: React.FC<{ isLoading: boolean; error: string | null; lastUpdated: Date | null }> = ({ isLoading, error, lastUpdated }) => {
    const { t } = useTranslation();
    if (isLoading && !lastUpdated) {
        return <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{t('fetchingLiveData')}</p>;
    }
    if (error && lastUpdated) {
        return (
            <div className="mt-1 text-xs flex items-center text-yellow-600 dark:text-yellow-400">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1.5" />
                <span>{t('connectionIssue', { time: lastUpdated.toLocaleTimeString() })}</span>
            </div>
        );
    }
    if (lastUpdated) {
        return (
             <div className="mt-1 text-xs flex items-center text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-4 h-4 mr-1.5 text-green-500" />
                <span>{t('lastUpdated', { time: lastUpdated.toLocaleTimeString() })}</span>
            </div>
        );
    }
    return null;
};

const AdviceCard: React.FC<{ sensorData: SensorData | null }> = ({ sensorData }) => {
    const { t } = useTranslation();
    const advice = useMemo(() => {
        if (!sensorData) {
            return t('adviceWaiting');
        }

        const advicePoints: string[] = [];

        if (sensorData.humidity > 75) advicePoints.push(t('adviceHighHumidity'));
        if (sensorData.moisture < 30) advicePoints.push(t('adviceLowMoisture'));
        if (sensorData.temperature > 30) advicePoints.push(t('adviceHighTemp'));
        if (sensorData.nitrogen < 50) advicePoints.push(t('adviceLowNitro'));
        if (sensorData.potassium < 50) advicePoints.push(t('adviceLowPotassium'));

        if (advicePoints.length === 0) {
            return t('adviceOptimal');
        }

        return advicePoints.join(' ');

    }, [sensorData, t]);

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h2 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{t('todaysAdvice')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                {advice}
            </p>
        </div>
    );
};


interface DashboardProps {
  sensorData: SensorData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
  setActiveView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ sensorData, isLoading, error, lastUpdated, refetch, setActiveView }) => {
  const { currentUser } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
      const checkConfiguration = async () => {
          if (currentUser) {
              const data = await getUserData(currentUser.uid);
              setIsConfigured(!!data?.scriptUrl);
          }
      };
      checkConfiguration();
  }, [currentUser]);

  const renderContent = () => {
    if (isLoading && !sensorData) {
        return <>
            <LoadingSkeleton /><LoadingSkeleton />
            <LoadingSkeleton /><LoadingSkeleton />
            <LoadingSkeleton /><LoadingSkeleton />
        </>;
    }

    if (error && !sensorData) {
        return <ErrorDisplay message={error} onNavigateToSettings={() => setActiveView('profile')} />;
    }

    if (sensorData) {
        return <>
            <SensorCard icon={<LeafIcon className="text-white w-6 h-6" />} label={t('nitrogen')} value={`${sensorData.nitrogen}`} color="bg-teal-500" />
            <SensorCard icon={<LeafIcon className="text-white w-6 h-6" />} label={t('phosphorus')} value={`${sensorData.phosphorus}`} color="bg-orange-500" />
            <SensorCard icon={<LeafIcon className="text-white w-6 h-6" />} label={t('potassium')} value={`${sensorData.potassium}`} color="bg-indigo-500" />
            <SensorCard icon={<ThermometerIcon className="text-white w-6 h-6" />} label={t('temperature')} value={`${sensorData.temperature.toFixed(1)}°C`} color="bg-red-500" />
            <SensorCard icon={<DropletIcon className="text-white w-6 h-6" />} label={t('humidity')} value={`${sensorData.humidity.toFixed(1)}%`} color="bg-blue-500" />
            <SensorCard icon={<SunIcon className="text-white w-6 h-6" />} label={t('moisture')} value={`${sensorData.moisture.toFixed(1)}%`} color="bg-yellow-500" />
        </>;
    }
    
    return null;
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('farmOverview')}</h1>
         {isConfigured && (
            <>
                <p className="text-gray-500 dark:text-gray-400">{t('liveData')}</p>
                <StatusIndicator isLoading={isLoading} error={error} lastUpdated={lastUpdated} />
            </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {renderContent()}
      </div>

      <AdviceCard sensorData={sensorData} />
      
       <div className="mt-8">
        <img src="https://picsum.photos/400/200?random=1" alt="Farm" className="rounded-xl shadow-md w-full object-cover"/>
      </div>
    </div>
  );
};

export default Dashboard;