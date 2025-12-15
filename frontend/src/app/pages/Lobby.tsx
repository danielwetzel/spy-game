import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Users, Play, Crown, Palette, Check, Loader2, HelpCircle, MapPin, MessageSquare, LogOut } from 'lucide-react'
import { useSessionStore, getStoredSession } from '@/lib/session-store'
import { apiClient } from '@/lib/api'
import { formatSessionCode, cn } from '@/lib/utils'
import { toast } from '@/lib/use-toast'
import { EmojiSelector } from '@/components/game/EmojiSelector'
import { GameIntroCarousel } from '@/components/game/GameIntroCarousel'
import { GameMode } from '@/types'

export function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, me, setMe, connect, isConnected, reset } = useSessionStore()
  const [showHowToPlay, setShowHowToPlay] = useState(false)

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

  const updateGameModeMutation = useMutation({
    mutationFn: (gameMode: GameMode) => apiClient.updateGameMode(code!, me.token!, gameMode),
    onSuccess: (data) => {
      toast({
        title: "Game mode updated!",
        description: data.gameMode === 'places_roles' ? "Playing Places + Roles" : "Playing Classic Word Mode"
      })
    },
    onError: (error) => {
      toast({
        title: "Couldn't change game mode",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Check for valid session data - redirect immediately if missing
  const storedSession = getStoredSession()
  const hasValidSession = storedSession && me.token

  // Validate session and connect - only run when code/token change, not on every state update
  useEffect(() => {
    if (!hasValidSession) {
      // Session expired or invalid, redirect to home
      navigate('/', { replace: true })
      return
    }

    if (code && me.token) {
      connect(code, me.token)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, me.token, hasValidSession])

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

  // If no valid session, show nothing (useEffect will redirect)
  if (!hasValidSession) {
    return null
  }

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
    <div className="min-h-screen p-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* How to Play Modal */}
        {showHowToPlay && (
          <GameIntroCarousel
            onClose={() => setShowHowToPlay(false)}
            gameMode={session.gameMode}
          />
        )}

        {/* Header */}
        <div className="text-center mb-8">
          {/* Title + Code in one row */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-3xl font-bold">Game Lobby</h1>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-muted hover:bg-muted/20 transition-colors"
            >
              <span className="text-lg font-mono text-muted-foreground">{formatSessionCode(session.code)}</span>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Game Mode Badge */}
          <div className="flex justify-center mb-3">
            {session.gameMode === 'places_roles' ? (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1 gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Places + Roles Mode
              </Badge>
            ) : (
              <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Classic Word Mode
              </Badge>
            )}
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
                {/* Game Mode Selector */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Game Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateGameModeMutation.mutate('word')}
                      disabled={updateGameModeMutation.isPending}
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all duration-200",
                        "hover:border-primary/50 hover:bg-primary/5",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        session.gameMode === 'word'
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-muted bg-muted/10"
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          session.gameMode === 'word' ? "bg-primary/20" : "bg-muted/30"
                        )}>
                          <MessageSquare className={cn(
                            "h-5 w-5",
                            session.gameMode === 'word' ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <p className={cn(
                            "font-semibold text-sm",
                            session.gameMode === 'word' ? "text-primary" : "text-foreground"
                          )}>Classic</p>
                          <p className="text-xs text-muted-foreground">Secret Word</p>
                        </div>
                      </div>
                      {session.gameMode === 'word' && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateGameModeMutation.mutate('places_roles')}
                      disabled={updateGameModeMutation.isPending}
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all duration-200",
                        "hover:border-purple-500/50 hover:bg-purple-500/5",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        session.gameMode === 'places_roles'
                          ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                          : "border-muted bg-muted/10"
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          session.gameMode === 'places_roles' ? "bg-purple-500/20" : "bg-muted/30"
                        )}>
                          <MapPin className={cn(
                            "h-5 w-5",
                            session.gameMode === 'places_roles' ? "text-purple-400" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <p className={cn(
                            "font-semibold text-sm",
                            session.gameMode === 'places_roles' ? "text-purple-400" : "text-foreground"
                          )}>Places + Roles</p>
                          <p className="text-xs text-muted-foreground">Location Game</p>
                        </div>
                      </div>
                      {session.gameMode === 'places_roles' && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Game Settings */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm text-muted-foreground">
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

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowHowToPlay(true)}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <HelpCircle className="h-5 w-5" />
            How to Play
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => { reset(); navigate('/'); }}
            className="text-muted-foreground hover:text-red-400 gap-2"
          >
            <LogOut className="h-5 w-5" />
            Leave Lobby
          </Button>
        </div>
      </div>
    </div>
  )
}