


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeCropImage } from '../services/geminiService';
import type { ChatMessage, SensorData, FarmLocation, WeatherData } from '../types';
import { XIcon, SendIcon, CameraIcon, CheckIcon, DoubleCheckIcon, MicrophoneIcon, SpeakerWaveIcon, StopCircleIcon, SparklesIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';
import { getUserData } from '../services/firebaseService';
import { getWeatherForecast } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

interface ChatModalProps {
  onClose: () => void;
  sensorData: SensorData | null;
}

const FormattedBotMessage: React.FC<{ text: string }> = ({ text }) => {
  // Utility to parse for bold text
  const renderWithBold = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g).filter(part => part);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="text-sm text-gray-800 dark:text-gray-200 space-y-2">
      {text.split('\n').map((line, index) => {
        // Preserve paragraph breaks
        if (line.trim() === '') return <div key={index} className="h-2" />;

        const trimmedLine = line.trim();

        // Headings
        if (trimmedLine.startsWith('### ')) {
          const content = trimmedLine.substring(4);
          return (
            <h3 key={index} className="font-bold text-base text-gray-800 dark:text-gray-100 mt-2">
              {renderWithBold(content)}
            </h3>
          );
        }
        if (trimmedLine.startsWith('## ')) {
          const content = trimmedLine.substring(3);
          return (
            <h2 key={index} className="font-bold text-lg text-gray-800 dark:text-gray-100 mt-2">
              {renderWithBold(content)}
            </h2>
          );
        }
        if (trimmedLine.startsWith('# ')) {
            const content = trimmedLine.substring(2);
            return (
              <h1 key={index} className="font-bold text-xl text-gray-800 dark:text-gray-100 mt-2">
                {renderWithBold(content)}
              </h1>
            );
        }

        // List items
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          const content = trimmedLine.substring(2);
          const indentation = line.length - line.trimStart().length;
          const paddingLeft = `${indentation * 0.4}rem`;

          return (
            <div key={index} className="flex items-start" style={{ paddingLeft }}>
              <span className="mr-2 mt-1 shrink-0"> • </span>
              <span>{renderWithBold(content)}</span>
            </div>
          );
        }

        // Default paragraph
        return <p key={index}>{renderWithBold(line)}</p>;
      })}
    </div>
  );
};

