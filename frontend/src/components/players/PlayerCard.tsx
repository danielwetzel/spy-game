import { Player } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Crown, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  player: Player
  isHost?: boolean
  isCurrentTurn?: boolean
  hasVoted?: boolean
  isVotable?: boolean
  onVote?: (playerId: string) => void
  className?: string
}

export function PlayerCard({ 
  player, 
  isHost, 
  isCurrentTurn, 
  hasVoted, 
  isVotable,
  onVote,
  className 
}: PlayerCardProps) {
  const handleClick = () => {
    if (isVotable && onVote) {
      onVote(player.id)
    }
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        isCurrentTurn 
          ? "border-primary bg-primary/10 animate-pulse-glow" 
          : player.isConnected
            ? "border-green-500/20 bg-green-500/5"
            : "border-red-500/20 bg-red-500/5",
        isVotable && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-2xl">
              {player.emoji}
            </AvatarFallback>
          </Avatar>
          
          {isHost && (
            <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
          )}
          
          {hasVoted && (
            <Vote className="h-4 w-4 text-green-400 absolute -bottom-1 -right-1" />
          )}
        </div>
        
        <div className="text-center min-w-0 w-full">
          <p className="font-medium truncate text-sm">
            {player.name}
          </p>
          
          <div className="flex items-center justify-center gap-1 mt-1">
            <div 
              className={cn(
                "h-2 w-2 rounded-full",
                player.isConnected ? "bg-green-400" : "bg-red-400"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {player.isConnected ? "Online" : "Offline"}
            </span>
          </div>
          
          {isCurrentTurn && (
            <Badge variant="outline" className="text-xs mt-2">
              Speaking
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}