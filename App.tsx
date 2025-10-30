import React, { useState, useEffect } from 'react';
import TarotReading from './components/TarotReading';
import CardGenerator from './components/CardGenerator';
import DeckBuilder from './components/DeckBuilder';
import YesNoReading from './components/YesNoReading';
import { MAJOR_ARCANA, CARD_BACK_IMAGE, SPLASH_SCREEN_IMAGE } from './constants';

type Tab = 'reading' | 'yesno' | 'generator' | 'decks';

const TabButton: React.FC<{
  labels: [string, string];
  isActive: boolean;
  onClick: () => void;
}> = ({ labels, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 text-center font-cinzel transition-all duration-300 border-b-2 ${
      isActive
        ? 'text-yellow-300 border-yellow-400'
        : 'text-purple-300 hover:text-yellow-200 border-transparent'
    }`}
  >
    <span className="block text-sm sm:text-base">{labels[0]}</span>
    <span className="block text-sm sm:text-base">{labels[1]}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reading');
  const [isLoading, setIsLoading] = useState(true);
  const [isSplashFading, setIsSplashFading] = useState(false);

  useEffect(() => {
    // Preload all Major Arcana images to prevent loading lag during readings
    MAJOR_ARCANA.forEach(card => {
      const img = new Image();
      img.src = card.imageUrl;
    });
    const backImg = new Image();
    backImg.src = CARD_BACK_IMAGE;

    // Preload splash image to ensure it's ready
    const splashImg = new Image();
    splashImg.src = SPLASH_SCREEN_IMAGE;

    // Simulate loading time for splash screen effect
    const timer = setTimeout(() => {
      setIsSplashFading(true); // Start fading out
      setTimeout(() => setIsLoading(false), 500); // Remove splash screen after fade
    }, 2500); // Display for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);


  const renderContent = () => {
    switch (activeTab) {
      case 'reading':
        return <TarotReading />;
      case 'yesno':
        return <YesNoReading />;
      case 'generator':
        return <CardGenerator />;
      case 'decks':
        return <DeckBuilder />;
      default:
        return <TarotReading />;
    }
  };

  if (isLoading) {
    return (
      <div 
        className={`fixed inset-0 bg-[#0c0a1a] flex items-center justify-center z-50 transition-opacity duration-500 ease-out ${isSplashFading ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      >
        <div className="w-full max-w-sm p-4">
          <img src={SPLASH_SCREEN_IMAGE} alt="Mystic Oracle AI Loading Screen" className="w-full h-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-900 text-white font-sans p-4 md:p-8 animate-fade-in">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
            Mystic Oracle AI
          </h1>
          <p className="text-purple-300 text-base sm:text-lg mt-2">
            Your Digital Divination Companion
          </p>
        </header>

        <nav className="flex justify-center border-b border-purple-500/30 mb-8">
          <TabButton labels={['Tarot', 'Reading']} isActive={activeTab === 'reading'} onClick={() => setActiveTab('reading')} />
          <TabButton labels={['Yes /', 'No']} isActive={activeTab === 'yesno'} onClick={() => setActiveTab('yesno')} />
          <TabButton labels={['Card', 'Forge']} isActive={activeTab === 'generator'} onClick={() => setActiveTab('generator')} />
          <TabButton labels={['My', 'Decks']} isActive={activeTab === 'decks'} onClick={() => setActiveTab('decks')} />
        </nav>

        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;