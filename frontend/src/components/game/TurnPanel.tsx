import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle } from 'lucide-react'
import { Player } from '@/types'

interface TurnPanelProps {
  currentPlayer: Player | null
  isMyTurn: boolean
  onConfirmSpoken: () => void
}

export function TurnPanel({ currentPlayer, isMyTurn, onConfirmSpoken }: TurnPanelProps) {
  if (isMyTurn) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold">It's your turn to speak!</h3>
        <p className="text-muted-foreground">
          Give a clue about the word without saying it directly.
        </p>
        <Button onClick={onConfirmSpoken} size="lg" className="w-full">
          <MessageCircle className="h-4 w-4 mr-2" />
          I've Spoken
        </Button>
      </div>
    )
  }

  if (currentPlayer) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold">
          <span className="text-primary">{currentPlayer.name}</span> is speaking
        </h3>
        <div className="flex items-center justify-center">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-2xl">
              {currentPlayer.emoji}
            </AvatarFallback>
          </Avatar>
        </div>
        <p className="text-muted-foreground">
          Listen carefully to their clue...
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-muted-foreground">Waiting for round to start...</p>
    </div>
  )
}