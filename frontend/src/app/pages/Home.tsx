import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { useSessionStore } from '@/lib/session-store'

export function Home() {
  const [name, setName] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const navigate = useNavigate()
  const setMe = useSessionStore(state => state.setMe)

  const createSessionMutation = useMutation({
    mutationFn: () => apiClient.createSession({
      name,
      category: 'default',
      settings: {}
    }),
    onSuccess: (data) => {
      setMe({
        playerId: data.playerId,
        token: data.playerToken,
        name,
        emoji: data.emoji
      })
      navigate(`/lobby/${data.code}`)
    }
  })

  const joinSessionMutation = useMutation({
    mutationFn: () => apiClient.joinSession(sessionCode.toLowerCase(), { name }),
    onSuccess: (data) => {
      setMe({
        playerId: data.playerId,
        token: data.playerToken,
        name,
        emoji: data.emoji
      })
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
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Spy Hunt
          </h1>
          <p className="text-muted-foreground">
            The ultimate multiplayer party game
          </p>
        </div>

        <Card className="game-card">
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