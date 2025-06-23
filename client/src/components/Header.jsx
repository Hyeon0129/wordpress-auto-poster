import { Menu } from 'lucide-react'
import { Button } from './ui/button'

export default function Header({ onMenuClick }) {

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            WordPress Auto Poster
          </h1>
          <p className="text-sm text-muted-foreground">
            AI 기반 블로그 자동 포스팅 시스템
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* API status indicator */}
        <span className="h-3 w-3 rounded-full bg-green-400 opacity-75 animate-pulse"></span>
      </div>
    </header>
  )
}

