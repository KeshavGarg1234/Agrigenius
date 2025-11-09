
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SensorData } from '../types';
import { getUserData } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const POLLING_INTERVAL = 5000; // Fetch data every 5 seconds

// Raw data structure from the Google Apps Script
interface RawSensorData {
  Nitrogen: number;
  Phosphorus: number;
  Potassium: number;
  Temp: number;
  Humidity: number;
  Moisture: number;
}

const useSensorData = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isInitialFetch = useRef(true);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setError("No user is logged in.");
      if (isInitialFetch.current) {
        setIsLoading(false);
        isInitialFetch.current = false;
      }
      return;
    }

    const userData = await getUserData(currentUser.uid);
    const scriptUrl = userData?.scriptUrl;

    if (!scriptUrl) {
      setError('URL is not configured.');
      setData(null); // Clear any stale data if URL is removed
      if (isInitialFetch.current) {
        setIsLoading(false);
        isInitialFetch.current = false;
      }
      return;
    }

    // Only show the main loading skeleton on the very first fetch
    if (isInitialFetch.current) {
      setIsLoading(true);
    }

    try {
      // Make fetch request more robust
      const response = await fetch(scriptUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
      const rawData: RawSensorData = await response.json();
      
      // Validate the structure of the fetched data
      if (
        typeof rawData.Nitrogen !== 'number' ||
        typeof rawData.Phosphorus !== 'number' ||
        typeof rawData.Potassium !== 'number' ||
        typeof rawData.Temp !== 'number' ||
        typeof rawData.Humidity !== 'number' ||
        typeof rawData.Moisture !== 'number'
      ) {
        throw new Error('Invalid data format received from the server.');
      }
      
      // Map the raw data to our app's data structure (PascalCase to camelCase)
      const formattedData: SensorData = {
        nitrogen: rawData.Nitrogen,
        phosphorus: rawData.Phosphorus,
        potassium: rawData.Potassium,
        temperature: rawData.Temp,
        humidity: rawData.Humidity,
        moisture: rawData.Moisture,
      };

      setData(formattedData);
      setLastUpdated(new Date());
      setError(null); // Clear previous errors on a successful fetch
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
      let message = 'An unknown error occurred.';
      if (err instanceof Error) {
        message = err.message;
      }

      // Check for a common CORS error signature
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        message = 'A network error occurred. This could be a CORS issue or a lost connection. Please ensure your Google Apps Script is deployed correctly.';
      }
      
      setError(`Failed to fetch sensor data. ${message}`);
    } finally {
      // Ensure loading is always turned off after the first attempt
      if (isInitialFetch.current) {
        setIsLoading(false);
        isInitialFetch.current = false;
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData(); // Fetch initial data
    const intervalId = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const refetch = useCallback(() => {
    isInitialFetch.current = true; // Reset for refetch to show loading
    setData(null);
    setError(null);
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, lastUpdated, refetch };
};

export default useSensorData;
