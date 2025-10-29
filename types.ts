// Fix: Define and export interfaces instead of constants and circular imports.
export interface TarotCardInfo {
  name: string;
  imageUrl: string;
}

export interface GeneratedCardInfo extends TarotCardInfo {
  id: string;
  prompt: string;
}

export interface Spread {
  id: string;
  name: string;
  cardCount: number;
  positions: string[];
}

export interface UserDeck {
  id: string;
  name: string;
  cardIds: string[];
}

export interface CardInterpretation {
  position: string;
  cardName: string;
  keywords: string[];
  interpretation: string;
}