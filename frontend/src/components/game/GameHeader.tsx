import { Badge } from '@/components/ui/badge'
import { Clock, Eye, EyeOff } from 'lucide-react'
import { GamePhase } from '@/types'

interface GameHeaderProps {
  phase: GamePhase
  roundNumber?: number
  timeRemaining?: string
  isWhite: boolean
  secretWord?: string
}

export function GameHeader({ phase, roundNumber, timeRemaining, isWhite, secretWord }: GameHeaderProps) {
  const getPhaseDisplay = (phase: GamePhase) => {
    switch (phase) {
      case 'dealing':
        return { label: 'Dealing Cards', color: 'bg-blue-500' }
      case 'round_play':
        return { label: `Round ${roundNumber || 1}`, color: 'bg-green-500' }
      case 'voting':
        return { label: 'Voting Time', color: 'bg-yellow-500' }
      case 'white_guess':
        return { label: 'White Guessing', color: 'bg-purple-500' }
      case 'resolution':
        return { label: 'Results', color: 'bg-orange-500' }
      default:
        return { label: phase, color: 'bg-gray-500' }
    }
  }

  const phaseDisplay = getPhaseDisplay(phase)

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Badge className={`${phaseDisplay.color} text-white px-3 py-1`}>
          {phaseDisplay.label}
        </Badge>
        {timeRemaining && (
          <div className="flex items-center gap-2 text-yellow-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">{timeRemaining}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <Badge variant={isWhite ? 'destructive' : 'default'} className="flex items-center gap-2">
          {isWhite ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {isWhite ? 'Mr/Ms White' : 'Has Word'}
        </Badge>

        {/* Secret Word Display */}
        {!isWhite && secretWord && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
            <p className="text-sm text-muted-foreground mb-1">Secret Word:</p>
            <p className="font-bold text-primary text-lg">{secretWord}</p>
          </div>
        )}
      </div>
    </div>
  )
}