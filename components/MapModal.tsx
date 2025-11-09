import React, { useState } from 'react';
import type { FarmLocation } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { XIcon, LocateIcon, MapIcon, ArrowLeftIcon } from './icons/Icons';

interface MapModalProps {
  onClose: () => void;
  onSave: (location: FarmLocation) => void;
}

type Mode = 'options' | 'gps' | 'manual';
type GpsStatus = 'idle' | 'loading' | 'success' | 'error';

const MapModal: React.FC<MapModalProps> = ({ onClose, onSave }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('options');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [coords, setCoords] = useState<FarmLocation | null>(null);
  const [manualCoords, setManualCoords] = useState<{ lat: string; lon: string }>({ lat: '', lon: '' });
  const [manualError, setManualError] = useState<string | null>(null);


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(t('locationError', { error: 'Geolocation is not supported by your browser.'}));
      setGpsStatus('error');
      setMode('gps');
      return;
    }

    setMode('gps');
    setGpsStatus('loading');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCoords(newCoords);
        setGpsStatus('success');
      },
      (err) => {
        setGpsError(err.message);
        setGpsStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleManualSave = () => {
    const lat = parseFloat(manualCoords.lat);
    const lon = parseFloat(manualCoords.lon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setManualError(t('invalidCoordinates'));
        return;
    }
    setManualError(null);
    onSave({ lat, lon });
  }

  const renderGpsContent = () => {
    switch (gpsStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{t('gettingLocation')}</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
            <p className="font-semibold text-red-700 dark:text-red-300">{t('locationError', { error: gpsError || 'Unknown error' })}</p>
            <button onClick={handleGetLocation} className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600">
              {t('tryAgain')}
            </button>
          </div>
        );
      case 'success':
        return (
            <div className="text-center space-y-4">
                <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 font-semibold p-3 rounded-lg">
                  <p>{t('locationFound')}</p>
                  <p className="text-sm font-mono mt-1">{t('latitude')}: {coords?.lat.toFixed(6)}, {t('longitude')}: {coords?.lon.toFixed(6)}</p>
                </div>
                <button 
                    onClick={() => onSave(coords!)}
                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md hover:bg-green-600 transition-colors"
                >
                    {t('saveLocation')}
                </button>
            </div>
        );
      case 'idle':
        // This case is handled by the initial button click
        return null;
    }
  };

  const renderManualContent = () => (
    <div className="space-y-4">
        <div className="text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('manualEntryDesc')}</p>
            <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">
                {t('openGoogleMaps')}
            </a>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label htmlFor="latitude" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('latitude')}</label>
                <input
                    type="number"
                    id="latitude"
                    value={manualCoords.lat}
                    onChange={(e) => { setManualCoords(prev => ({ ...prev, lat: e.target.value })); setManualError(null); }}
                    placeholder={t('latitudePlaceholder')}
                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
            <div>
                <label htmlFor="longitude" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('longitude')}</label>
                <input
                    type="number"
                    id="longitude"
                    value={manualCoords.lon}
                    onChange={(e) => { setManualCoords(prev => ({ ...prev, lon: e.target.value })); setManualError(null); }}
                    placeholder={t('longitudePlaceholder')}
                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
        </div>
        {manualError && <p className="text-xs text-red-500 dark:text-red-400 text-center">{manualError}</p>}
        <button
            onClick={handleManualSave}
            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
            disabled={!manualCoords.lat || !manualCoords.lon}
        >
            {t('saveLocation')}
        </button>
    </div>
  );

  const renderOptionsContent = () => (
    <div className="space-y-4">
      <p className="text-sm text-center text-gray-600 dark:text-gray-300">{t('setFarmLocationDesc')}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <button
            onClick={handleGetLocation}
            className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-center p-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <LocateIcon className="w-10 h-10 text-green-500 mb-2" />
            <span className="font-bold text-gray-800 dark:text-white">{t('detectCurrentLocation')}</span>
        </button>
         <button
            onClick={() => setMode('manual')}
            className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-center p-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <MapIcon className="w-10 h-10 text-green-500 mb-2" />
            <span className="font-bold text-gray-800 dark:text-white">{t('locateOnMap')}</span>
        </button>
      </div>
    </div>
  );
  
  const getModalTitle = () => {
    if (mode === 'manual') return t('manualEntryTitle');
    return t('setFarmLocation');
  };

  return (
    <div 
        className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {mode !== 'options' && (
                <button onClick={() => setMode('options')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={t('goBackToOptions')}>
                    <ArrowLeftIcon className="text-gray-600 dark:text-gray-300 w-5 h-5" />
                </button>
            )}
          <h2 id="map-modal-title" className={`text-lg font-bold text-gray-800 dark:text-white ${mode === 'options' ? 'w-full text-center' : ''}`}>{getModalTitle()}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={t('goBack')}>
            <XIcon className="text-gray-600 dark:text-gray-300 w-5 h-5" />
          </button>
        </header>
        <div className="p-6">
            {mode === 'options' && renderOptionsContent()}
            {mode === 'gps' && renderGpsContent()}
            {mode === 'manual' && renderManualContent()}
        </div>
      </div>
    </div>
  );
};

export default MapModal;