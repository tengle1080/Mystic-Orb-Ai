import React, { useState, useRef } from 'react';
import type { TarotCardInfo, Spread, CardInterpretation } from '../types';
import { MAJOR_ARCANA, SPREADS } from '../constants';
import { getTarotInterpretation, generateSpeechFromText } from '../services/geminiService';
import TarotCard from './TarotCard';
import SkeletonCard from './SkeletonCard';

// Helper functions for audio decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const HowItWorksStep: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 mt-1 font-bold text-xl bg-yellow-400 border-2 border-yellow-500/80 text-purple-900 rounded-full">
            {number}
        </div>
        <div>
            <h3 className="font-cinzel text-lg text-yellow-300 tracking-wide">{title}</h3>
            <p className="text-purple-200 text-sm">{description}</p>
        </div>
    </div>
);


const TarotReading: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [selectedSpread, setSelectedSpread] = useState<Spread>(SPREADS[1]);
    const [drawnCards, setDrawnCards] = useState<TarotCardInfo[]>([]);
    const [readingResult, setReadingResult] = useState<CardInterpretation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [areCardsFlipped, setAreCardsFlipped] = useState(false);
    const [isReadingAloud, setIsReadingAloud] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);


    const shuffleAndDraw = (count: number) => {
        const shuffled = [...MAJOR_ARCANA].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const handleGetReading = async () => {
        if (!question.trim()) {
            setError('Please ask a question to the cards.');
            return;
        }
        setError(null);
        setReadingResult([]);
        setDrawnCards([]);
        setAreCardsFlipped(false);
        setIsLoading(true);

        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
            setIsReadingAloud(false);
        }

        try {
            const cards = shuffleAndDraw(selectedSpread.cardCount);
            const result = await getTarotInterpretation(question, cards, selectedSpread);
            
            setDrawnCards(cards);
            setReadingResult(result);

            setTimeout(() => {
                setAreCardsFlipped(true);
            }, 100);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReadAloud = async () => {
        if (readingResult.length === 0 || isReadingAloud) return;

        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        setIsReadingAloud(true);
        setError(null);

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;
            
            const textToRead = readingResult.map(card => `${card.position}. ${card.interpretation}`).join(' \n ');


            const base64Audio = await generateSpeechFromText(textToRead);
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContext,
                24000,
                1
            );

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

            audioSourceRef.current = source;
            source.onended = () => {
                setIsReadingAloud(false);
                audioSourceRef.current = null;
            };

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown audio error occurred.');
            setIsReadingAloud(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-indigo-950 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10">
            <div className="mb-8">
                <div 
                    className="flex justify-center items-center cursor-pointer group"
                    onClick={() => setShowHowItWorks(!showHowItWorks)}
                    aria-expanded={showHowItWorks}
                    aria-controls="how-it-works-content"
                >
                    <h2 className="font-cinzel text-xl text-center text-purple-200 group-hover:text-yellow-300 transition-colors">
                        How does this work?
                    </h2>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ml-2 text-purple-200 group-hover:text-yellow-300 transition-transform duration-300 ${showHowItWorks ? 'rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                
                <div 
                    id="how-it-works-content"
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${showHowItWorks ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}
                >
                    <hr className="border-t border-purple-400/50 mb-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <HowItWorksStep number="1" title="CHOOSE YOUR READING TYPE" description="Select the card layout that best matches your question." />
                        <HowItWorksStep number="2" title="ASK YOUR QUESTION" description="Focus on your question and type it clearly for an insightful reading." />
                        <HowItWorksStep number="3" title="DRAW YOUR CARDS" description="The universe will guide the selection of cards for your chosen layout." />
                        <HowItWorksStep number="4" title="RECEIVE AI INTERPRETATION" description="Our AI analyzes the cards to provide personalized insights for you." />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="font-cinzel text-3xl text-center text-yellow-300">Choose Your Reading Type</h2>
                <p className="text-center text-purple-200">Select a layout that best fits your question.</p>

                <div className="flex flex-wrap justify-center gap-3">
                    {SPREADS.map(spread => (
                        <button
                            key={spread.id}
                            onClick={() => setSelectedSpread(spread)}
                            disabled={isLoading}
                            className={`py-2 px-4 rounded-lg border-2 transition-colors disabled:opacity-50 font-semibold ${selectedSpread.id === spread.id ? 'bg-yellow-400/80 text-black border-yellow-400' : 'border-purple-400/50 hover:bg-purple-500/30'}`}
                        >
                            {spread.name}
                        </button>
                    ))}
                </div>
                
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask your question here..."
                    className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-3 text-lg text-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 min-h-[100px]"
                    rows={3}
                    disabled={isLoading}
                />
                
                <div className="text-center">
                    <button
                        onClick={handleGetReading}
                        disabled={isLoading}
                        className="bg-purple-600 text-white font-bold text-lg py-3 px-6 sm:text-xl sm:py-3 sm:px-8 rounded-lg shadow-lg hover:bg-purple-700 active:scale-95 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed font-cinzel"
                    >
                        {isLoading ? 'Reading...' : 'Get My Reading'}
                    </button>
                </div>
                
                {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
            </div>

            <hr className="border-t border-dashed border-yellow-400/30 my-8" />

            <div className="min-h-[500px]">
                {isLoading && (
                    <div className="animate-fade-in">
                        <h2 className="font-cinzel text-3xl text-yellow-300 text-center mb-4">Consulting the cosmos...</h2>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${selectedSpread.cardCount === 1 ? '1' : '3'} gap-6 md:gap-8 items-start justify-center`}>
                            {selectedSpread.positions.map(title => (
                                <div key={title} className="flex flex-col items-center">
                                    <h3 className="font-cinzel text-xl text-purple-300 mb-2">{title}</h3>
                                    <div className="w-full max-w-[250px]">
                                        <SkeletonCard />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && drawnCards.length > 0 && (
                    <div className="animate-fade-in">
                        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${selectedSpread.cardCount === 1 ? '1' : '3'} gap-6 md:gap-8 items-start justify-center`}>
                           {drawnCards.map((card, index) => (
                                <div key={selectedSpread.positions[index]} className="flex flex-col items-center">
                                    <h3 className="font-cinzel text-xl text-purple-300 mb-2">{selectedSpread.positions[index]}</h3>
                                    <div className="w-full max-w-[250px]">
                                        <TarotCard card={card} isFlipped={areCardsFlipped} />
                                    </div>
                                </div>
                            ))}
                        </div>
            
                        {readingResult.length > 0 && (
                            <div className="mt-10">
                                <div className="flex justify-between items-center mb-4 relative">
                                    <div className="flex-1"></div>
                                    <h2 className="font-cinzel text-3xl text-yellow-300 text-center flex-shrink-0 px-4">Your Reading</h2>
                                    <div className="flex-1 flex justify-end">
                                        <button
                                            onClick={handleReadAloud}
                                            disabled={isReadingAloud}
                                            className="bg-purple-500/80 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg hover:bg-purple-600 active:scale-95 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                            aria-label="Read interpretation aloud"
                                        >
                                            {isReadingAloud ? (
                                                <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {readingResult.map((cardReading, index) => (
                                    <div key={index} className="bg-black/20 border border-purple-400/30 rounded-lg p-6 mt-4">
                                        <h3 className="font-cinzel text-2xl text-yellow-300 mb-2">
                                            {cardReading.position}: {cardReading.cardName}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {cardReading.keywords.map((keyword, kwIndex) => (
                                            <span key={kwIndex} className="bg-purple-800 text-purple-200 text-sm font-semibold px-3 py-1 rounded-full">
                                                {keyword}
                                            </span>
                                            ))}
                                        </div>
                                        <p className="text-gray-300 text-base md:text-lg leading-relaxed">{cardReading.interpretation}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TarotReading;