const ChatModal: React.FC<ChatModalProps> = ({ onClose, sensorData }) => {
  const { language, t } = useTranslation();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // State for location and weather data
  const [location, setLocation] = useState<FarmLocation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with a welcome message.
  useEffect(() => {
    setMessages([
        {
            id: 'initial-welcome',
            sender: 'bot',
            text: t('yourAIFarmAssistant'),
            timestamp: new Date(),
            lang: language === 'en' ? 'en-US' : `${language}-IN`,
        }
    ]);
  }, [t, language]);
  
  // Fetch location and weather data on component mount
  useEffect(() => {
    const fetchLocationData = async () => {
        if (!currentUser) return;
        const userData = await getUserData(currentUser.uid);
        if (userData?.farmLocation) {
            setLocation(userData.farmLocation);
            try {
                const weather = await getWeatherForecast(userData.farmLocation, language);
                setWeatherData(weather);
            } catch (err) {
                 console.error("Failed to fetch weather for chat:", err)
            }
        }
    };
    fetchLocationData();
  }, [language, currentUser]);

  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Setup Speech Recognition, re-initialize if language changes
  useEffect(() => {
    // Stop any existing recognition instance
    if (recognitionRef.current) {
        isListeningRef.current = false;
        recognitionRef.current.stop();
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set language based on user's preference
      recognition.lang = language === 'en' ? 'en-US' : `${language}-IN`;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
        setSpeechError(null);
      };
      
      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (err) {
            console.error("Error restarting speech recognition:", err);
            isListeningRef.current = false;
            setIsListening(false);
            setIsDetectingSpeech(false);
          }
        } else {
          setIsDetectingSpeech(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            setSpeechError(t('speechPermissionError'));
        } else if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
          setSpeechError(t('speechRecognitionError', { error: event.error }));
        }
        isListeningRef.current = false;
        setIsListening(false);
        setIsDetectingSpeech(false);
      };

      recognitionRef.current = recognition;
    } else {
        setSpeechError(t('speechNotSupported'));
    }

    return () => {
        if (recognitionRef.current) {
            isListeningRef.current = false;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };
  }, [language, t]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
        setIsDetectingSpeech(true); // show initial feedback
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        setSpeechError(t('speechStartError'));
        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, [isListening, t]);
  
  const speakText = useCallback((message: ChatMessage) => {
    if (isSpeaking && speakingMessageId === message.id) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    setTtsError(null);
    const utterance = new SpeechSynthesisUtterance(message.text);
    
    // Find a voice that matches the language
    const voice = voices.find(v => v.lang === message.lang) || voices.find(v => v.lang.startsWith(message.lang?.split('-')[0] || 'en'));
    if (voice) {
        utterance.voice = voice;
    } else {
        utterance.lang = message.lang || 'en-US';
    }

    utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
    };
    utterance.onerror = (event) => {
        console.error('SpeechSynthesis Error:', event.error);
        setTtsError(t('ttsError', { error: event.error }));
        setIsSpeaking(false);
        setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setSpeakingMessageId(message.id);
  }, [isSpeaking, speakingMessageId, voices, t]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const trimmedInput = (textToSend ?? input).trim();
    if (!trimmedInput && !imageFile) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmedInput,
      image: imagePreview || undefined,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const result = await analyzeCropImage(trimmedInput, imageFile, sensorData, location, weatherData, language);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: result.text,
        lang: result.lang,
        timestamp: new Date(),
      };
      setMessages(prev => {
          const newMessages = [...prev];
          // Find the last user message and update its status to 'delivered'
          const lastUserMessageIndex = newMessages.map(m => m.sender).lastIndexOf('user');
          if (lastUserMessageIndex !== -1) {
              newMessages[lastUserMessageIndex] = {
                  ...newMessages[lastUserMessageIndex],
                  status: 'delivered'
              };
          }
          return [...newMessages, botMessage];
      });
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: t('genericError'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, imageFile, imagePreview, sensorData, location, weatherData, language, t]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const suggestedQuestions = [
    t('bestCropSuggestion'),
    "How do I treat powdery mildew on my plants?",
    "What do my current sensor readings indicate for my farm?"
  ];

  const handleSuggestionClick = (question: string) => {
      handleSend(question);
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-in-up" role="dialog" aria-modal="true">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm sticky top-0">
        <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('aiAssistant')}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <XIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${message.sender === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              {message.image && <img src={message.image} alt="Crop" className="rounded-lg mb-2 max-h-48 w-full object-cover" />}
              {message.text && <FormattedBotMessage text={message.text} />}
              <div className="flex items-center justify-between mt-1.5">
                <div>
                    {message.sender === 'bot' && message.text && (
                        <button onClick={() => speakText(message)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 -ml-1">
                            {isSpeaking && speakingMessageId === message.id ? <StopCircleIcon className="w-5 h-5"/> : <SpeakerWaveIcon className="w-5 h-5"/>}
                        </button>
                    )}
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${message.sender === 'user' ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                     {message.sender === 'user' && message.status === 'sent' && <CheckIcon className="w-4 h-4" />}
                     {message.sender === 'user' && message.status === 'delivered' && <DoubleCheckIcon className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <SparklesIcon className="w-24 h-24 text-green-200 dark:text-green-700/50 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">{t('agriGeniusAssistant')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 mt-1">{t('askAboutCropDiseases')}</p>
                <div className="w-full max-w-sm space-y-2">
                    {suggestedQuestions.map((q, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSuggestionClick(q)} 
                            className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        )}
        
        {isLoading && (
            <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="italic">typing...</span>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Errors */}
      {speechError && <div className="p-2 text-center text-xs text-red-500 bg-red-100 dark:bg-red-900/50">{speechError}</div>}
      {ttsError && <div className="p-2 text-center text-xs text-red-500 bg-red-100 dark:bg-red-900/50">{ttsError}</div>}
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {imagePreview && (
          <div className="relative w-24 h-24 mb-2">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
            <button onClick={clearImage} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button onClick={handleCameraClick} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <CameraIcon className="w-6 h-6" />
          </button>
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isListening ? 'text-red-500 bg-red-100 dark:bg-red-900/50 mic-listening' : ''}`}
          >
            <MicrophoneIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? t('listening') : t('askAnything')}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={() => handleSend()} disabled={isLoading || (!input.trim() && !imageFile)} className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400">
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatModal;