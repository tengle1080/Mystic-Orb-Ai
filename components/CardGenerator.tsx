import React, { useState, useEffect, useRef } from 'react';
import { generateTarotImage } from '../services/geminiService';
import { saveGeneratedCard, getUserDecks, saveUserDecks } from '../services/storageService';
import TarotCard from './TarotCard';
import type { GeneratedCardInfo, UserDeck } from '../types';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-300"></div>
        <p className="text-purple-200">Summoning creative energies...</p>
    </div>
);

const ART_STYLES = [
    "Fantasy", "Art Nouveau", "Sci-Fi", "Steampunk", "Gothic", 
    "Surrealist", "Vintage", "Minimalist", "Abstract", "Impressionist"
];

const COLOR_PALETTES = [
    "Vibrant", "Muted", "Dark", "Pastel", "Monochromatic", "Earthy Tones"
];

const FormInput: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-bold text-purple-200 mb-2">{label}</label>
        {children}
    </div>
);

const CardGenerator: React.FC = () => {
    const [cardName, setCardName] = useState('');
    const [description, setDescription] = useState('');
    const [artStyle, setArtStyle] = useState(ART_STYLES[0]);
    const [colorPalette, setColorPalette] = useState(COLOR_PALETTES[0]);

    const [generatedCard, setGeneratedCard] = useState<GeneratedCardInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    
    const [decks, setDecks] = useState<UserDeck[]>([]);
    const [showDeckMenu, setShowDeckMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDecks(getUserDecks());
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowDeckMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardName.trim() || !description.trim()) {
            setError('Please provide a name and description for your card.');
            return;
        }
        setError(null);
        setGeneratedCard(null);
        setIsLoading(true);
        setIsSaved(false);

        const fullPrompt = `A tarot card named "${cardName}". The art style is ${artStyle}. The card depicts: ${description}. The color palette is ${colorPalette}. high detail, mystical, elegant, fantasy art.`;

        try {
            const base64Image = await generateTarotImage(fullPrompt);
            const newCard: GeneratedCardInfo = {
                id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: cardName,
                imageUrl: `data:image/png;base64,${base64Image}`,
                prompt: fullPrompt,
            };
            setGeneratedCard(newCard);
            await saveGeneratedCard(newCard);
            setIsSaved(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCardToDeck = (deckId: string) => {
        if (!generatedCard) return;

        const updatedDecks = decks.map(deck => {
            if (deck.id === deckId && !deck.cardIds.includes(generatedCard.id)) {
                return { ...deck, cardIds: [...deck.cardIds, generatedCard.id] };
            }
            return deck;
        });

        setDecks(updatedDecks);
        saveUserDecks(updatedDecks);
    };

    const cardInDeck = (deckId: string) => {
        if (!generatedCard) return false;
        const deck = decks.find(d => d.id === deckId);
        return deck ? deck.cardIds.includes(generatedCard.id) : false;
    };
    
    return (
        <div className="max-w-7xl mx-auto p-6 bg-indigo-950 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10">
            <header className="text-center mb-8">
                <h2 className="font-cinzel text-3xl text-yellow-300">Tarot Card Forge</h2>
                <p className="text-purple-200 mt-2">Describe your vision and let the AI bring it to life.</p>
            </header>
            
            <hr className="border-t border-dashed border-yellow-400/30 my-6" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <form onSubmit={handleGenerate} className="space-y-6">
                    <FormInput label="Card Name">
                        <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="e.g., The Cosmic Wolf"
                            className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-400"
                            disabled={isLoading}
                        />
                    </FormInput>

                    <FormInput label="Card Description">
                         <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A wolf made of stars howling at a nebula moon..."
                            className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-3 text-lg text-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 min-h-[120px]"
                            rows={4}
                            disabled={isLoading}
                        />
                    </FormInput>

                    <FormInput label="Art Style">
                        <select 
                            value={artStyle}
                            onChange={(e) => setArtStyle(e.target.value)}
                            className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-400"
                            disabled={isLoading}
                        >
                            {ART_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                    </FormInput>

                    <FormInput label="Color Palette">
                        <select 
                             value={colorPalette}
                             onChange={(e) => setColorPalette(e.target.value)}
                             className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-400"
                             disabled={isLoading}
                        >
                             {COLOR_PALETTES.map(palette => <option key={palette} value={palette}>{palette}</option>)}
                        </select>
                    </FormInput>

                    <div className="text-center pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-purple-600 text-white font-bold text-lg py-3 px-6 sm:text-xl sm:py-3 sm:px-8 rounded-lg shadow-lg hover:bg-purple-700 active:scale-95 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed font-cinzel w-full"
                        >
                            {isLoading ? 'Creating...' : 'Generate Card'}
                        </button>
                    </div>

                    {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg mt-4">{error}</p>}
                </form>

                {/* Right Column: Display */}
                <div className="flex justify-center items-center min-h-[400px] lg:min-h-full bg-gray-900/30 rounded-xl p-4">
                    {isLoading && <LoadingSpinner />}
                    {generatedCard && (
                        <div className="flex flex-col items-center">
                            <h3 className="font-cinzel text-xl text-purple-300 mb-2">Your Creation</h3>
                            <TarotCard card={generatedCard} isFlipped={true} />
                            {isSaved && <p className="mt-4 text-green-400 animate-pulse">Saved to your collection!</p>}
                            {isSaved && (
                                <div className="relative mt-4" ref={menuRef}>
                                    <button
                                        onClick={() => setShowDeckMenu(!showDeckMenu)}
                                        className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                                    >
                                        Add to Deck
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showDeckMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showDeckMenu && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-800 border border-purple-400/50 rounded-lg shadow-xl z-10 animate-fade-in">
                                            {decks.length > 0 ? (
                                                <ul className="max-h-48 overflow-y-auto">
                                                    {decks.map(deck => (
                                                        <li key={deck.id}>
                                                            <button
                                                                onClick={() => handleAddCardToDeck(deck.id)}
                                                                className="w-full text-left px-4 py-2 hover:bg-purple-700 flex justify-between items-center disabled:opacity-60 disabled:hover:bg-gray-800 disabled:cursor-not-allowed"
                                                                disabled={cardInDeck(deck.id)}
                                                            >
                                                                <span>{deck.name}</span>
                                                                {cardInDeck(deck.id) && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="p-3 text-sm text-gray-400 text-center">Create a deck first in 'My Decks'.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {!isLoading && !generatedCard && (
                        <div className="text-center text-purple-300/70 p-8 border-2 border-dashed border-purple-400/30 rounded-xl">
                            <p className="text-lg">Your generated card will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CardGenerator;