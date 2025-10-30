

import React from 'react';
import { CARD_BACK_IMAGE } from '../constants';
import type { TarotCardInfo, GeneratedCardInfo } from '../types';

interface TarotCardProps {
    card: TarotCardInfo;
    isFlipped: boolean;
    isInteractive?: boolean;
    hideNameOverlay?: boolean;
}

const TarotCard: React.FC<TarotCardProps> = ({ card, isFlipped, isInteractive = false, hideNameOverlay = false }) => {
    // A generated card has an 'id' property. We only want to show the name overlay
    // for user-generated cards, not for the Major Arcana which have names on the image.
    // Major Arcana cards are given a special ID when added to the collection.
    const isGenerated = 'id' in card;
    const isMajorArcanaInCollection = isGenerated && (card as GeneratedCardInfo).id.startsWith('major-arcana-');
    const shouldShowNameByDefault = isGenerated && !isMajorArcanaInCollection;
    const showName = !hideNameOverlay && shouldShowNameByDefault;

    const interactiveClasses = isInteractive
        ? 'transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_3px_rgba(253,249,156,0.3)] rounded-xl'
        : '';

    return (
        <div className={`w-full aspect-[10/17] [perspective:1000px] ${interactiveClasses}`}>
            <div
                className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
            >
                {/* Card Back */}
                <div className="absolute w-full h-full [backface-visibility:hidden] rounded-xl overflow-hidden shadow-lg shadow-black/50 border-2 border-purple-400/50">
                    <img src={CARD_BACK_IMAGE} alt="Tarot card back" className="w-full h-full object-cover" />
                </div>
                {/* Card Front */}
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gray-800 rounded-xl overflow-hidden shadow-lg shadow-black/50 border-2 border-yellow-300/70">
                    <div className="flex flex-col h-full">
                        <img 
                            src={card.imageUrl} 
                            alt={card.name} 
                            className={`w-full object-cover ${showName ? 'h-4/5' : 'h-full'}`} 
                        />
                        {showName && (
                            <div className="flex-grow flex items-center justify-center p-2 bg-gradient-to-t from-gray-900 to-gray-800">
                                <h4 className="text-yellow-200 text-center font-cinzel text-sm md:text-base font-bold">
                                    {card.name}
                                </h4>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TarotCard;