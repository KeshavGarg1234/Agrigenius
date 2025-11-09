

import { GoogleGenAI, Type } from '@google/genai';
import type { SensorData, FarmLocation, WeatherData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY is not set. Please set the environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const bcp47Map: { [key: string]: string } = {
  'en': 'en-US', 'hi': 'hi-IN', 'bn': 'bn-IN', 'ta': 'ta-IN', 'te': 'te-IN',
  'mr': 'mr-IN', 'gu': 'gu-IN', 'kn': 'kn-IN', 'pa': 'pa-IN', 'ml': 'ml-IN'
};

export const analyzeCropImage = async (
    prompt: string, 
    image: File | null, 
    sensorData: SensorData | null, 
    location: FarmLocation | null, 
    weatherData: WeatherData | null, 
    language: string
): Promise<{ text: string; lang: string; }> => {
    if (!API_KEY) {
        return { text: "API Key is not configured. Please contact support.", lang: 'en-US' };
    }
  
  const preferredLanguageCode = bcp47Map[language] || 'en-US';

  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are AgriGenius, a world-class AI agricultural expert specializing in plant pathology and crop management for farmers.
  
**Core Instructions:**
1.  **Analyze Image:** If an image is provided, identify diseases, pests, or nutrient deficiencies. Provide clear, simple names. If uncertain, state the most likely possibilities.
2.  **Provide Solutions:**
    *   **Chemical Solution:** Recommend a specific, common pesticide or treatment.
    *   **Organic Solution:** Describe a practical organic remedy if available.
3.  **Give Recommendations:** Suggest fertilizers or care changes for recovery and prevention.
4.  **Use Sensor Data:** If sensor data is provided, it is a **primary context**. Your advice MUST be based on these readings (e.g., "Nitrogen is low, so plant legumes," or "High humidity increases fungal risk, so improve air circulation.").
5.  **Incorporate Location and Weather:** If location and weather data are provided, use them to tailor your advice. For example, if it's rainy, suggest fungicide applications. If a heatwave is forecasted, recommend irrigation. Weave this context naturally into your response, mentioning things like "with the upcoming rain" or "given the current heat."
6.  **General Advice:** If no image or specific query is given, provide a helpful, relevant tip based on the sensor data, location, and weather.

**Language and Formatting Rules:**
- **CRITICAL:** Your final output must be a single, valid JSON object. Do not include any text or markdown formatting like \`\`\`json before or after the object.
- The JSON object must have two keys: "responseText" and "languageCode".
- **"responseText":** This must contain your complete, user-facing answer, formatted with headings (e.g., '**Disease:**') and bullet points for readability.
- **"languageCode":** This must contain the BCP 47 code for the language you used in "responseText".
- **IMPORTANT:** The user's preferred language is ${preferredLanguageCode}. Always respond in the same language as the user's prompt. If the prompt's language is unclear, default to the user's preferred language.
- Use these codes for common Indian languages: Hindi: 'hi-IN', Bengali: 'bn-IN', Tamil: 'ta-IN', Telugu: 'te-IN', Marathi: 'mr-IN', Gujarati: 'gu-IN', Kannada: 'kn-IN', Punjabi: 'pa-IN', Malayalam: 'ml-IN'. For English, use 'en-US'. If you detect another language, use its appropriate BCP 47 code.

**Example JSON output for a Hindi prompt:**
{
  "responseText": "**रोग:** पाउडरी मिल्ड्यू\\n**समाधान:** कवकनाशी का प्रयोग करें।\\n**जैविक समाधान:** नीम तेल का छिड़काव करें।",
  "languageCode": "hi-IN"
}
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        responseText: { type: Type.STRING },
        languageCode: { type: Type.STRING },
    },
    required: ["responseText", "languageCode"],
  };

  const parts = [];
  
  if (image) {
    const imagePart = await fileToGenerativePart(image);
    parts.push(imagePart);
  }

  let fullPrompt = prompt || (image ? "Please analyze this crop image." : "Hello!");

  let context = '';

    if (sensorData) {
        context += `
**Live Sensor Data:**
- Nitrogen (N): ${sensorData.nitrogen}
- Phosphorus (P): ${sensorData.phosphorus}
- Potassium (K): ${sensorData.potassium}
- Temperature: ${sensorData.temperature.toFixed(1)}°C
- Humidity: ${sensorData.humidity.toFixed(1)}%
- Soil Moisture: ${sensorData.moisture.toFixed(1)}%
`;
    }

    if (location) {
        context += `
**Farm Location:**
- Latitude: ${location.lat.toFixed(4)}
- Longitude: ${location.lon.toFixed(4)}
`;
    }

    if (weatherData) {
        context += `
**Current & Forecasted Weather:**
- Current Condition: ${weatherData.current.condition} at ${weatherData.current.temperature.toFixed(1)}°C
- Today's Forecast: High of ${weatherData.daily[0].maxTemp.toFixed(1)}°C, Low of ${weatherData.daily[0].minTemp.toFixed(1)}°C. Condition: ${weatherData.daily[0].condition}.
- Next 5 Days Summary: Conditions will generally be ${[...new Set(weatherData.daily.map(d => d.condition.toLowerCase()))].join(', ')}.
`;
    }

    if (context) {
        fullPrompt = `
Here is the context for my farm. Use this to provide the most relevant and tailored advice.
${context}

**User's Question:** ${fullPrompt}
`;
    }


  parts.push({ text: fullPrompt });

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    const responseText = response.text.trim();
    const parsedResponse = JSON.parse(responseText);

    return {
        text: parsedResponse.responseText || "I couldn't generate a proper response.",
        lang: parsedResponse.languageCode || "en-US",
    };

  } catch (error) {
    console.error("Gemini API call failed:", error);
    // It's possible the model failed to return valid JSON. Provide a fallback.
    if (error instanceof SyntaxError) {
        return { text: "Sorry, I received an invalid response from the server. Please try again.", lang: "en-US"};
    }
    throw new Error("Failed to get a response from the AI model.");
  }
};

// WMO Weather interpretation codes mapping
const wmoCodeToDescription = (code: number, lang: string): string => {
    const descriptions: { [key: number]: { en: string; hi: string; } } = {
        0: { en: 'Clear sky', hi: 'साफ आसमान' },
        1: { en: 'Mainly clear', hi: 'मुख्य रूप से साफ' },
        2: { en: 'Partly cloudy', hi: 'आंशिक रूप से बादल' },
        3: { en: 'Overcast', hi: 'घने बादल' },
        45: { en: 'Fog', hi: 'कोहरा' },
        48: { en: 'Rime fog', hi: 'जमने वाला कोहरा' },
        51: { en: 'Light Drizzle', hi: 'हलकी बूंदाबांदी' },
        53: { en: 'Moderate Drizzle', hi: 'मध्यम बूंदाबांदी' },
        55: { en: 'Dense Drizzle', hi: 'घनी बूंदाबांदी' },
        61: { en: 'Slight Rain', hi: 'हलकी बारिश' },
        63: { en: 'Moderate Rain', hi: 'मध्यम बारिश' },
        65: { en: 'Heavy Rain', hi: 'भारी बारिश' },
        71: { en: 'Slight Snow', hi: 'हलकी बर्फबारी' },
        73: { en: 'Moderate Snow', hi: 'मध्यम बर्फबारी' },
        75: { en: 'Heavy Snow', hi: 'भारी बर्फबारी' },
        80: { en: 'Slight Rain Showers', hi: 'हलकी बौछारें' },
        81: { en: 'Moderate Rain Showers', hi: 'मध्यम बौछारें' },
        82: { en: 'Violent Rain Showers', hi: 'तेज बौछारें' },
        95: { en: 'Thunderstorm', hi: 'आंधी-तूफान' },
        96: { en: 'Thunderstorm with Hail', hi: 'ओलावृष्टि के साथ आंधी' },
        99: { en: 'Thunderstorm with Hail', hi: 'ओलावृष्टि के साथ आंधी' },
    };
    const langKey = lang.startsWith('hi') ? 'hi' : 'en';
    return descriptions[code]?.[langKey] || 'Cloudy'; // Fallback to a generic description
};

export const getWeatherForecast = async (location: FarmLocation, language: string): Promise<WeatherData> => {
    const baseUrl = 'https://api.open-meteo.com/v1/forecast';
    const params = new URLSearchParams({
        latitude: location.lat.toString(),
        longitude: location.lon.toString(),
        // Get all necessary data in hourly forecast to be more robust
        hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: '5',
    });

    const url = `${baseUrl}?${params.toString()}`;

    try {
        const response = await fetch(url, { mode: 'cors', cache: 'no-cache' });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Weather API request failed with status ${response.status}: ${errorBody}`);
        }
        const data = await response.json();
        
        if (!data.hourly || !data.hourly.time || !data.daily || !data.daily.time) {
             throw new Error("Invalid data format received from weather service.");
        }

        // Find the index of the current hour by finding the last time entry that is in the past.
        const nowInSeconds = Math.floor(Date.now() / 1000);
        let currentHourIndex = 0; 
        for (let i = data.hourly.time.length - 1; i >= 0; i--) {
            const hourlyTimeInSeconds = Math.floor(new Date(data.hourly.time[i]).getTime() / 1000);
            if (hourlyTimeInSeconds <= nowInSeconds) {
                currentHourIndex = i;
                break;
            }
        }

        const currentData: WeatherData['current'] = {
             temperature: data.hourly.temperature_2m[currentHourIndex],
             condition: wmoCodeToDescription(data.hourly.weather_code[currentHourIndex], language),
             humidity: data.hourly.relative_humidity_2m[currentHourIndex],
             windSpeed: data.hourly.wind_speed_10m[currentHourIndex],
        };

        const hourlyForecast: WeatherData['hourly'] = data.hourly.time
            .slice(currentHourIndex, currentHourIndex + 8)
            .map((time: string, index: number) => {
                const realIndex = currentHourIndex + index;
                if (realIndex >= data.hourly.time.length) return null; 
                return {
                    time: new Date(time).toLocaleTimeString(language, { hour: 'numeric', hour12: true }),
                    temperature: data.hourly.temperature_2m[realIndex],
                    condition: wmoCodeToDescription(data.hourly.weather_code[realIndex], language),
                };
            }).filter(Boolean) as WeatherData['hourly'];
        
        const dailyForecast: WeatherData['daily'] = data.daily.time.map((date: string, index: number) => {
             const dateObj = new Date(`${date}T00:00:00`);
             return {
                day: new Intl.DateTimeFormat(language, { weekday: 'long' }).format(dateObj),
                minTemp: data.daily.temperature_2m_min[index],
                maxTemp: data.daily.temperature_2m_max[index],
                condition: wmoCodeToDescription(data.daily.weather_code[index], language),
             };
        });

        const weatherData: WeatherData = {
            current: currentData,
            hourly: hourlyForecast,
            daily: dailyForecast,
        };

        return weatherData;

    } catch (error) {
        console.error("Open-Meteo API call failed:", error);
        throw new Error("Failed to get weather forecast from the weather service. Please check the network connection and try again.");
    }
};