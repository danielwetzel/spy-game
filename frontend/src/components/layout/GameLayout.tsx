import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GameLayoutProps {
  children: ReactNode
  className?: string
  header?: ReactNode
  footer?: ReactNode
}

export function GameLayout({ children, className, header, footer }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {header && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            {header}
          </div>
        </header>
      )}
      
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      
      {footer && (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-6">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}