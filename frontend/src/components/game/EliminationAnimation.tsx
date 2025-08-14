import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skull, Crown, Target } from 'lucide-react'

interface EliminationAnimationProps {
  isVisible: boolean
  eliminatedPlayerName: string
  eliminatedPlayerEmoji: string
  wasWhite: boolean
  onAnimationComplete: () => void
}

export function EliminationAnimation({ 
  isVisible, 
  eliminatedPlayerName, 
  eliminatedPlayerEmoji, 
  wasWhite, 
  onAnimationComplete 
}: EliminationAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'fade-in' | 'reveal' | 'fade-out'>('fade-in')

  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase('fade-in')
      return
    }

    const timer1 = setTimeout(() => {
      setAnimationPhase('reveal')
    }, 1200)

    const timer2 = setTimeout(() => {
      setAnimationPhase('fade-out')
    }, 7000)

    const timer3 = setTimeout(() => {
      onAnimationComplete()
    }, 9000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isVisible, onAnimationComplete])

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000 ${
        animationPhase === 'fade-in' ? 'opacity-0 backdrop-blur-none' :
        animationPhase === 'reveal' ? 'opacity-100 backdrop-blur-lg' :
        'opacity-0 backdrop-blur-none'
      }`}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: animationPhase === 'reveal' ? 'blur(20px)' : 'blur(0px)'
      }}
    >
      <div className={`text-center transform transition-all duration-1000 ${
        animationPhase === 'fade-in' ? 'scale-50 opacity-0' :
        animationPhase === 'reveal' ? 'scale-100 opacity-100' :
        'scale-150 opacity-0'
      }`}>
        
        {/* Skull Icon Animation */}
        <div className="mb-8">
          <div className={`relative inline-block transition-all duration-2000 ${
            animationPhase === 'reveal' ? 'animate-bounce' : ''
          }`}>
            <Skull className={`h-24 w-24 mx-auto ${wasWhite ? 'text-red-400' : 'text-orange-400'}`} />
            {wasWhite && (
              <Crown className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            )}
          </div>
        </div>

        {/* Player Card */}
        <Card className={`border-4 mb-8 mx-auto max-w-md ${
          wasWhite 
            ? 'border-red-500 bg-red-500/20 shadow-red-500/50' 
            : 'border-orange-500 bg-orange-500/20 shadow-orange-500/50'
        } shadow-2xl`}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-4xl">
                  {eliminatedPlayerEmoji}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {eliminatedPlayerName}
                </h3>
                <Badge 
                  variant={wasWhite ? "destructive" : "secondary"} 
                  className="text-lg px-4 py-2"
                >
                  {wasWhite ? 'Mr / Ms White' : 'Innocent'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Elimination Text */}
        <div className="space-y-4">
          <h1 className={`text-6xl font-black uppercase tracking-wider ${
            wasWhite ? 'text-red-400' : 'text-orange-400'
          } ${animationPhase === 'reveal' ? 'animate-pulse' : ''}`}>
            ELIMINATED
          </h1>
          
          <p className="text-xl text-white/80">
            {wasWhite 
              ? `${eliminatedPlayerName} was Mr / Ms White!` 
              : `${eliminatedPlayerName} was innocent...`
            }
          </p>

          {wasWhite && (
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Target className="h-6 w-6" />
              <span className="text-lg font-semibold">
                Time for the final guess!
              </span>
            </div>
          )}
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 ${wasWhite ? 'bg-red-400' : 'bg-orange-400'} rounded-full`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float 3s ease-in-out ${Math.random() * 2}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}