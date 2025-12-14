import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, AlertTriangle, Sparkles, MapPin, User } from 'lucide-react'
import { GameMode } from '@/types'

interface SecretWordCardProps {
  isWhite: boolean
  secretWord?: string
  // For places_roles mode
  gameMode?: GameMode
  place?: string
  playerRole?: string
}

export function SecretWordCard({ isWhite, secretWord, gameMode, place, playerRole }: SecretWordCardProps) {
  const isPlacesRolesMode = gameMode === 'places_roles'

  if (isWhite) {
    return (
      <Card className="relative overflow-hidden border-red-500/50 bg-gradient-to-br from-red-500/20 via-red-600/10 to-orange-500/20">
        {/* Animated glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shimmer" />

        <CardContent className="relative p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-red-500/20 border border-red-500/30">
              <EyeOff className="h-6 w-6 text-red-400" />
            </div>
          </div>

          <Badge variant="destructive" className="mb-4 px-4 py-1 text-sm">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Mr/Ms White
          </Badge>

          <div className="space-y-2">
            <p className="text-xl font-bold text-red-300">
              {isPlacesRolesMode
                ? "You don't know the location or your role!"
                : "You don't know the secret word!"}
            </p>
            <p className="text-red-400/80 text-sm">
              {isPlacesRolesMode
                ? "Listen to questions, blend in, and figure out where you are..."
                : "Listen carefully and blend in with the others..."}
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-4xl opacity-10">🎭</div>
        </CardContent>
      </Card>
    )
  }

  // Places + Roles mode: show place and role
  // Show this card if we're in places_roles mode (even if data hasn't arrived yet)
  if (isPlacesRolesMode) {
    // If data hasn't arrived yet, show loading state
    if (!place || !playerRole) {
      return (
        <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/30 animate-pulse">
                <MapPin className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">Places + Roles</Badge>
            <p className="text-muted-foreground text-sm">
              Receiving your location and role...
            </p>
          </CardContent>
        </Card>
      )
    }

    // Show place and role
    return (
      <Card className="relative overflow-hidden border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20">
        {/* Animated glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-shimmer" />

        <CardContent className="relative p-6 text-center">
          {/* Location Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">
                <MapPin className="h-3 w-3 mr-1" />
                Secret Location
              </Badge>
            </div>
            <div className="relative inline-block">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                {place}
              </div>
              <div className="absolute inset-0 text-2xl md:text-3xl font-bold text-purple-500 blur-lg opacity-30">
                {place}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Your Role</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          </div>

          {/* Role Section */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 px-3 py-1">
                <User className="h-3 w-3 mr-1" />
                Your Character
              </Badge>
            </div>
            <div className="relative inline-block">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
                {playerRole}
              </div>
              <div className="absolute inset-0 text-2xl md:text-3xl font-bold text-pink-500 blur-lg opacity-30">
                {playerRole}
              </div>
            </div>
          </div>

          <p className="text-purple-400/80 text-sm mt-4">
            Answer questions in character based on your role!
          </p>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-3xl opacity-10">🗺️</div>
          <div className="absolute bottom-4 left-4 text-2xl opacity-10">🎭</div>
        </CardContent>
      </Card>
    )
  }

  // Classic word mode - waiting state
  if (!secretWord && !place) {
    return (
      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-purple-500/10">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-full bg-primary/20 border border-primary/30 animate-pulse">
              <Eye className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Badge className="mb-4">Word Bearer</Badge>
          <p className="text-muted-foreground text-sm">
            Waiting for secret word...
          </p>
        </CardContent>
      </Card>
    )
  }

  // Classic word mode
  return (
    <Card className="relative overflow-hidden border-primary/50 bg-gradient-to-br from-primary/20 via-blue-500/10 to-purple-500/20">
      {/* Animated glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />

      <CardContent className="relative p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge className="px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Secret Word
          </Badge>
        </div>

        <div className="relative inline-block">
          <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-primary to-purple-400 bg-clip-text text-transparent mb-4 animate-gradient">
            {secretWord}
          </div>
          {/* Glow effect behind text */}
          <div className="absolute inset-0 text-4xl md:text-5xl font-bold text-primary blur-lg opacity-30">
            {secretWord}
          </div>
        </div>

        <p className="text-primary/80 text-sm">
          Give clues without saying this word!
        </p>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-4xl opacity-10">👁️</div>
        <div className="absolute bottom-4 left-4 text-3xl opacity-10">🔮</div>
      </CardContent>
    </Card>
  )
}