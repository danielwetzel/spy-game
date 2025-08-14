import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Target } from 'lucide-react'
import { Player } from '@/types'

interface VotingPanelProps {
  players: Player[]
  selectedVote: string | null
  onVote: (playerId: string | null) => void
  votingEndsAt: number
}

export function VotingPanel({ players, selectedVote, onVote, votingEndsAt }: VotingPanelProps) {
  const isVotingEnded = Date.now() > votingEndsAt

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center">Who is Mr/Ms White?</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => (
          <Button
            key={player.id}
            variant={selectedVote === player.id ? "default" : "outline"}
            onClick={() => onVote(player.id)}
            className="h-auto p-3 flex flex-col items-center gap-2"
            disabled={isVotingEnded}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-lg">
                {player.emoji}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{player.name}</span>
          </Button>
        ))}
        
        <Button
          variant={selectedVote === null ? "secondary" : "outline"}
          onClick={() => onVote(null)}
          className="h-auto p-3 flex flex-col items-center gap-2 col-span-2"
          disabled={isVotingEnded}
        >
          <Target className="h-6 w-6" />
          <span className="text-sm font-medium">Skip Vote</span>
        </Button>
      </div>
      
      {isVotingEnded && (
        <p className="text-center text-muted-foreground text-sm">
          Voting has ended
        </p>
      )}
    </div>
  )
}