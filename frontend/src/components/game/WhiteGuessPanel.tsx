import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface WhiteGuessPanelProps {
  isWhite: boolean
  guessEndsAt: number
  onSubmitGuess: (guess: string) => void
}

export function WhiteGuessPanel({ isWhite, guessEndsAt, onSubmitGuess }: WhiteGuessPanelProps) {
  const [guess, setGuess] = useState('')
  const isGuessEnded = Date.now() > guessEndsAt

  const handleSubmit = () => {
    if (guess.trim()) {
      onSubmitGuess(guess.trim())
      setGuess('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (isWhite) {
    return (
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-red-400">
            You've been caught!
          </h3>
          <p className="text-muted-foreground">
            Enter your guess for the secret word:
          </p>
        </div>
        
        <div className="flex gap-2 max-w-md mx-auto">
          <Input
            placeholder="Your guess..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGuessEnded}
            className="text-center"
            autoFocus
          />
          <Button 
            onClick={handleSubmit}
            disabled={!guess.trim() || isGuessEnded}
          >
            Guess
          </Button>
        </div>
        
        {isGuessEnded && (
          <p className="text-muted-foreground text-sm">
            Time's up!
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <h3 className="text-xl font-bold">
        Mr/Ms White is making their guess...
      </h3>
      <div className="animate-pulse text-yellow-400">
        <p>Waiting for final answer...</p>
      </div>
    </div>
  )
}