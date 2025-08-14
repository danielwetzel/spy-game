import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff } from 'lucide-react'

interface SecretWordCardProps {
  isWhite: boolean
  secretWord?: string
}

export function SecretWordCard({ isWhite, secretWord }: SecretWordCardProps) {
  if (isWhite) {
    return (
      <Card className="border-red-500/50 bg-red-500/10">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <EyeOff className="h-5 w-5 text-red-400" />
            <Badge variant="destructive">Mr/Ms White</Badge>
          </div>
          <p className="text-red-300 text-sm">
            You don't know the secret word!
          </p>
          <p className="text-red-400 text-xs mt-1">
            Listen carefully to find clues...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!secretWord) {
    return (
      <Card className="border-primary/50 bg-primary/10">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-primary" />
            <Badge>Word Bearer</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Waiting for secret word...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/50 bg-primary/10">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Eye className="h-5 w-5 text-primary" />
          <Badge>Secret Word</Badge>
        </div>
        <div className="text-3xl font-bold text-primary mb-2">
          {secretWord}
        </div>
        <p className="text-primary/80 text-sm">
          Give clues without saying this word!
        </p>
      </CardContent>
    </Card>
  )
}