import wordsData from '../words/words.json';
import christmasWords from '../words/christmas-words.json';
import placesData from '../words/places.json';
import christmasPlacesData from '../words/christmas-places.json';
import { PlaceWithRoles } from '../types';

const WORDS_LIST = wordsData as string[];

const PLACES_LIST = placesData as PlaceWithRoles[];
const CHRISTMAS_PLACES_LIST = christmasPlacesData as PlaceWithRoles[];

// Priority items that should appear more often
const PRIORITY_WORD = 'sap';
const PRIORITY_PLACE = 'SAP Office Berlin';

// Boost multipliers
const PRIORITY_BOOST = 3; // SAP items are 3x more likely
const CHRISTMAS_BOOST = 4; // Christmas items are 4x more likely in December

// Track used words/places per session to avoid duplicates
const usedWordsPerSession = new Map<string, Set<string>>();
const usedPlacesPerSession = new Map<string, Set<string>>();

function isDecember(): boolean {
  return new Date().getMonth() === 11; // December is month 11 (0-indexed)
}

function getWeightedRandomItem<T>(
  items: T[],
  getKey: (item: T) => string,
  priorityKey: string | null,
  usedKeys: Set<string>,
  includeChristmas: boolean,
  christmasItems: T[] = []
): T | null {
  // Build weighted list excluding used items
  const weightedItems: { item: T; weight: number }[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (usedKeys.has(key.toLowerCase())) continue;

    let weight = 1;
    if (priorityKey && key.toLowerCase() === priorityKey.toLowerCase()) {
      weight = PRIORITY_BOOST;
    }
    weightedItems.push({ item, weight });
  }

  // Add christmas items with boost if in December
  if (includeChristmas) {
    for (const item of christmasItems) {
      const key = getKey(item);
      if (usedKeys.has(key.toLowerCase())) continue;
      weightedItems.push({ item, weight: CHRISTMAS_BOOST });
    }
  }

  if (weightedItems.length === 0) {
    // All items used, reset and try again (shouldn't happen in practice)
    return items[Math.floor(Math.random() * items.length)];
  }

  // Calculate total weight and select randomly
  const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
  let random = Math.random() * totalWeight;

  for (const wi of weightedItems) {
    random -= wi.weight;
    if (random <= 0) {
      return wi.item;
    }
  }

  return weightedItems[weightedItems.length - 1].item;
}

export function selectSecretWord(sessionCode?: string): string {
  // Get or create used words set for this session
  const usedWords = sessionCode
    ? (usedWordsPerSession.get(sessionCode) || new Set<string>())
    : new Set<string>();

  if (sessionCode && !usedWordsPerSession.has(sessionCode)) {
    usedWordsPerSession.set(sessionCode, usedWords);
  }

  const inDecember = isDecember();
  const selected = getWeightedRandomItem(
    WORDS_LIST,
    (word) => word,
    PRIORITY_WORD,
    usedWords,
    inDecember,
    inDecember ? christmasWords : []
  );

  if (selected && sessionCode) {
    usedWords.add(selected.toLowerCase());
  }

  return selected || WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
}

export function selectRandomPlace(sessionCode?: string): PlaceWithRoles {
  // Get or create used places set for this session
  const usedPlaces = sessionCode
    ? (usedPlacesPerSession.get(sessionCode) || new Set<string>())
    : new Set<string>();

  if (sessionCode && !usedPlacesPerSession.has(sessionCode)) {
    usedPlacesPerSession.set(sessionCode, usedPlaces);
  }

  const inDecember = isDecember();
  const selected = getWeightedRandomItem(
    PLACES_LIST,
    (place) => place.place,
    PRIORITY_PLACE,
    usedPlaces,
    inDecember,
    inDecember ? CHRISTMAS_PLACES_LIST : []
  );

  if (selected && sessionCode) {
    usedPlaces.add(selected.place.toLowerCase());
  }

  return selected || PLACES_LIST[Math.floor(Math.random() * PLACES_LIST.length)];
}

// Clean up session data when session ends
export function clearSessionWordHistory(sessionCode: string): void {
  usedWordsPerSession.delete(sessionCode);
  usedPlacesPerSession.delete(sessionCode);
}

export function assignRolesToPlayers(
  place: PlaceWithRoles,
  playerIds: string[],
  whitePlayerId: string
): Record<string, string> {
  const roles: Record<string, string> = {};
  const availableRoles = [...place.roles];

  // Shuffle roles
  for (let i = availableRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
  }

  // Assign roles to non-white players
  let roleIndex = 0;
  for (const playerId of playerIds) {
    if (playerId === whitePlayerId) {
      roles[playerId] = '???'; // White doesn't get a real role
    } else {
      // Cycle through roles if more players than roles
      roles[playerId] = availableRoles[roleIndex % availableRoles.length];
      roleIndex++;
    }
  }

  return roles;
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