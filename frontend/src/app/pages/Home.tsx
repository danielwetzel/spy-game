import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useSessionStore, getStoredSession } from '@/lib/session-store'
import { GameIntroCarousel } from '@/components/game/GameIntroCarousel'

export function Home() {
  const [name, setName] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const navigate = useNavigate()
  const setMe = useSessionStore(state => state.setMe)

  // Show intro for first-time visitors
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('spyhunt_intro_seen')
    if (!hasSeenIntro) {
      setShowIntro(true)
    }
  }, [])

  // Auto-reconnect if valid session data exists (not expired) - only on initial mount
  useEffect(() => {
    const sessionData = getStoredSession()
    if (sessionData && sessionData.playerId && sessionData.token) {
      // Check if we have a session code stored
      const savedSession = localStorage.getItem('spyhunt_session')
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession)
          if (parsed.code) {
            setMe(sessionData)
            setName(sessionData.name || '')
            // Navigate to lobby/game based on session phase
            navigate(`/lobby/${parsed.code}`)
          }
        } catch (error) {
          console.error('Failed to restore session:', error)
          localStorage.removeItem('spyhunt_session')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCloseIntro = () => {
    setShowIntro(false)
    localStorage.setItem('spyhunt_intro_seen', 'true')
  }

  const createSessionMutation = useMutation({
    mutationFn: () => apiClient.createSession({
      name,
      category: 'default',
      settings: {}
    }),
    onSuccess: (data) => {
      const sessionData = {
        playerId: data.playerId,
        token: data.playerToken,
        name,
        emoji: data.emoji,
        code: data.code
      }
      setMe(sessionData) // This handles localStorage
      navigate(`/lobby/${data.code}`)
    }
  })

  const joinSessionMutation = useMutation({
    mutationFn: () => apiClient.joinSession(sessionCode.toLowerCase(), { name }),
    onSuccess: (data) => {
      const sessionData = {
        playerId: data.playerId,
        token: data.playerToken,
        name,
        emoji: data.emoji,
        code: sessionCode.toLowerCase()
      }
      setMe(sessionData) // This handles localStorage
      navigate(`/lobby/${sessionCode.toLowerCase()}`)
    }
  })

  const handleCreateGame = () => {
    if (name.trim()) {
      createSessionMutation.mutate()
    }
  }

  const handleJoinGame = () => {
    if (name.trim() && sessionCode.trim()) {
      joinSessionMutation.mutate()
    }
  }

  const isLoading = createSessionMutation.isPending || joinSessionMutation.isPending

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Intro Carousel */}
      {showIntro && <GameIntroCarousel onClose={handleCloseIntro} />}

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 animate-fade-in">
            Spy Hunt
          </h1>
          <p className="text-muted-foreground mb-4">
            The ultimate multiplayer party game
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIntro(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            How to Play
          </Button>
        </div>

        <Card className="game-card animate-slide-up">
          <CardHeader>
            <CardTitle>Join the Game</CardTitle>
            <CardDescription>
              Enter your name to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="text-center text-lg"
                maxLength={50}
                autoComplete="off"
                data-form-type="other"
              />
            </div>

            {!isJoining ? (
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateGame}
                  disabled={!name.trim() || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {createSessionMutation.isPending ? 'Creating...' : 'Create New Game'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setIsJoining(true)}
                  className="w-full"
                  size="lg"
                >
                  Join Existing Game
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Game Code (e.g., FALCON-1234)"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="text-center font-mono"
                  autoComplete="off"
                  data-form-type="other"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleJoinGame}
                    disabled={!name.trim() || !sessionCode.trim() || isLoading}
                    className="flex-1"
                  >
                    {joinSessionMutation.isPending ? 'Joining...' : 'Join Game'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsJoining(false)
                      setSessionCode('')
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {(createSessionMutation.error || joinSessionMutation.error) && (
              <p className="text-red-400 text-sm text-center">
                {createSessionMutation.error?.message || joinSessionMutation.error?.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}