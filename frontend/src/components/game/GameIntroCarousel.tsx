import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Eye, EyeOff, MessageCircle, Vote, Target, Trophy, X, MapPin, User, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameMode } from '@/types'

interface GameIntroCarouselProps {
  onClose: () => void
  gameMode?: GameMode
}

const CLASSIC_SLIDES = [
  {
    icon: Eye,
    iconColor: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
    title: 'Welcome to Spy Hunt!',
    subtitle: 'The ultimate party game of deception',
    description: 'One player among you is Mr/Ms White - they don\'t know the secret word. Can you find them before they figure it out?',
    illustration: (
      <div className="flex justify-center gap-4 my-6">
        {['🦊', '🐙', '🦁', '🎭'].map((emoji, i) => (
          <div
            key={i}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-3xl",
              i === 3 ? "bg-red-500/30 ring-2 ring-red-400" : "bg-muted/30"
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {emoji}
          </div>
        ))}
      </div>
    )
  },
  {
    icon: EyeOff,
    iconColor: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    title: 'The Secret Word',
    subtitle: 'Everyone gets a word... except one',
    description: 'At the start, all players receive the same secret word - except Mr/Ms White, who gets nothing. They must blend in!',
    illustration: (
      <div className="flex flex-col items-center gap-4 my-6">
        <div className="flex gap-4">
          <div className="px-6 py-3 rounded-lg bg-green-500/20 border border-green-500/30">
            <span className="text-lg font-bold text-green-400">BANANA</span>
          </div>
          <div className="px-6 py-3 rounded-lg bg-green-500/20 border border-green-500/30">
            <span className="text-lg font-bold text-green-400">BANANA</span>
          </div>
        </div>
        <div className="px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/30">
          <span className="text-lg font-bold text-red-400">???</span>
        </div>
      </div>
    )
  },
  {
    icon: MessageCircle,
    iconColor: 'text-green-400',
    bgGradient: 'from-green-500/20 to-emerald-500/20',
    title: 'Give Clues',
    subtitle: 'Take turns speaking',
    description: 'Each player gives a one-word clue about the secret word. Be clever - too obvious and White figures it out, too vague and you look suspicious!',
    illustration: (
      <div className="flex flex-col items-center gap-3 my-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦊</span>
          <div className="px-4 py-2 rounded-full bg-muted/30 border">
            <span className="text-sm">"Yellow"</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐙</span>
          <div className="px-4 py-2 rounded-full bg-muted/30 border">
            <span className="text-sm">"Peel"</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎭</span>
          <div className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30">
            <span className="text-sm text-red-400">"Uhh... tasty?"</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Vote,
    iconColor: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-orange-500/20',
    title: 'Vote!',
    subtitle: 'Who is Mr/Ms White?',
    description: 'After everyone speaks, it\'s time to vote. Discuss amongst yourselves and try to identify the imposter. Majority rules!',
    illustration: (
      <div className="flex justify-center gap-2 my-6">
        {['🦊', '🐙', '🦁'].map((emoji, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
              <span className="text-xs">🗳️</span>
            </div>
            <div className="text-xs text-muted-foreground">→🎭</div>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Target,
    iconColor: 'text-red-400',
    bgGradient: 'from-red-500/20 to-rose-500/20',
    title: 'White\'s Last Chance',
    subtitle: 'One guess to win it all',
    description: 'If Mr/Ms White gets caught, they have one final chance - guess the secret word correctly and they win instead!',
    illustration: (
      <div className="flex flex-col items-center gap-4 my-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎭</span>
          <span className="text-2xl">💭</span>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded bg-muted/30 border opacity-50">Apple?</div>
          <div className="px-4 py-2 rounded bg-green-500/20 border border-green-500/30">
            <span className="text-green-400 font-bold">Banana!</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: MapPin,
    iconColor: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    title: 'There\'s Another Mode!',
    subtitle: 'Try Places + Roles',
    description: 'Want something different? In Places + Roles mode, everyone gets a secret location AND a unique character role. Click next to learn more!',
    illustration: (
      <div className="flex justify-center gap-4 my-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-purple-500/30 ring-2 ring-purple-400 animate-pulse">
            🏰
          </div>
          <span className="text-xs text-purple-400">Location</span>
        </div>
        <div className="text-2xl self-center">+</div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-pink-500/30 ring-2 ring-pink-400 animate-pulse">
            👑
          </div>
          <span className="text-xs text-pink-400">Role</span>
        </div>
      </div>
    ),
    isTransitionSlide: true
  }
]

const PLACES_ROLES_SLIDES = [
  {
    icon: MapPin,
    iconColor: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    title: 'The Secret Location',
    subtitle: 'Everyone is at the same place',
    description: 'All players are at a secret location - a Space Station, Castle, Pirate Ship, and more! Mr/Ms White has no idea where they are.',
    illustration: (
      <div className="flex flex-col items-center gap-4 my-6">
        <div className="flex gap-3">
          {['🚀', '🏰', '🏴‍☠️', '🎪'].map((emoji, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-purple-500/20 border border-purple-500/30"
            >
              {emoji}
            </div>
          ))}
        </div>
        <div className="px-6 py-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <span className="text-lg font-bold text-purple-400">🏰 Castle</span>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-green-400">✓ Everyone knows</span>
          <span className="text-red-400">✗ Except White</span>
        </div>
      </div>
    )
  },
  {
    icon: User,
    iconColor: 'text-pink-400',
    bgGradient: 'from-pink-500/20 to-rose-500/20',
    title: 'Unique Character Roles',
    subtitle: 'Each player has a different role',
    description: 'Everyone gets a unique role that fits the location. At a castle you might be the King, Knight, or Jester. Mr/Ms White doesn\'t know their role either!',
    illustration: (
      <div className="flex flex-col items-center gap-4 my-6">
        <div className="text-xs text-muted-foreground mb-1">At the Castle...</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-center">
            <div className="text-lg">👑</div>
            <span className="text-xs text-green-400">King</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-center">
            <div className="text-lg">⚔️</div>
            <span className="text-xs text-green-400">Knight</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-center">
            <div className="text-lg">🤡</div>
            <span className="text-xs text-green-400">Jester</span>
          </div>
        </div>
        <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-center">
          <div className="text-lg">🎭</div>
          <span className="text-xs text-red-400">White: ??? at ???</span>
        </div>
      </div>
    )
  },
  {
    icon: HelpCircle,
    iconColor: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
    title: 'Ask Questions',
    subtitle: 'Interrogate each other in character',
    description: 'Take turns asking questions like "How did you get here?", "What are you doing?", "Are you here often?" - answer in character!',
    illustration: (
      <div className="flex flex-col items-center gap-3 my-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦊</span>
          <div className="px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30">
            <span className="text-sm text-cyan-400">"How did you get here?"</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐙</span>
          <div className="px-4 py-2 rounded-full bg-muted/30 border">
            <span className="text-sm">"I rode my horse from the village"</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎭</span>
          <div className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30">
            <span className="text-sm text-red-400">"I... walked? Through the door?"</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Vote,
    iconColor: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-orange-500/20',
    title: 'Vote!',
    subtitle: 'Who is Mr/Ms White?',
    description: 'After everyone has spoken, vote for who you think doesn\'t belong. Watch for vague answers and confused reactions!',
    illustration: (
      <div className="flex justify-center gap-2 my-6">
        {['🦊', '🐙', '🦁'].map((emoji, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
              <span className="text-xs">🗳️</span>
            </div>
            <div className="text-xs text-muted-foreground">→🎭</div>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Target,
    iconColor: 'text-red-400',
    bgGradient: 'from-red-500/20 to-rose-500/20',
    title: 'White\'s Last Chance',
    subtitle: 'Guess the location to win!',
    description: 'If Mr/Ms White is caught, they get one chance to guess the secret location. Guess correctly and White wins!',
    illustration: (
      <div className="flex flex-col items-center gap-4 my-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎭</span>
          <span className="text-2xl">💭</span>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded bg-muted/30 border opacity-50">Beach?</div>
          <div className="px-4 py-2 rounded bg-green-500/20 border border-green-500/30">
            <span className="text-green-400 font-bold">Castle!</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Trophy,
    iconColor: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-yellow-500/20',
    title: 'Ready to Play!',
    subtitle: 'Good luck, have fun!',
    description: 'Stay in character, ask clever questions, and watch for anyone who seems lost. May the best spy hunter win!',
    illustration: (
      <div className="flex justify-center my-6">
        <div className="relative">
          <Trophy className="w-16 h-16 text-amber-400" />
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xl animate-bounce">
            🎉
          </div>
        </div>
      </div>
    )
  }
]

export function GameIntroCarousel({ onClose, gameMode = 'word' }: GameIntroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedMode, setSelectedMode] = useState<'word' | 'places_roles'>(gameMode === 'places_roles' ? 'places_roles' : 'word')
  const INTRO_SLIDES = selectedMode === 'places_roles' ? PLACES_ROLES_SLIDES : CLASSIC_SLIDES

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, INTRO_SLIDES.length - 1)))
  }

  const handleModeChange = (mode: 'word' | 'places_roles') => {
    setSelectedMode(mode)
    setCurrentSlide(0) // Reset to first slide when changing modes
  }

  const slide = INTRO_SLIDES[currentSlide] as typeof INTRO_SLIDES[number] & { isTransitionSlide?: boolean }
  const Icon = slide.icon
  const isLastSlide = currentSlide === INTRO_SLIDES.length - 1
  const isTransitionSlide = slide.isTransitionSlide === true

  const handleNext = () => {
    if (isTransitionSlide && selectedMode === 'word') {
      // Transition from Classic to Places + Roles
      setSelectedMode('places_roles')
      setCurrentSlide(0)
    } else {
      goToSlide(currentSlide + 1)
    }
  }

  const handleBack = () => {
    if (currentSlide === 0 && selectedMode === 'places_roles') {
      // Go back to Classic mode's transition slide
      setSelectedMode('word')
      setCurrentSlide(CLASSIC_SLIDES.length - 1)
    } else {
      goToSlide(currentSlide - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className={cn(
        "w-full max-w-lg game-card relative overflow-hidden",
        "bg-gradient-to-br",
        slide.bgGradient
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <CardContent className="pt-8 pb-6">
          {/* Game Mode Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-white/20 p-1 bg-black/20">
              <button
                onClick={() => handleModeChange('word')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  selectedMode === 'word'
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                )}
              >
                <MessageCircle className="h-4 w-4" />
                Classic
              </button>
              <button
                onClick={() => handleModeChange('places_roles')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  selectedMode === 'places_roles'
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                )}
              >
                <MapPin className="h-4 w-4" />
                Places + Roles
              </button>
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br from-white/10 to-white/5",
              "border border-white/20"
            )}>
              <Icon className={cn("w-8 h-8", slide.iconColor)} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center animate-fade-in" key={`${selectedMode}-${currentSlide}`}>
            <h2 className="text-2xl font-bold mb-1">{slide.title}</h2>
            <p className={cn("text-sm mb-4", slide.iconColor)}>{slide.subtitle}</p>

            {/* Illustration */}
            {slide.illustration}

            <p className="text-muted-foreground text-sm leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={currentSlide === 0 && selectedMode === 'word'}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {INTRO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentSlide
                      ? selectedMode === 'places_roles' ? "bg-purple-500 w-6" : "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>

            {isLastSlide && selectedMode === 'places_roles' ? (
              <Button onClick={onClose} size="sm" className="gap-1">
                Let's Play!
                <Trophy className="h-4 w-4" />
              </Button>
            ) : isTransitionSlide ? (
              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1 bg-purple-500 hover:bg-purple-600"
              >
                Next Mode
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
