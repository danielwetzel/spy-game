const EMOJI_POOL = [
  "🦊", "🐙", "🦁", "🐯", "🐸", "🐼", "🐨", "🐵", "🦝", "🦔",
  "🐺", "🐱", "🐶", "🐰", "🐹", "🐭", "🐻", "🐮", "🐷", "🐽",
  "🦊", "🦄", "🐴", "🦓", "🦒", "🐘", "🐪", "🐫", "🦏", "🦛",
  "🐧", "🐦", "🦅", "🦆", "🦢", "🦉", "🦚", "🦜", "🐳", "🐋",
  "🐬", "🦈", "🐟", "🐠", "🐡", "🦀", "🦞", "🦐", "🦑", "🐌",
  "🦋", "🐛", "🐝", "🐞", "🕷️", "🦗", "🦟", "🦂", "🐢", "🦎",
  "🐍", "🐲", "🐉", "🦕", "🦖", "🎭", "🎪", "🎨", "🎯", "🎲",
  "🎮", "🎸", "🎺", "🎷", "🎻", "🥁", "🎤", "🎧", "🎬", "🎭",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
  "🥅", "⛳", "🏹", "🎣", "🥊", "🥋", "🎿", "⛷️", "🏂", "🏄‍♂️"
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