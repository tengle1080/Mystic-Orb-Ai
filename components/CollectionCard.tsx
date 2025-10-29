
import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedCardInfo, UserDeck } from '../types';
import TarotCard from './TarotCard';

interface CollectionCardProps {
  card: GeneratedCardInfo;
  decks: UserDeck[];
  onToggleCardInDeck: (cardId: string, deckId: string) => void;
  onViewCard: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ card, decks, onToggleCardInDeck, onViewCard }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const decksContainingCard = decks.filter(d => d.cardIds.includes(card.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cardInDeck = (deckId: string) => decks.find(d => d.id === deckId)?.cardIds.includes(card.id);

  return (
    <div className="relative group">
      {decksContainingCard.length > 0 && (
        <div 
          className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-yellow-300/50" 
          title={`In ${decksContainingCard.length} deck(s)`}
        >
          {decksContainingCard.length}
        </div>
      )}
      <div onClick={onViewCard} className="cursor-pointer">
        <TarotCard card={card} isFlipped={true} isInteractive={true} />
      </div>
      <div className="absolute bottom-2 right-2" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Add to deck"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
        </button>
        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 border border-purple-400/50 rounded-lg shadow-xl z-10">
            {decks.length > 0 ? (
              <ul>
                {decks.map(deck => (
                  <li key={deck.id}>
                    <button
                      onClick={() => {
                        onToggleCardInDeck(card.id, deck.id);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-purple-700 flex justify-between items-center"
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
              <p className="p-3 text-sm text-gray-400">Create a deck first.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionCard;