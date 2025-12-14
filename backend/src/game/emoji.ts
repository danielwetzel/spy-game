// A curated set of nice-looking, animal-only emojis.
// - Unique (no duplicates) so everyone can pick a distinct emoji within a game.
// - Large enough to comfortably cover big lobbies.
const EMOJI_POOL = [
  // Mammals
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐻‍❄️", "🐼", "🐨",
  "🐯", "🦁", "🐮", "🐷", "🐗", "🐴", "🦓", "🦒", "🐘", "🦏",
  "🦛", "🐪", "🐫", "🦙", "🦌", "🦬", "🐺", "🦝", "🦡", "🦫",
  "🦦", "🦥", "🦔", "🐿️", "🦨", "🦇", "🐆", "🦧", "🦍", 
  "🐑", "🐐", 

  // Birds
  "🐔", "🐧", "🐦", "🐥", "🕊️", "🦆", "🦢", "🦉", "🦅",
  "🦩", "🦚", "🦜", "🦤", "🪿", "🦃",

  // Reptiles & amphibians
  "🐸", "🐢", "🐍", "🦎", "🐊",

  // Sea life
  "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🦑",
  "🦐", "🦞", "🦀", "🪼", "🦪",

  // Small critters (kept cute)
  "🐝", "🦋", "🐞", "🐜", "🪲",
];

export function assignEmoji(usedEmojis: Set<string>): string {
  // First try to find an unused emoji
  for (const emoji of EMOJI_POOL) {
    if (!usedEmojis.has(emoji)) {
      return emoji;
    }
  }
  
  // If all are used, return a random one (allowing duplicates)
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
}

export function getUsedEmojis(players: Array<{ emoji: string }>): Set<string> {
  return new Set(players.map(p => p.emoji));
}
