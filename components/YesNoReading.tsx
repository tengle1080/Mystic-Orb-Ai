import React, { useState, useRef } from 'react';
import type { TarotCardInfo, CardInterpretation } from '../types';
import { MAJOR_ARCANA } from '../constants';
import { getYesNoInterpretation, generateSpeechFromText } from '../services/geminiService';
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

type YesNoResult = Omit<CardInterpretation, 'position'>;

const YesNoReading: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [drawnCard, setDrawnCard] = useState<TarotCardInfo | null>(null);
    const [readingResult, setReadingResult] = useState<YesNoResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [isReadingAloud, setIsReadingAloud] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);


    const shuffleAndDrawOne = () => {
        const shuffled = [...MAJOR_ARCANA].sort(() => 0.5 - Math.random());
        return shuffled[0];
    };

    const handleGetReading = async () => {
        if (!question.trim()) {
            setError('Please ask a question to get an answer.');
            return;
        }
        setError(null);
        setReadingResult(null);
        setDrawnCard(null);
        setIsCardFlipped(false);
        setIsLoading(true);

        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
            setIsReadingAloud(false);
        }

        try {
            const card = shuffleAndDrawOne();
            const result = await getYesNoInterpretation(question, card);

            setDrawnCard(card);
            setReadingResult(result);
            
            setTimeout(() => {
                setIsCardFlipped(true);
            }, 100);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReadAloud = async () => {
        if (!readingResult || isReadingAloud) return;

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
            
            const textToRead = readingResult.interpretation;

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
        <div className="max-w-md mx-auto p-4 sm:p-6 bg-indigo-950 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10">
            {!isLoading && !drawnCard && (
                 <div className="space-y-6 animate-fade-in">
                    <h2 className="font-cinzel text-3xl text-center text-yellow-300">Yes / No Reading</h2>
                    <p className="text-center text-purple-200">Ask a question that can be answered with a simple "yes" or "no".</p>

                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., Should I start a new project this week?"
                        className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-3 text-lg text-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                        rows={2}
                        disabled={isLoading}
                    />

                    <div className="text-center">
                        <button
                            onClick={handleGetReading}
                            disabled={isLoading}
                            className="bg-purple-600 text-white font-bold text-lg py-3 px-6 sm:text-xl sm:py-3 sm:px-8 rounded-lg shadow-lg hover:bg-purple-700 active:scale-95 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed font-cinzel"
                        >
                            {isLoading ? 'Consulting...' : 'Get Answer'}
                        </button>
                    </div>

                    {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
                </div>
            )}
           

            <div className="mt-6 flex flex-col justify-center items-center min-h-[450px]">
                {isLoading && (
                    <div className="w-full max-w-[250px] animate-fade-in text-center">
                        <h3 className="font-cinzel text-xl text-purple-300 mb-4">INSIGHT</h3>
                        <SkeletonCard />
                        <h3 className="font-cinzel text-2xl text-yellow-300 text-center mt-6">YOUR READING</h3>
                        <div className="w-full h-24 bg-gray-900/50 rounded-lg mt-4 animate-pulse"></div>
                    </div>
                )}
                
                {!isLoading && drawnCard && readingResult && (
                    <div className="w-full animate-fade-in">
                        <div className="w-full max-w-[200px] sm:max-w-[250px] mb-8 mx-auto">
                            <TarotCard card={drawnCard} isFlipped={isCardFlipped} />
                        </div>
                        
                        <div className="w-full bg-black/20 border border-purple-400/30 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4 relative">
                                <div className="flex-1"></div>
                                <h2 className="font-cinzel text-2xl text-yellow-300 text-center flex-shrink-0 px-4">Your Reading</h2>
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

                            <h3 className="font-cinzel text-xl text-yellow-200 mb-2 text-center">
                               Insight: {readingResult.cardName}
                            </h3>
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {readingResult.keywords.map((keyword, kwIndex) => (
                                    <span key={kwIndex} className="bg-purple-800 text-purple-200 text-sm font-semibold px-3 py-1 rounded-full">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                            <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center">{readingResult.interpretation}</p>

                             <div className="text-center mt-8">
                                <button
                                    onClick={() => {
                                        setDrawnCard(null);
                                        setReadingResult(null);
                                        setQuestion('');
                                        setError(null);
                                    }}
                                    className="bg-purple-600/80 text-white font-bold text-base py-2 px-6 rounded-lg shadow-lg hover:bg-purple-700 active:scale-95 transition-all duration-300 font-cinzel"
                                >
                                    Ask Another Question
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default YesNoReading;