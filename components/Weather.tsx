
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getUserData } from '../services/firebaseService';
import { getWeatherForecast } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';
import type { FarmLocation, WeatherData } from '../types';
import { MapPinIcon, SunIcon, CloudIcon, MoonIcon, WindIcon, CloudRainIcon, CloudLightningIcon, CloudSnowIcon, CloudFogIcon, DropletIcon } from './icons/Icons';
import { useAuth } from '../context/AuthContext';

type View = 'dashboard' | 'weather' | 'market' | 'profile';

interface WeatherProps {
  setActiveView: (view: View) => void;
}

const getWeatherIcon = (condition: string, className: string = 'w-10 h-10', isNight: boolean = false) => {
    const lowerCaseCondition = condition.toLowerCase();
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('sunny')) return <SunIcon className={className} />;
    if (lowerCaseCondition.includes('clear')) return isNight ? <MoonIcon className={className} /> : <SunIcon className={className} />;
    if (lowerCaseCondition.includes('thunder') || lowerCaseCondition.includes('storm')) return <CloudLightningIcon className={className} />;
    if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('drizzle') || lowerCaseCondition.includes('showers')) return <CloudRainIcon className={className} />;
    if (lowerCaseCondition.includes('snow') || lowerCaseCondition.includes('sleet')) return <CloudSnowIcon className={className} />;
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('overcast')) return <CloudIcon className={className} />;
    if (lowerCaseCondition.includes('fog') || lowerCaseCondition.includes('mist') || lowerCaseCondition.includes('haze')) return <CloudFogIcon className={className} />;
    if (lowerCaseCondition.includes('wind')) return <WindIcon className={className} />;
    return <CloudIcon className={className} />;
};

const Weather: React.FC<WeatherProps> = ({ setActiveView }) => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const [location, setLocation] = useState<FarmLocation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes

  const fetchWeather = useCallback(async (loc: FarmLocation) => {
    // Only show full loading screen on the very first fetch
    if (isFirstLoad.current) {
        setLoading(true);
    }
    setError(null);
    try {
      const data = await getWeatherForecast(loc, language);
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
        }
        setLoading(false); // Always turn off loading after any fetch attempt
    }
  }, [language]);

  // Effect to load user's location
  useEffect(() => {
    let isMounted = true;
    const loadLocation = async () => {
        if (!currentUser) {
            if (isMounted) setLoading(false);
            return;
        }
        const userData = await getUserData(currentUser.uid);
        if (isMounted) {
            if (userData?.farmLocation) {
                setLocation(userData.farmLocation);
            } else {
                setLoading(false);
            }
        }
    };
    loadLocation();
    
    return () => { isMounted = false; };
  }, [currentUser]);

  // Effect to fetch weather and set up auto-refresh interval
  useEffect(() => {
    if (!location) return;

    fetchWeather(location); // Initial fetch when location is available

    const intervalId = setInterval(() => {
        fetchWeather(location);
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount or if dependencies change
    return () => clearInterval(intervalId);
  }, [location, fetchWeather]);


  if (loading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('weatherForecast')}</h1>
        <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-full bg-gray-50 dark:bg-gray-900">
        <MapPinIcon className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('weatherForecast')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('setFarmLocationPrompt')}</p>
        <button
          onClick={() => setActiveView('profile')}
          className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors"
        >
          {t('goToProfile')}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400 h-full flex flex-col justify-center items-center">
        <p>{t('weatherError')}</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
        <button onClick={() => location && fetchWeather(location)} className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600">
            {t('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('weatherForecast')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{`${t('latitude')}: ${location.lat.toFixed(2)}, ${t('longitude')}: ${location.lon.toFixed(2)}`}</p>
      </div>
      
      {weatherData && (
        <>
          {/* Current Weather */}
          <div className="bg-gradient-to-br from-green-400 to-blue-500 dark:from-green-700 dark:to-blue-800 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="font-light">{t('now')}</p>
              <p className="text-5xl font-bold">{Math.round(weatherData.current.temperature - 1)}°C</p>
              <p className="font-semibold text-lg">{weatherData.current.condition}</p>
            </div>
            <div className="text-right">
                {getWeatherIcon(weatherData.current.condition, 'w-20 h-20')}
                <div className="text-xs mt-2 space-y-1 font-light">
                   <p className="flex items-center justify-end gap-1.5"><DropletIcon className="w-3 h-3"/> {weatherData.current.humidity}% {t('humidity')}</p>
                   <p className="flex items-center justify-end gap-1.5"><WindIcon className="w-3 h-3"/> {weatherData.current.windSpeed} km/h {t('wind')}</p>
                </div>
            </div>
          </div>

          {/* Hourly Forecast */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h2 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">{t('hourlyForecast')}</h2>
            <div className="flex overflow-x-auto space-x-4 pb-2 -mb-2">
              {weatherData.hourly.map((hour, index) => (
                <div key={index} className="flex flex-col items-center space-y-1 flex-shrink-0 w-20 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{hour.time}</p>
                  {getWeatherIcon(hour.condition, 'w-8 h-8 text-gray-700 dark:text-gray-300')}
                  <p className="font-bold text-gray-800 dark:text-white">{Math.round(hour.temperature - 1)}°</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Forecast */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h2 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{t('dailyForecast')}</h2>
            <div className="space-y-2">
              {weatherData.daily.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 w-1/3">{day.day}</p>
                  <div className="w-1/3 flex justify-center">
                    {getWeatherIcon(day.condition, 'w-7 h-7 text-gray-600 dark:text-gray-400')}
                  </div>
                  <div className="w-1/3 text-right">
                    <span className="font-bold text-gray-800 dark:text-white">{Math.round(day.maxTemp - 1)}°</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{Math.round(day.minTemp - 1)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Weather;
