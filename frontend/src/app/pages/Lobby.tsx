import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Users, Play, Crown, Palette, Check, Loader2 } from 'lucide-react'
import { useSessionStore, getStoredSession } from '@/lib/session-store'
import { apiClient } from '@/lib/api'
import { formatSessionCode } from '@/lib/utils'
import { toast } from '@/lib/use-toast'
import { EmojiSelector } from '@/components/game/EmojiSelector'

export function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, me, setMe, connect, isConnected } = useSessionStore()

  const startGameMutation = useMutation({
    mutationFn: () => apiClient.startGame(code!, me.token!),
    onError: (error) => {
      console.error('Failed to start game:', error)
    }
  })

  const updateEmojiMutation = useMutation({
    mutationFn: (emoji: string) => apiClient.updateEmoji(code!, me.token!, emoji),
    onSuccess: (data) => {
      setMe({ emoji: data.emoji })
      toast({
        title: "Character updated!",
        description: `Your new character is ${data.emoji}`
      })
    },
    onError: (error) => {
      toast({
        title: "Couldn't change character",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const toggleReadyMutation = useMutation({
    mutationFn: () => apiClient.toggleReady(code!, me.token!),
    onError: (error) => {
      toast({
        title: "Couldn't update ready status",
        description: error.message,
        variant: "destructive"
      })
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
  // Host doesn't need to be ready - they just start the game
  const nonHostPlayers = session?.players.filter(p => p.id !== session.hostPlayerId) ?? []
  const allReady = nonHostPlayers.every(p => p.isReady)
  const readyCount = nonHostPlayers.filter(p => p.isReady).length
  const canStart = session && session.players.length >= 4 && allReady
  const myPlayer = session?.players.find(p => p.id === me.playerId)

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
          
          <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{session.players.length} players</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              <span className={readyCount === nonHostPlayers.length ? 'text-green-400' : ''}>
                {readyCount}/{nonHostPlayers.length} ready
              </span>
            </div>
            {session.players.length < 4 && (
              <span className="text-yellow-400">
                Need {4 - session.players.length} more
              </span>
            )}
          </div>
        </div>

        {/* Players Grid - Compact */}
        <Card className="game-card mb-4">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {session.players.map((player) => {
                const isMe = player.id === me.playerId
                const isPlayerHost = player.id === session.hostPlayerId
                const showReady = !isPlayerHost && player.isReady

                return (
                  <div
                    key={player.id}
                    className={`p-2 rounded-lg border transition-all ${
                      showReady
                        ? 'border-green-500/50 bg-green-500/10'
                        : isMe
                          ? 'border-primary/50 bg-primary/10'
                          : player.isConnected
                            ? 'border-muted bg-muted/10'
                            : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative">
                        <Avatar className={`h-10 w-10 ${showReady ? 'ring-2 ring-green-500' : isMe ? 'ring-2 ring-primary' : ''}`}>
                          <AvatarFallback className="text-xl">
                            {player.emoji}
                          </AvatarFallback>
                        </Avatar>
                        {isPlayerHost && (
                          <Crown className="h-3.5 w-3.5 text-yellow-400 absolute -top-1 -right-1" />
                        )}
                        {showReady && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate max-w-full text-center">
                        {player.name}
                        {isMe && <span className="text-primary"> (You)</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Emoji Selector + Ready Button Combined */}
        <Card className="game-card mb-4">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-purple-400" />
              Choose Your Character
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4">
              <EmojiSelector
                selectedEmoji={me.emoji}
                usedEmojis={session.players.filter(p => p.id !== me.playerId).map(p => p.emoji)}
                onSelect={(emoji) => updateEmojiMutation.mutate(emoji)}
                compact
              />

              {/* Ready Button - Only for non-host players */}
              {!isHost && (
                <div className="pt-2 border-t border-muted">
                  <Button
                    onClick={() => toggleReadyMutation.mutate()}
                    disabled={toggleReadyMutation.isPending}
                    size="lg"
                    className={`w-full ${myPlayer?.isReady ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  >
                    {toggleReadyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : myPlayer?.isReady ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : null}
                    {myPlayer?.isReady ? "I'm Ready!" : "Click When Ready"}
                  </Button>
                  {!myPlayer?.isReady && (
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Pick your character and click ready to start
                    </p>
                  )}
                </div>
              )}
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
                    : session.players.length < 4
                      ? `Need ${4 - session.players.length} More Players`
                      : !allReady
                        ? `Waiting for ${nonHostPlayers.length - readyCount} player(s)`
                        : 'Start Game'
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