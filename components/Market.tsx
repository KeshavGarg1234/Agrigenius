
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowLeftIcon, TrendingUpIcon, ShoppingCartIcon, FireIcon, ChevronRightIcon } from './icons/Icons';

type MarketView = 'main' | 'prices' | 'buy' | 'sell';

const mockCropData = [
  { nameKey: 'wheat', price: '₹2,275/quintal', trend: 'up' },
  { nameKey: 'paddy', price: '₹2,183/quintal', trend: 'stable' },
  { nameKey: 'maize', price: '₹2,090/quintal', trend: 'down' },
  { nameKey: 'cotton', price: '₹7,020/quintal', trend: 'up' },
  { nameKey: 'soybean', price: '₹4,650/quintal', trend: 'down' },
  { nameKey: 'sugarcane', price: '₹315/quintal', trend: 'stable' },
];

const agriInputs = [
    { nameKey: 'ureaFertilizer', link: 'https://www.amazon.in/s?k=urea+fertilizer+for+plants' },
    { nameKey: 'dapFertilizer', link: 'https://www.amazon.in/s?k=dap+fertilizer' },
    { nameKey: 'potash', link: 'https://www.amazon.in/s?k=potash+fertilizer' },
    { nameKey: 'neemOilPesticide', link: 'https://www.amazon.in/s?k=neem+oil+pesticide' },
    { nameKey: 'organicFungicide', link: 'https://www.amazon.in/s?k=organic+fungicide' },
    { nameKey: 'vegetableSeeds', link: 'https://www.amazon.in/s?k=vegetable+seeds' },
];

const govSeeds = [
    { nameKey: 'wheat', scheme: 'National Food Security Mission' },
    { nameKey: 'paddy', scheme: 'National Food Security Mission' },
    { nameKey: 'maize', scheme: 'Integrated Maize Development Programme' },
    { nameKey: 'barley', scheme: 'Rashtriya Krishi Vikas Yojana' },
];

const MarketOptionCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void; }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 text-green-500 dark:text-green-400">
            {icon}
        </div>
        <div className="flex-1 text-left">
            <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    </button>
);

const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
);


const Market = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<MarketView>('main');

  const renderContent = () => {
    switch (view) {
      case 'prices':
        return (
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{t('liveCropPrices')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('pricesDisclaimer', { time: new Date().toLocaleTimeString() })}</p>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('crop')}</th>
                                <th scope="col" className="px-6 py-3">{t('price')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('trend')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockCropData.map((crop, index) => (
                                <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 last:border-b-0 even:bg-gray-50 dark:even:bg-gray-700/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{t(crop.nameKey)}</th>
                                    <td className="px-6 py-4">{crop.price}</td>
                                    <td className={`px-6 py-4 text-right font-semibold ${crop.trend === 'up' ? 'text-green-500' : crop.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                        {crop.trend === 'up' ? '▲' : crop.trend === 'down' ? '▼' : '▬'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
      case 'buy':
        return (
            <div className="space-y-8">
                 <div>
                    <SectionHeader title={t('buyAgriInputs')} description={t('buyAgriInputsDesc')} />
                    <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {agriInputs.map(item => (
                                <a 
                                    key={item.nameKey} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                                >
                                    <span className="font-semibold text-gray-800 dark:text-white">{t(item.nameKey)}</span>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeader title={t('govSeedSchemes')} description={t('govSeedSchemesDesc')} />
                    <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {govSeeds.map(item => (
                                <button 
                                    key={item.nameKey} 
                                    onClick={() => alert(t('featureComingSoon'))}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
                                >
                                    <div>
                                        <span className="font-semibold text-gray-800 dark:text-white">{t(item.nameKey)}</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.scheme}</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'sell':
        return (
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('sellCropResidue')}</h2>
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 p-6 rounded-xl shadow-inner text-center">
                    <FireIcon className="w-12 h-12 mx-auto text-yellow-500 dark:text-yellow-400 mb-3" />
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">{t('stubbleSloganTitle')}</h3>
                    <p className="mt-1 text-yellow-700 dark:text-yellow-300">{t('stubbleSloganDesc')}</p>
                </div>
                <div className="mt-6 text-center">
                     <button 
                        onClick={() => alert(t('featureComingSoon'))}
                        className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105"
                    >
                        {t('listYourResidue')}
                    </button>
                </div>
            </div>
        );
      default: // 'main'
        return (
          <div className="space-y-4">
            <MarketOptionCard 
              icon={<TrendingUpIcon />}
              title={t('liveCropPrices')}
              description={t('liveCropPricesDesc')}
              onClick={() => setView('prices')}
            />
            <MarketOptionCard 
              icon={<ShoppingCartIcon />}
              title={t('buyAgriInputs')}
              description={t('buyAgriInputsDesc')}
              onClick={() => setView('buy')}
            />
            <MarketOptionCard 
              icon={<FireIcon />}
              title={t('sellCropResidue')}
              description={t('sellCropResidueDesc')}
              onClick={() => setView('sell')}
            />
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-full">
      <header className="mb-6 flex items-center">
        {view !== 'main' && (
            <button onClick={() => setView('main')} className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {view === 'main' ? t('marketHub') : t('market')}
        </h1>
      </header>
      {renderContent()}
    </div>
  );
};

export default Market;
