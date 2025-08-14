import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SessionState } from '@/types'

interface GameInfoPanelProps {
  session: SessionState
  isHost: boolean
  onSkipPlayer?: () => void
}

export function GameInfoPanel({ session, isHost, onSkipPlayer }: GameInfoPanelProps) {
  return (
    <Card className="game-card">
      <CardHeader>
        <CardTitle>Game Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Round</p>
            <p className="font-bold">{session.round?.roundNumber || 1}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Players</p>
            <p className="font-bold">{session.players.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-bold capitalize">{session.secretWordCategory}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phase</p>
            <p className="font-bold capitalize">{session.phase.replace('_', ' ')}</p>
          </div>
        </div>

        {session.phase === 'voting' && session.vote && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Voting Progress</p>
            <div className="space-y-1">
              {session.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{player.name}</span>
                  <span className={player.id in session.vote!.votes ? 'text-green-400' : 'text-muted-foreground'}>
                    {player.id in session.vote!.votes ? '✓ Voted' : 'Waiting...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost && session.phase === 'round_play' && onSkipPlayer && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Host Controls</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSkipPlayer}
              className="w-full"
            >
              Skip Current Player
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}