import type { TarotCardInfo, Spread } from './types';

export const MAJOR_ARCANA: TarotCardInfo[] = [
  { name: 'The Fool', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg' },
  { name: 'The Magician', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg' },
  { name: 'The High Priestess', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg' },
  { name: 'The Empress', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg' },
  { name: 'The Emperor', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg' },
  { name: 'The Hierophant', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg' },
  { name: 'The Lovers', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg' },
  { name: 'The Chariot', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg' },
  { name: 'Strength', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg' },
  { name: 'The Hermit', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg' },
  { name: 'Wheel of Fortune', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg' },
  { name: 'Justice', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg' },
  { name: 'The Hanged Man', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg' },
  { name: 'Death', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg' },
  { name: 'Temperance', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg' },
  { name: 'The Devil', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg' },
  { name: 'The Tower', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg' },
  { name: 'The Star', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg' },
  { name: 'The Moon', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg' },
  { name: 'The Sun', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg' },
  { name: 'Judgement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg' },
  { name: 'The World', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg' },
];

export const CARD_BACK_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Reverso_baraja_Rider-Waite.jpg';

export const SPREADS: Spread[] = [
    { id: 'single', name: 'Single Card', cardCount: 1, positions: ['Insight'] },
    { id: 'ppf', name: 'Past, Present, Future', cardCount: 3, positions: ['Past', 'Present', 'Future'] },
    { id: 'sao', name: 'Situation, Action, Outcome', cardCount: 3, positions: ['Situation', 'Action', 'Outcome'] },
];
