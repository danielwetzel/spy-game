import { useState } from 'react'
import { cn } from '@/lib/utils'

// Synced with backend emoji pool - unique animal emojis only
const EMOJI_POOL = [
  // Mammals
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐻‍❄️", "🐼", "🐨",
  "🐯", "🦁", "🐮", "🐷", "🐗", "🐴", "🦓", "🦒", "🐘", "🦏",
  "🦛", "🐪", "🐫", "🦙", "🦌", "🦬", "🐺", "🦝", "🦡", "🦫",
  "🦦", "🦥", "🦔", "🐿️", "🦨", "🦇", "🐆", "🦧", "🦍", "🐑", "🐐",
  // Birds
  "🐔", "🐧", "🐦", "🐥", "🕊️", "🦆", "🦢", "🦉", "🦅",
  "🦩", "🦚", "🦜", "🦤", "🪿", "🦃",
  // Reptiles & amphibians
  "🐸", "🐢", "🐍", "🦎", "🐊",
  // Sea life
  "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🦑",
  "🦐", "🦞", "🦀", "🪼", "🦪",
  // Small critters
  "🐝", "🦋", "🐞", "🐜", "🪲",
]

interface EmojiSelectorProps {
  selectedEmoji: string | null
  usedEmojis: string[]
  onSelect: (emoji: string) => void
  compact?: boolean
  className?: string
}

export function EmojiSelector({ selectedEmoji, usedEmojis, onSelect, compact = false, className }: EmojiSelectorProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null)

  const handleSelect = (emoji: string) => {
    if (usedEmojis.includes(emoji)) return
    setAnimatingEmoji(emoji)
    onSelect(emoji)
    setTimeout(() => setAnimatingEmoji(null), 300)
  }

  return (
    <div className={cn("flex gap-4", compact ? "flex-col sm:flex-row" : "flex-col", className)}>
      {/* Selected emoji preview - side by side on larger screens when compact */}
      <div className={cn(
        "flex items-center justify-center",
        compact ? "sm:flex-shrink-0" : ""
      )}>
        <div className={cn(
          "relative rounded-2xl border-4 flex items-center justify-center transition-all duration-300",
          compact ? "w-20 h-20" : "w-24 h-24",
          selectedEmoji
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
            : "border-dashed border-muted-foreground/30 bg-muted/20"
        )}>
          {selectedEmoji ? (
            <span className={cn("animate-bounce-in", compact ? "text-4xl" : "text-5xl")}>{selectedEmoji}</span>
          ) : (
            <span className={cn("opacity-30", compact ? "text-3xl" : "text-4xl")}>?</span>
          )}
          {selectedEmoji && (
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
          )}
        </div>
      </div>

      {/* Emoji grid */}
      <div className="flex-1">
        <div className={cn(
          "grid gap-1.5 p-3 rounded-xl bg-muted/20 border border-muted overflow-y-auto",
          compact ? "grid-cols-10 max-h-40" : "grid-cols-8 sm:grid-cols-10 max-h-52"
        )}>
          {EMOJI_POOL.map((emoji, idx) => {
            const isUsed = usedEmojis.includes(emoji)
            const isSelected = selectedEmoji === emoji
            const isHovered = hoveredEmoji === emoji
            const isAnimating = animatingEmoji === emoji

            return (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => handleSelect(emoji)}
                onMouseEnter={() => setHoveredEmoji(emoji)}
                onMouseLeave={() => setHoveredEmoji(null)}
                disabled={isUsed}
                className={cn(
                  "relative rounded-md flex items-center justify-center transition-all duration-200",
                  compact ? "w-8 h-8 text-lg" : "w-9 h-9 sm:w-10 sm:h-10 text-xl",
                  isUsed && "opacity-30 cursor-not-allowed grayscale",
                  !isUsed && !isSelected && "hover:bg-primary/20 hover:scale-110 cursor-pointer",
                  isSelected && "bg-primary/30 ring-2 ring-primary scale-110",
                  isAnimating && "animate-ping-once",
                  isHovered && !isUsed && "shadow-lg"
                )}
              >
                {emoji}
                {isUsed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-0.5 bg-red-500 rotate-45 absolute" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {/* Legend - only show when not compact */}
        {!compact && (
          <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/30 ring-2 ring-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted opacity-30 grayscale" />
              <span>Taken</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
