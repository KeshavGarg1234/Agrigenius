
import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, MapPinIcon, ViewfinderCircleIcon, Cog6ToothIcon, LanguageIcon, PencilIcon, CheckIcon, CameraIcon } from './icons/Icons';
import { getUserData, updateUserData, uploadProfileImage } from '../services/firebaseService';
import { useTranslation } from '../hooks/useTranslation';
import { type LanguageCode } from '../types';
import { supportedLanguages } from '../types';
import MapModal from './MapModal';
import type { FarmLocation, ProfileData } from '../types';
import { useAuth } from '../context/AuthContext';

const ProfileInfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-4 py-3">
        <div className="text-green-500 dark:text-green-400">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <div className="font-semibold text-gray-800 dark:text-white">{value}</div>
        </div>
    </div>
);


const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  
  // Local state for UI
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for user data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUserData = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const data = await getUserData(currentUser.uid);
        if (data) {
            setProfile(data);
            if (data.language) {
                setSelectedLanguage(data.language);
            }
        }
        setIsLoading(false);
    };
    loadUserData();
  }, [currentUser]);
  
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);
  
  const handleLocationSave = (newLocation: FarmLocation) => {
    if (!currentUser) return;
    setProfile(prev => prev ? { ...prev, farmLocation: newLocation } : null);
    setIsMapModalOpen(false);
  };

  const handleEditToggle = async () => {
    if (isEditing) {
        if (!currentUser || !profile) return;
        
        // Ensure no `undefined` values are passed to Firebase, which causes an error.
        // Coalesce undefined values to a Firebase-friendly format ('' or null).
        const updatedData: { [key: string]: any } = {
            name: profile.name,
            farmSize: profile.farmSize ?? '',
            farmLocation: profile.farmLocation ?? null,
            scriptUrl: profile.scriptUrl ?? '',
            language: selectedLanguage,
        };
        
        if (imageFile) {
            const imageUrl = await uploadProfileImage(currentUser.uid, imageFile);
            updatedData.profileImage = imageUrl;
            setProfile(p => p ? {...p, profileImage: imageUrl} : null);
            setImageFile(null);
            setImagePreview(null);
        } else {
            // Ensure existing profile image value is also valid
            updatedData.profileImage = profile.profileImage ?? '';
        }

        await updateUserData(currentUser.uid, updatedData as Partial<ProfileData>);
        
        if (language !== selectedLanguage) {
            setLanguage(selectedLanguage);
        }
    }
    setIsEditing(!isEditing);
  };
  
  const handleImageClick = () => {
    if (isEditing) {
        fileInputRef.current?.click();
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  }

  if (isLoading) {
      return <div className="p-4 text-center">Loading profile...</div>;
  }
  
  if (!profile) {
      return <div className="p-4 text-center">Could not load profile.</div>;
  }

  return (
    <>
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full relative">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />
      <div className="absolute top-4 right-4 z-10">
        <button 
            onClick={handleEditToggle}
            className="p-2 rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
            aria-label={isEditing ? t('saveChanges') : t('editProfile')}
        >
            {isEditing ? <CheckIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-center mb-8 pt-8">
        <div 
            className={`relative inline-block group ${isEditing ? 'cursor-pointer' : ''}`}
            onClick={handleImageClick}
        >
            <img 
                src={imagePreview || profile.profileImage || `https://ui-avatars.com/api/?name=${profile.name}&background=0D8ABC&color=fff&size=128`} 
                alt="Profile" 
                className="w-32 h-32 rounded-full mx-auto border-4 border-green-500 object-cover"
            />
            {isEditing && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                    <CameraIcon className="w-8 h-8 text-white" />
                </div>
            )}
        </div>
        {isEditing ? (
            <input 
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="text-2xl font-bold text-gray-800 dark:text-white mt-4 bg-transparent text-center border-b-2 border-green-500 focus:outline-none w-full max-w-xs"
                aria-label={t('username')}
            />
        ) : (
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">{profile.name}</h1>
        )}
        <p className="text-gray-500 dark:text-gray-400">{t('premiumFarmer')}</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md divide-y divide-gray-200 dark:divide-gray-700">
        <ProfileInfoRow icon={<UserCircleIcon />} label={t('emailAddress')} value={profile.email} />
         <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
                <div className="text-green-500 dark:text-green-400">
                    <MapPinIcon />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('location')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white text-xs sm:text-base">
                        {profile.farmLocation
                            ? `${t('latitude')}: ${profile.farmLocation.lat.toFixed(4)}, ${t('longitude')}: ${profile.farmLocation.lon.toFixed(4)}`
                            : t('locationNotSet')}
                    </p>
                </div>
            </div>
            {isEditing && (
              <button 
                onClick={() => setIsMapModalOpen(true)} 
                className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 px-3 py-1 rounded-md bg-green-100 dark:bg-green-900/50 whitespace-nowrap"
              >
                  {profile.farmLocation ? t('updateLocation') : t('setLocation')}
              </button>
            )}
        </div>
        <ProfileInfoRow 
            icon={<ViewfinderCircleIcon />} 
            label={t('farmSize')} 
            value={isEditing ? (
                <input 
                    type="text"
                    value={profile.farmSize || ''}
                    onChange={(e) => handleProfileChange('farmSize', e.target.value)}
                    className="font-semibold bg-transparent border-b border-gray-400 dark:border-gray-500 focus:outline-none focus:border-green-500 w-full text-gray-800 dark:text-white"
                    aria-label={t('farmSize')}
                />
            ) : profile.farmSize || 'Not set'}
        />
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center space-x-2 text-gray-800 dark:text-white">
          <LanguageIcon className="w-6 h-6" />
          <h2 className="text-lg font-bold">{t('languageSettings')}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('languageSettingsDesc')}</p>
        <div className="flex flex-col space-y-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
              aria-label={t('languageSettings')}
              disabled={!isEditing}
            >
              {Object.entries(supportedLanguages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center space-x-2 text-gray-800 dark:text-white">
          <Cog6ToothIcon className="w-6 h-6" />
          <h2 className="text-lg font-bold">{t('sensorConfig')}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('sensorConfigDesc')}
        </p>
        <div className="flex flex-col space-y-2">
          <input
            type="url"
            value={profile.scriptUrl || ''}
            onChange={(e) => handleProfileChange('scriptUrl', e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="mt-8 mb-4">
        <button
            onClick={logout}
            className="w-full text-center py-3 px-4 rounded-xl text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
        >
            {t('logout')}
        </button>
      </div>

    </div>
    {isMapModalOpen && <MapModal onClose={() => setIsMapModalOpen(false)} onSave={handleLocationSave} />}
    </>
  );
};

export default Profile;
