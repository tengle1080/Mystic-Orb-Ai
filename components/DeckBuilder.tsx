import React, { useState, useEffect, useRef } from 'react';
import { getGeneratedCards, getUserDecks, saveUserDecks } from '../services/storageService';
import type { GeneratedCardInfo, UserDeck } from '../types';
import { MAJOR_ARCANA } from '../constants';
import CollectionCard from './CollectionCard';
import CardDetailModal from './CardDetailModal';

const DeckBuilder: React.FC = () => {
    const [decks, setDecks] = useState<UserDeck[]>([]);
    const [cards, setCards] = useState<GeneratedCardInfo[]>([]);
    const [newDeckName, setNewDeckName] = useState('');
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
    const [viewingCard, setViewingCard] = useState<GeneratedCardInfo | null>(null);

    // Refs for drag and drop
    const dragItem = useRef<string | null>(null);
    const dragOverItem = useRef<string | null>(null);

    useEffect(() => {
        let loadedCardUrls: string[] = [];
        const loadData = async () => {
            const majorArcanaAsGenerated: GeneratedCardInfo[] = MAJOR_ARCANA.map(card => ({
                ...card,
                id: `major-arcana-${card.name.toLowerCase().replace(/\s+/g, '-')}`,
                prompt: 'Official Major Arcana Card'
            }));

            const loadedDecks = getUserDecks();
            const loadedCards = await getGeneratedCards();
            loadedCardUrls = loadedCards.map(c => c.imageUrl);
            setDecks(loadedDecks);
            setCards([...majorArcanaAsGenerated, ...loadedCards]);
        };
        
        loadData();

        return () => {
            loadedCardUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const updateDecks = (newDecks: UserDeck[]) => {
        setDecks(newDecks);
        saveUserDecks(newDecks);
    };

    const handleCreateDeck = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckName.trim()) return;
        const newDeck: UserDeck = {
            id: `deck-${Date.now()}`,
            name: newDeckName,
            cardIds: [],
        };
        const newDecks = [...decks, newDeck];
        updateDecks(newDecks);
        setNewDeckName('');
        setSelectedDeckId(newDeck.id); // Auto-select the new deck
    };

    const handleDeleteDeck = (deckId: string) => {
        if (window.confirm("Are you sure you want to delete this deck?")) {
            const newDecks = decks.filter(d => d.id !== deckId);
            updateDecks(newDecks);
            if(selectedDeckId === deckId) {
                setSelectedDeckId(null);
            }
        }
    };
    
    const handleToggleCardInDeck = (cardId: string, deckId: string) => {
        const newDecks = decks.map(deck => {
            if (deck.id === deckId) {
                const cardIndex = deck.cardIds.indexOf(cardId);
                if (cardIndex > -1) {
                    const newCardIds = [...deck.cardIds];
                    newCardIds.splice(cardIndex, 1);
                    return { ...deck, cardIds: newCardIds };
                } else {
                    return { ...deck, cardIds: [...deck.cardIds, cardId] };
                }
            }
            return deck;
        });
        updateDecks(newDecks);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cardId: string) => {
        dragItem.current = cardId;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggingCardId(cardId), 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, cardId: string) => {
        e.preventDefault();
        dragOverItem.current = cardId;
    };
    
    const handleDragEnd = () => {
        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        if (!selectedDeck || !dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
            setDraggingCardId(null);
            return;
        }

        const cardIds = [...selectedDeck.cardIds];
        const dragItemIndex = cardIds.indexOf(dragItem.current);
        const dragOverItemIndex = cardIds.indexOf(dragOverItem.current);

        const [reorderedItem] = cardIds.splice(dragItemIndex, 1);
        cardIds.splice(dragOverItemIndex, 0, reorderedItem);

        const newDecks = decks.map(d =>
            d.id === selectedDeck.id ? { ...d, cardIds } : d
        );
        updateDecks(newDecks);
        
        dragItem.current = null;
        dragOverItem.current = null;
        setDraggingCardId(null);
    };

    const selectedDeck = decks.find(d => d.id === selectedDeckId);
    const isDraggable = !!selectedDeck;
    
    const displayedCards = (() => {
        if (selectedDeckId === 'major-arcana-preset') {
            return cards.filter(card => card.id.startsWith('major-arcana-'));
        }
        if (selectedDeck) {
            return selectedDeck.cardIds
                .map(id => cards.find(c => c.id === id))
                .filter(Boolean) as GeneratedCardInfo[];
        }
        return cards;
    })();

    const getTitle = () => {
        if (selectedDeckId === 'major-arcana-preset') return 'Preset: Major Arcana';
        if (selectedDeck) return `Deck: ${selectedDeck.name}`;
        return 'My Card Collection';
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Decks Panel */}
                <div className="lg:col-span-1 space-y-6 p-6 bg-black/40 rounded-2xl border border-purple-500/30 shadow-lg">
                    <div>
                        <h2 className="font-cinzel text-2xl text-yellow-300 mb-4">My Decks</h2>
                        <form onSubmit={handleCreateDeck} className="flex flex-col gap-3 mb-6">
                            <input
                                type="text"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                placeholder="New Deck Name"
                                className="w-full bg-gray-800/50 border border-purple-400/50 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-yellow-400"
                            />
                            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-all font-cinzel">
                                Create Deck
                            </button>
                        </form>
                    </div>

                    <nav className="space-y-2">
                        <DeckNavItem 
                            label="All Cards"
                            count={cards.length}
                            isActive={!selectedDeckId}
                            onClick={() => setSelectedDeckId(null)}
                        />
                         <DeckNavItem 
                            label="Major Arcana"
                            count={22}
                            isActive={selectedDeckId === 'major-arcana-preset'}
                            onClick={() => setSelectedDeckId('major-arcana-preset')}
                        />
                        {decks.map(deck => (
                             <DeckNavItem 
                                key={deck.id}
                                label={deck.name}
                                count={deck.cardIds.length}
                                isActive={selectedDeckId === deck.id}
                                onClick={() => setSelectedDeckId(deck.id)}
                                onDelete={() => handleDeleteDeck(deck.id)}
                            />
                        ))}
                    </nav>
                </div>

                {/* Right Column: Card Collection */}
                <div className="lg:col-span-3 p-6 bg-black/40 rounded-2xl border border-purple-500/30 shadow-lg min-h-[60vh]">
                    <h2 className="font-cinzel text-3xl text-center text-yellow-300 mb-6">
                        {getTitle()}
                    </h2>
                    {displayedCards.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {displayedCards.map(card => (
                                <div
                                    key={card.id}
                                    draggable={isDraggable}
                                    onDragStart={isDraggable ? (e) => handleDragStart(e, card.id) : undefined}
                                    onDragEnter={isDraggable ? (e) => handleDragEnter(e, card.id) : undefined}
                                    onDragEnd={isDraggable ? handleDragEnd : undefined}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`transition-opacity ${isDraggable ? 'cursor-grab' : ''} ${draggingCardId === card.id ? 'opacity-30' : 'opacity-100'}`}
                                >
                                    <CollectionCard
                                        card={card}
                                        decks={decks}
                                        onToggleCardInDeck={handleToggleCardInDeck}
                                        onViewCard={() => setViewingCard(card)}
                                    />
                                </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-purple-300/70 h-full p-8 border-2 border-dashed border-purple-400/30 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-400/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h-2M5 11H3" />
                            </svg>
                            <p className="text-lg font-bold">
                                {selectedDeckId ? 'This deck is empty.' : 'No cards generated yet.'}
                            </p>
                             <p className="max-w-xs">
                                {selectedDeckId ? 'Select "All Cards" to browse your collection and add some.' : 'Go to the Card Forge to bring your visions to life!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {viewingCard && (
                <CardDetailModal card={viewingCard} onClose={() => setViewingCard(null)} />
            )}
        </>
    );
};

const DeckNavItem: React.FC<{
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
    onDelete?: () => void;
}> = ({ label, count, isActive, onClick, onDelete }) => (
    <div className={`relative group ${isActive ? 'bg-yellow-400/20' : 'hover:bg-purple-500/20'} rounded-lg`}>
        <button
            onClick={onClick}
            className={`w-full flex justify-between items-center text-left p-3 rounded-lg transition-colors ${isActive ? 'text-yellow-200' : 'text-purple-200'}`}
        >
            <span className="font-bold truncate pr-2">{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-sm ${isActive ? 'bg-yellow-300 text-black' : 'bg-purple-800 text-purple-200'}`}>{count}</span>
        </button>
        {onDelete && (
            <button 
                onClick={onDelete} 
                className="absolute top-1/2 -translate-y-1/2 right-14 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" 
                aria-label={`Delete ${label} deck`}
            >
                &times;
            </button>
        )}
    </div>
);


export default DeckBuilder;