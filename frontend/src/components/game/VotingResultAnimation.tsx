import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Target, Crown } from 'lucide-react'

interface VotingResultAnimationProps {
  isVisible: boolean
  accusedPlayerId: string | null
  accusedPlayerName?: string
  accusedPlayerEmoji?: string
  isTie: boolean
  wasWhite: boolean
  onAnimationComplete: () => void
}

export function VotingResultAnimation({ 
  isVisible, 
  accusedPlayerId,
  accusedPlayerName,
  accusedPlayerEmoji,
  isTie,
  wasWhite,
  onAnimationComplete 
}: VotingResultAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'fade-in' | 'reveal' | 'fade-out'>('fade-in')

  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase('fade-in')
      return
    }

    const timer1 = setTimeout(() => {
      setAnimationPhase('reveal')
    }, 1000)

    const timer2 = setTimeout(() => {
      setAnimationPhase('fade-out')
    }, 6000)

    const timer3 = setTimeout(() => {
      onAnimationComplete()
    }, 8000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isVisible, onAnimationComplete])

  if (!isVisible) return null

  // Determine the animation type and content
  const getAnimationContent = () => {
    if (isTie || !accusedPlayerId) {
      // No one voted out
      return {
        icon: <Users className="h-24 w-24 text-blue-400" />,
        title: "NO ELIMINATION",
        subtitle: isTie ? "Voting ended in a tie!" : "No clear consensus reached",
        description: "The game continues to the next round",
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500',
        titleColor: 'text-blue-400'
      }
    } else if (wasWhite) {
      // White was caught
      return {
        icon: <Target className="h-24 w-24 text-purple-400" />,
        title: "Mr / Ms White was caught!",
        subtitle: accusedPlayerName ? `${accusedPlayerName} was Mr / Ms White!` : "",
        description: "Time for the final guess...",
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500',
        titleColor: 'text-purple-400',
        showPlayer: true
      }
    } else {
      // Wrong player eliminated (handled by EliminationAnimation)
      return null
    }
  }

  const content = getAnimationContent()
  if (!content) return null

  return (
    <div 
      className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-1000 ${
        animationPhase === 'fade-in' ? 'opacity-0 backdrop-blur-none' :
        animationPhase === 'reveal' ? 'opacity-100 backdrop-blur-lg' :
        'opacity-0 backdrop-blur-none'
      }`}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: animationPhase === 'reveal' ? 'blur(15px)' : 'blur(0px)'
      }}
    >
      <div className={`text-center transform transition-all duration-1000 ${
        animationPhase === 'fade-in' ? 'scale-50 opacity-0' :
        animationPhase === 'reveal' ? 'scale-100 opacity-100' :
        'scale-150 opacity-0'
      }`}>
        
        {/* Icon Animation */}
        <div className="mb-8">
          <div className={`relative inline-block transition-all duration-2000 ${
            animationPhase === 'reveal' ? 'animate-bounce' : ''
          }`}>
            {content.icon}
            {wasWhite && (
              <Crown className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            )}
          </div>
        </div>

        {/* Player Card (only for White caught) */}
        {content.showPlayer && accusedPlayerName && accusedPlayerEmoji && (
          <Card className={`border-4 mb-8 mx-auto max-w-md ${content.borderColor} ${content.bgColor} shadow-2xl`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-3xl">
                    {accusedPlayerEmoji}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {accusedPlayerName}
                  </h3>
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    Mr / Ms White
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result Text */}
        <div className="space-y-4">
          <h1 className={`text-5xl font-black uppercase tracking-wider ${content.titleColor} ${
            animationPhase === 'reveal' ? 'animate-pulse' : ''
          }`}>
            {content.title}
          </h1>
          
          <p className="text-xl text-white/80">
            {content.subtitle}
          </p>

          <p className="text-lg text-white/60">
            {content.description}
          </p>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 ${
                isTie ? 'bg-blue-400' : wasWhite ? 'bg-purple-400' : 'bg-orange-400'
              } rounded-full`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float 4s ease-in-out ${Math.random() * 3}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}