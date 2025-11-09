
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { SparklesIcon } from './icons/Icons';

const LoginScreen: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // for registration
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLoginView) {
        if (!email || !password) {
            setError("Please enter email and password.");
            setIsLoading(false); // Stop loading on client-side validation failure
            return;
        }
        await login(email, password);
      } else {
        if (!name || !email || !password) {
            setError("Please fill in all fields.");
            setIsLoading(false); // Stop loading on client-side validation failure
            return;
        }
        await register(email, name, password);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage.includes('auth/invalid-credential')) {
        setError('Error: Invalid Credentials');
      } else {
        setError(errorMessage);
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
            <SparklesIcon className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">AgriGenius</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('yourAIFarmAssistant')}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
            {isLoginView ? t('welcomeBack') : t('createAccount')}
          </h2>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLoginView && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('fullName')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('emailAddress')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLoginView ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                {isLoading ? 'Processing...' : (isLoginView ? t('signIn') : t('signUp'))}
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLoginView ? t('noAccount') : t('haveAccount')}{' '}
            <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-medium text-green-600 hover:text-green-500">
              {isLoginView ? t('signUp') : t('signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
