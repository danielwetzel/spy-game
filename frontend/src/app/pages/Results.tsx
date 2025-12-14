import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Eye, EyeOff, Home, RotateCcw, Medal, Target, Crosshair } from 'lucide-react'
import { useSessionStore, getStoredSession } from '@/lib/session-store'
import { apiClient } from '@/lib/api'

export function Results() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, gameResult, me, connect, isConnected, reset } = useSessionStore()

  const restartMutation = useMutation({
    mutationFn: () => apiClient.restartGame(code!, me.token!),
    onError: (error) => {
      console.error('Failed to restart game:', error)
    }
  })

  // Validate session and connect
  useEffect(() => {
    // Check if session is expired
    const sessionData = getStoredSession()
    if (!sessionData) {
      // Session expired or invalid, redirect to home
      navigate('/')
      return
    }

    if (code && me.token) {
      connect(code, me.token)
    } else {
      navigate('/')
    }
  }, [code, me.token, connect, navigate])

  useEffect(() => {
    if (session?.phase && session.phase !== 'ended') {
      if (session.phase === 'lobby') {
        navigate(`/lobby/${code}`)
      } else {
        navigate(`/game/${code}`)
      }
    }
  }, [session?.phase, navigate, code])

  const handleNewGame = () => {
    reset() // Clear session storage
    navigate('/')
  }

  const handlePlayAgain = () => {
    restartMutation.mutate()
  }

  if (!session || !isConnected || session.phase !== 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  // Use the actual game result from the store
  if (!gameResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No game result available</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  const whitePlayer = session.players.find(p => p.id === gameResult.whitePlayerId)
  const amIWhite = me.playerId === gameResult.whitePlayerId
  const didIWin = (amIWhite && gameResult.winner === 'white') || (!amIWhite && gameResult.winner === 'others')

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Winner Banner */}
        <Card className={`game-card mb-8 ${didIWin ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className={`h-8 w-8 ${didIWin ? 'text-green-400' : 'text-red-400'}`} />
              <h1 className="text-3xl font-bold">
                {didIWin ? 'You Win!' : 'You Lose!'}
              </h1>
            </div>
            
            <div className="space-y-2">
              <p className="text-xl">
                {gameResult.winner === 'white' ? (
                  <>Mr/Ms White guessed correctly and wins!</>
                ) : (
                  <>The word bearers found Mr/Ms White!</>
                )}
              </p>
              
              {gameResult.whiteGuess && (
                <p className="text-muted-foreground">
                  White's guess: <span className="font-mono">{gameResult.whiteGuess}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Secret Word Reveal */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Secret Word
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-3xl font-bold text-primary">
                    {gameResult.secretWord}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Category: <span className="capitalize">{session.secretWordCategory}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mr/Ms White Reveal */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="h-5 w-5" />
                Mr/Ms White
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whitePlayer && (
                <div className="text-center space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-3xl">
                        {whitePlayer.emoji}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xl font-bold">{whitePlayer.name}</p>
                      <Badge variant="destructive" className="mt-1">
                        Mr/Ms White
                      </Badge>
                    </div>
                  </div>
                  
                  {gameResult.winner === 'white' ? (
                    <p className="text-green-400 text-sm">
                      Successfully guessed the word!
                    </p>
                  ) : (
                    <p className="text-red-400 text-sm">
                      Was caught by the other players
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Players */}
        <Card className="game-card mb-8">
          <CardHeader>
            <CardTitle>Final Standings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {session.players.map((player) => {
                const isWhite = player.id === gameResult.whitePlayerId
                const isWinner = (isWhite && gameResult.winner === 'white') || 
                                (!isWhite && gameResult.winner === 'others')
                
                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border ${
                      isWinner 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-2xl">
                            {player.emoji}
                          </AvatarFallback>
                        </Avatar>
                        {isWinner && (
                          <Trophy className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="font-medium truncate max-w-full">
                          {player.name}
                        </p>
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <Badge variant={isWhite ? 'destructive' : 'default'} className="text-xs">
                            {isWhite ? 'Mr/Ms White' : 'Word Bearer'}
                          </Badge>
                          <span className={`text-xs ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                            {isWinner ? 'Winner' : 'Loser'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scoreboard */}
        {session.scoreboard && session.scoreboard.gamesPlayed > 0 && (
          <Card className="game-card mb-8 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-yellow-400" />
                Scoreboard
                <Badge variant="outline" className="ml-2">
                  {session.scoreboard.gamesPlayed} game{session.scoreboard.gamesPlayed !== 1 ? 's' : ''} played
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.players
                  .map(player => ({
                    player,
                    playerScore: session.scoreboard?.scores[player.name]
                  }))
                  .sort((a, b) => (b.playerScore?.score || 0) - (a.playerScore?.score || 0))
                  .map(({ player, playerScore }, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 && playerScore?.score ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-6 text-center">
                          {index === 0 && playerScore?.score ? '👑' : `#${index + 1}`}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-xl">{player.emoji}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {playerScore?.gamesPlayed || 0} games
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-green-400">{playerScore?.score || 0}</p>
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Crosshair className="h-3 w-3 text-purple-400" />
                            <span className="text-sm">{playerScore?.whiteWins || 0}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">+3 pts</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-blue-400" />
                            <span className="text-sm">{playerScore?.wordBearerWins || 0}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">+1 pt</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Stats */}
        <Card className="game-card mb-8">
          <CardHeader>
            <CardTitle>Game Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{session.round?.roundNumber || 1}</p>
                <p className="text-sm text-muted-foreground">Rounds Played</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{session.players.length}</p>
                <p className="text-sm text-muted-foreground">Total Players</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{session.settings.voteSeconds}s</p>
                <p className="text-sm text-muted-foreground">Vote Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{session.settings.whiteGuessSeconds}s</p>
                <p className="text-sm text-muted-foreground">Guess Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {me.playerId === session.hostPlayerId && (
            <Button
              onClick={handlePlayAgain}
              size="lg"
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              disabled={restartMutation.isPending}
            >
              <RotateCcw className={`h-4 w-4 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
              {restartMutation.isPending ? 'Starting...' : 'Play Again'}
            </Button>
          )}
          <Button onClick={handleNewGame} size="lg" variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Leave Game
          </Button>
        </div>
      </div>
    </div>
  )
}