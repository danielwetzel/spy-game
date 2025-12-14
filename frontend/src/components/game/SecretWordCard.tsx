import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, AlertTriangle, Sparkles } from 'lucide-react'

interface SecretWordCardProps {
  isWhite: boolean
  secretWord?: string
}

export function SecretWordCard({ isWhite, secretWord }: SecretWordCardProps) {
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
              You don't know the secret word!
            </p>
            <p className="text-red-400/80 text-sm">
              Listen carefully and blend in with the others...
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-4xl opacity-10">🎭</div>
        </CardContent>
      </Card>
    )
  }

  if (!secretWord) {
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