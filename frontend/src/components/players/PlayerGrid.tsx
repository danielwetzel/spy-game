import { Player } from '@/types'
import { PlayerCard } from './PlayerCard'
import { cn } from '@/lib/utils'

interface PlayerGridProps {
  players: Player[]
  hostId?: string
  currentTurnId?: string
  votedPlayerIds?: string[]
  isVoting?: boolean
  onVote?: (playerId: string) => void
  className?: string
}

export function PlayerGrid({ 
  players, 
  hostId, 
  currentTurnId, 
  votedPlayerIds = [],
  isVoting = false,
  onVote,
  className 
}: PlayerGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4",
      className
    )}>
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isHost={player.id === hostId}
          isCurrentTurn={player.id === currentTurnId}
          hasVoted={votedPlayerIds.includes(player.id)}
          isVotable={isVoting}
          onVote={onVote}
        />
      ))}
    </div>
  )
}