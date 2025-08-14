import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Users, Play, Crown } from 'lucide-react'
import { useSessionStore } from '@/lib/session-store'
import { apiClient } from '@/lib/api'
import { formatSessionCode } from '@/lib/utils'
import { toast } from '@/lib/use-toast'

export function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, me, connect, isConnected } = useSessionStore()

  const startGameMutation = useMutation({
    mutationFn: () => apiClient.startGame(code!, me.token!),
    onError: (error) => {
      console.error('Failed to start game:', error)
    }
  })

  useEffect(() => {
    if (code && me.token) {
      connect(code, me.token)
    } else {
      navigate('/')
    }
  }, [code, me.token, connect, navigate])

  useEffect(() => {
    if (session?.phase !== 'lobby') {
      navigate(`/game/${code}`)
    }
  }, [session?.phase, navigate, code])

  const handleCopyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(formatSessionCode(code))
      toast({
        title: "Code copied!",
        description: `Session code ${formatSessionCode(code)} copied to clipboard.`
      })
    }
  }

  const handleStartGame = () => {
    startGameMutation.mutate()
  }

  const isHost = me.playerId === session?.hostPlayerId
  const canStart = session && session.players.length >= 4

  if (!session || !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connecting to game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl font-bold">Game Lobby</h1>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {formatSessionCode(session.code)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCode}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{session.players.length} players</span>
            {!canStart && (
              <span className="text-yellow-400">
                • Need {4 - session.players.length} more to start
              </span>
            )}
          </div>
        </div>

        {/* Players Grid */}
        <Card className="game-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {session.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border ${
                    player.isConnected 
                      ? 'border-green-500/20 bg-green-500/5' 
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
                      {player.id === session.hostPlayerId && (
                        <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium truncate max-w-full">
                        {player.name}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div 
                          className={`h-2 w-2 rounded-full ${
                            player.isConnected ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {player.isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Host Controls */}
        {isHost && (
          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                Host Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium">Game Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Category: {session.secretWordCategory} • 
                      Vote Time: {session.settings.voteSeconds}s • 
                      Guess Time: {session.settings.whiteGuessSeconds}s
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleStartGame}
                  disabled={!canStart || startGameMutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startGameMutation.isPending 
                    ? 'Starting Game...' 
                    : canStart 
                      ? 'Start Game' 
                      : `Need ${4 - session.players.length} More Players`
                  }
                </Button>

                {startGameMutation.error && (
                  <p className="text-red-400 text-sm text-center">
                    {startGameMutation.error.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="game-card mt-6">
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Everyone gets the same secret word except one player (Mr/Ms White)</p>
              <p>• Take turns giving clues about the word without saying it</p>
              <p>• After everyone speaks, vote for who you think is Mr/Ms White</p>
              <p>• If White is caught, they get one chance to guess the word!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}