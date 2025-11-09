export const supportedLanguages = {
  'en': 'English',
  'hi': 'हिन्दी', // Hindi
  'bn': 'বাংলা', // Bengali
  'ta': 'தமிழ்', // Tamil
  'te': 'తెలుగు', // Telugu
  'mr': 'मराठी', // Marathi
  'gu': 'ગુજરાતી', // Gujarati
  'kn': 'ಕನ್ನಡ', // Kannada
  'pa': 'ਪੰਜਾਬੀ', // Punjabi
  'ml': 'മലയാളം' // Malayalam
};

export type LanguageCode = keyof typeof supportedLanguages;

export interface SensorData {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  moisture: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  image?: string; // base64 encoded image for display
  lang?: string; // BCP 47 language code, e.g., 'en-US', 'hi-IN'
  timestamp: Date;
  status?: 'sent' | 'delivered';
}

export interface FarmLocation {
  lat: number;
  lon: number;
}

export interface ProfileData {
  name: string;
  email: string;
  farmSize?: string;
  scriptUrl?: string;
  farmLocation?: FarmLocation;
  profileImage?: string;
  language?: LanguageCode;
}

export interface CurrentWeather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
}

export interface DailyForecast {
  day: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}