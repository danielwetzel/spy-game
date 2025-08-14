import { nanoid } from 'nanoid';
import sessionCodeWords from '../words/session-code.json';

export function generatePlayerId(): string {
  return `p_${nanoid(8)}`;
}

export function generatePlayerToken(): string {
  return `tok_${nanoid(32)}`;
}

export function generateSessionCode(activeCodes: Set<string>): string {
  const maxAttempts = 100;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const word = sessionCodeWords[Math.floor(Math.random() * sessionCodeWords.length)];
    const digits = Math.floor(1000 + Math.random() * 9000);
    const code = `${word}-${digits}`;
    
    if (!activeCodes.has(code)) {
      return code;
    }
    attempts++;
  }
  
  // Fallback to nanoid if we can't find a unique combination
  return `game-${nanoid(8)}`;
}