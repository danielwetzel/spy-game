import defaultWords from '../words/default.json';
import softWords from '../words/soft.json';
import hardWords from '../words/hard.json';

const WORD_LISTS = {
  default: defaultWords,
  soft: softWords,
  hard: hardWords
};

export function selectSecretWord(category: string): string {
  const words = WORD_LISTS[category as keyof typeof WORD_LISTS] || WORD_LISTS.default;
  return words[Math.floor(Math.random() * words.length)];
}

export function normalizeGuess(guess: string): string {
  return guess
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function isCorrectGuess(guess: string, secretWord: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(secretWord);
}