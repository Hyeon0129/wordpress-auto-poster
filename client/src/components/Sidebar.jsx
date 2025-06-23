import { useState } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  TrendingUp, 
  Settings, 
  History,
  ChevronLeft,
  ChevronRight,
  Bot
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '콘텐츠 생성', href: '/content', icon: FileText },
  { name: 'SEO 최적화', href: '/seo', icon: TrendingUp },
  { name: '키워드 분석', href: '/keywords', icon: Search },
  { name: '포스팅 기록', href: '/history', icon: History },
  { name: '설정', href: '/settings', icon: Settings },
]

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation()

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isOpen ? "w-64" : "w-16"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center space-x-2 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}>
          <Bot className="h-8 w-8 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">
            WP Auto Poster
          </span>
        </div>
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-3">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isOpen ? "mr-3" : "mx-auto"
                  )} />
                  <span className={cn(
                    "transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 w-0"
                  )}>
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-3 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            {useAuth().user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          {isOpen && (
            <span className="text-sm text-sidebar-foreground">
              {useAuth().user?.username}
            </span>
          )}
        </div>
        <div className={cn(
          "p-3 bg-sidebar-accent rounded-lg transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}>
          <div className="text-xs text-sidebar-accent-foreground">
            <p className="font-medium">WordPress Auto Poster</p>
            <p className="text-sidebar-muted-foreground">v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

