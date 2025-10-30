import React, { useEffect } from 'react';
import type { GeneratedCardInfo } from '../types';
import TarotCard from './TarotCard';

interface CardDetailModalProps {
    card: GeneratedCardInfo;
    onClose: () => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    const isMajorArcana = card.id.startsWith('major-arcana-');

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 w-full max-w-md p-6 relative animate-slide-up"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 text-purple-200 hover:text-yellow-300 transition-colors z-10"
                    aria-label="Close card view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-full max-w-[280px]">
                        <TarotCard card={card} isFlipped={true} hideNameOverlay={true} />
                    </div>
                    
                    <div className="text-center w-full">
                        <h2 className="font-cinzel text-3xl text-yellow-300">{card.name}</h2>

                        {!isMajorArcana && (
                            <div className="mt-4 text-left">
                                <h3 className="font-cinzel text-lg text-purple-200">Creation Prompt:</h3>
                                <p className="text-purple-300/90 text-sm bg-black/20 p-3 rounded-md mt-1 max-h-32 overflow-y-auto">
                                    {card.prompt}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDetailModal;