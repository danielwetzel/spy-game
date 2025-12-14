import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Clock, MessageCircle, Vote, Crown, Users, Target } from 'lucide-react'
import { useSessionStore, getStoredSession } from '@/lib/session-store'
import { formatTimeRemaining } from '@/lib/utils'
import { SecretWordCard } from '@/components/game/SecretWordCard'
import { EliminationAnimation } from '@/components/game/EliminationAnimation'
import { VotingResultAnimation } from '@/components/game/VotingResultAnimation'

export function Game() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, me, elimination, votingResult, connect, isConnected, confirmSpoken, castVote, submitWhiteGuess, skipPlayer, hideElimination, hideVotingResult } = useSessionStore()
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [pendingVote, setPendingVote] = useState<string | null | undefined>(undefined)
  const [whiteGuess, setWhiteGuess] = useState('')
  const [timeRemaining, setTimeRemaining] = useState('')

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
    if (session?.phase === 'lobby') {
      navigate(`/lobby/${code}`)
    } else if (session?.phase === 'ended') {
      navigate(`/results/${code}`)
    }
  }, [session?.phase, navigate, code])

  // Timer update effect
  useEffect(() => {
    if (!session) return

    const updateTimer = () => {
      if (session.phase === 'voting' && session.vote) {
        setTimeRemaining(formatTimeRemaining(session.vote.votingEndsAt))
      } else if (session.phase === 'white_guess' && session.whiteGuess) {
        setTimeRemaining(formatTimeRemaining(session.whiteGuess.guessEndsAt))
      } else {
        setTimeRemaining('')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [session])

  const handleConfirmSpoken = () => {
    confirmSpoken()
  }

  const handleVote = (targetId: string | null) => {
    setPendingVote(targetId)
  }

  const confirmVote = () => {
    if (pendingVote !== undefined) {
      setSelectedVote(pendingVote)
      castVote(pendingVote)
      setPendingVote(undefined)
    }
  }

  const cancelVote = () => {
    setPendingVote(undefined)
  }

  const handleSubmitGuess = () => {
    if (whiteGuess.trim()) {
      submitWhiteGuess(whiteGuess.trim())
    }
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

  const currentPlayer = session.round 
    ? session.players[session.round.currentTurnIndex]
    : null
  const isMyTurn = currentPlayer?.id === me.playerId
  const isHost = me.playerId === session.hostPlayerId
  const amIWhite = me.role?.role === 'white'

  const getPhaseDisplay = () => {
    switch (session.phase) {
      case 'dealing':
        return { label: 'Dealing Cards', color: 'bg-blue-500' }
      case 'round_play':
        return { label: `Round ${session.round?.roundNumber || 1}`, color: 'bg-green-500' }
      case 'voting':
        return { label: 'Voting Time', color: 'bg-yellow-500' }
      case 'white_guess':
        return { label: 'White Guessing', color: 'bg-purple-500' }
      case 'resolution':
        return { label: 'Results', color: 'bg-orange-500' }
      default:
        return { label: session.phase, color: 'bg-gray-500' }
    }
  }

  const phaseDisplay = getPhaseDisplay()

  return (
    <div className="min-h-screen p-4">
      {/* Voting Result Animation Overlay */}
      {votingResult && (
        <VotingResultAnimation
          isVisible={votingResult.isVisible}
          accusedPlayerId={votingResult.accusedPlayerId}
          accusedPlayerName={votingResult.accusedPlayerName}
          accusedPlayerEmoji={votingResult.accusedPlayerEmoji}
          isTie={votingResult.isTie}
          wasWhite={votingResult.wasWhite}
          onAnimationComplete={hideVotingResult}
        />
      )}

      {/* Elimination Animation Overlay */}
      {elimination && (
        <EliminationAnimation
          isVisible={elimination.isVisible}
          eliminatedPlayerName={elimination.playerName}
          eliminatedPlayerEmoji={elimination.playerEmoji}
          wasWhite={elimination.wasWhite}
          onAnimationComplete={hideElimination}
        />
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
        </div>

        {/* Secret Word Card - Prominent Display */}
        <div className="mb-6">
          <SecretWordCard 
            isWhite={amIWhite} 
            secretWord={me.role?.word} 
          />
        </div>

        {/* Players Ring */}
        <Card className="game-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players
              {session.round && (
                <span className="text-sm text-muted-foreground ml-2">
                  Turn {session.round.turnsCompleted + 1} of {session.players.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {session.players.map((player) => {
                const isCurrentTurn = currentPlayer?.id === player.id
                const hasVoted = session.vote && player.id in session.vote.votes
                
                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border transition-all ${
                      player.isEliminated
                        ? 'border-gray-500/20 bg-gray-500/5 opacity-60'
                        : isCurrentTurn 
                          ? 'border-primary bg-primary/10 animate-pulse-glow' 
                          : player.isConnected
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
                        {session.phase === 'voting' && hasVoted && (
                          <Vote className="h-4 w-4 text-green-400 absolute -bottom-1 -right-1" />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="font-medium truncate max-w-full text-sm">
                          {player.name}
                        </p>
                        {isCurrentTurn && session.phase === 'round_play' && !player.isEliminated && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Speaking
                          </Badge>
                        )}
                        {player.isEliminated && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Eliminated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Game Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Turn/Action Panel */}
          <Card className="game-card">
            <CardHeader>
              <CardTitle>
                {session.phase === 'round_play' && 'Current Turn'}
                {session.phase === 'voting' && 'Cast Your Vote'}
                {session.phase === 'white_guess' && 'White Player Guessing'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.phase === 'round_play' && (
                <div className="space-y-4">
                  {isMyTurn ? (
                    <div className="text-center space-y-4">
                      <p className="text-lg">It's your turn to speak!</p>
                      <p className="text-sm text-muted-foreground">
                        Give a clue about the word without saying it directly.
                      </p>
                      <Button onClick={handleConfirmSpoken} size="lg" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        I've Spoken
                      </Button>
                    </div>
                  ) : currentPlayer ? (
                    <div className="text-center space-y-2">
                      <p className="text-lg">
                        <span className="font-bold">{currentPlayer.name}</span> is speaking
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-lg">
                            {currentPlayer.emoji}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Waiting for round to start...</p>
                  )}
                </div>
              )}

              {session.phase === 'voting' && (
                <div className="space-y-4">
                  <p className="text-center text-lg mb-4">Who is Mr/Ms White?</p>
                  {/* Show message for eliminated players */}
                  {session.players.find(p => p.id === me.playerId)?.isEliminated && (
                    <p className="text-center text-sm text-red-400 mb-4">
                      You have been eliminated and cannot vote
                    </p>
                  )}

                  {/* Already voted message */}
                  {selectedVote !== null && selectedVote !== undefined && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                      <p className="text-green-400 text-sm">
                        You voted for {selectedVote === null ? 'Skip' : session.players.find(p => p.id === selectedVote)?.name}
                      </p>
                    </div>
                  )}

                  <div className={`grid grid-cols-2 gap-3 ${
                    session.players.find(p => p.id === me.playerId)?.isEliminated || selectedVote !== null
                      ? 'opacity-40 pointer-events-none'
                      : ''
                  }`}>
                    {session.players.filter(player => !player.isEliminated).map((player) => {
                      const isSelected = pendingVote === player.id
                      const isMe = player.id === me.playerId

                      return (
                        <Button
                          key={player.id}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleVote(player.id)}
                          className={`w-full h-auto p-3 flex flex-col items-center gap-2 ${
                            isMe ? 'opacity-50 cursor-not-allowed' : ''
                          } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                          disabled={!session.vote || Date.now() > session.vote.votingEndsAt || isMe || selectedVote !== null}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-lg">
                              {player.emoji}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{player.name}</span>
                        </Button>
                      )
                    })}
                  </div>

                  {/* Skip vote button */}
                  <Button
                    variant={pendingVote === null ? "secondary" : "outline"}
                    onClick={() => handleVote(null)}
                    className={`w-full h-auto p-3 flex items-center justify-center gap-2 ${pendingVote === null ? 'ring-2 ring-primary' : ''}`}
                    disabled={!session.vote || Date.now() > session.vote.votingEndsAt || selectedVote !== null}
                  >
                    <Target className="h-5 w-5" />
                    <span className="text-sm">Skip Vote (No Accusation)</span>
                  </Button>

                  {/* Confirm/Cancel buttons at the bottom */}
                  {pendingVote !== undefined && selectedVote === null && (
                    <div className="flex gap-2 pt-2 border-t border-muted">
                      <Button
                        onClick={confirmVote}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        Confirm Vote
                        {pendingVote !== null && (
                          <span className="ml-2">
                            ({session.players.find(p => p.id === pendingVote)?.emoji})
                          </span>
                        )}
                        {pendingVote === null && (
                          <span className="ml-2">(Skip)</span>
                        )}
                      </Button>
                      <Button variant="outline" onClick={cancelVote}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {session.phase === 'white_guess' && (
                <div className="space-y-4">
                  {amIWhite ? (
                    <div className="space-y-4">
                      <p className="text-center text-lg">You've been caught!</p>
                      <p className="text-center text-sm text-muted-foreground">
                        Enter your guess for the secret word:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Your guess..."
                          value={whiteGuess}
                          onChange={(e) => setWhiteGuess(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmitGuess()}
                          disabled={!session.whiteGuess || Date.now() > session.whiteGuess.guessEndsAt}
                        />
                        <Button 
                          onClick={handleSubmitGuess}
                          disabled={!whiteGuess.trim() || !session.whiteGuess || Date.now() > session.whiteGuess.guessEndsAt}
                        >
                          Guess
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-lg">Mr/Ms White is making their guess...</p>
                      <div className="animate-pulse text-yellow-400">
                        Waiting for final answer...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Info Panel */}
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
                  <div className="space-y-2">
                    {session.players.filter(player => !player.isEliminated).map((player) => {
                      const hasVoted = player.id in session.vote!.votes
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between text-sm p-2 rounded-lg transition-all ${
                            hasVoted
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-muted/10 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{player.emoji}</span>
                            <span className={hasVoted ? 'text-green-400' : ''}>{player.name}</span>
                          </div>
                          <span className={hasVoted ? 'text-green-400 font-medium' : 'text-muted-foreground'}>
                            {hasVoted ? '✓ Locked in' : 'Deciding...'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    {Object.keys(session.vote.votes).length} / {session.players.filter(p => !p.isEliminated).length} votes cast
                  </div>
                </div>
              )}

              {isHost && session.phase === 'round_play' && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Host Controls</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipPlayer}
                    className="w-full"
                  >
                    Skip Current Player
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}