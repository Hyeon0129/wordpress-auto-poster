import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  LayoutDashboard, 
  PenTool, 
  Search, 
  BarChart3, 
  History, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  User,
  Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const menuItems = [
  {
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    title: '콘텐츠 생성',
    icon: PenTool,
    path: '/content'
  },
  {
    title: '키워드 분석',
    icon: Search,
    path: '/keywords'
  },
  {
    title: 'SEO 최적화',
    icon: BarChart3,
    path: '/seo'
  },
  {
    title: '포스트 기록',
    icon: History,
    path: '/history'
  },
  {
    title: '설정',
    icon: Settings,
    path: '/settings'
  }
]

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showProfile, setShowProfile] = useState(false)

  // API 연결 상태 (데모용)
  const [apiStatus, setApiStatus] = useState({
    wordpress: true,
    openai: true,
    connected: true
  })

  // 이번 달 사용량 (데모용)
  const monthlyUsage = {
    posts: 15,
    limit: 100,
    percentage: 15
  }

  return (
    <>
      {/* 사이드바 */}
      <div className={`fixed left-0 top-0 h-full bg-background border-r border-border transition-all duration-300 z-50 ${
        isOpen ? 'w-64' : 'w-16'
      }`}>
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {isOpen && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <PenTool className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">WP Auto</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-2"
              >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* API 상태 표시 */}
          {isOpen && apiStatus.connected && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">API 연결됨</span>
                </div>
              </div>
            </div>
          )}

          {/* 메뉴 항목 */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isOpen && <span>{item.title}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* 이번 달 사용량 */}
          {isOpen && (
            <div className="p-4 border-t border-border">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">이번 달 사용량</span>
                  <Badge variant="secondary" className="text-xs">
                    {monthlyUsage.posts}/{monthlyUsage.limit}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${monthlyUsage.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {monthlyUsage.limit - monthlyUsage.posts}개 포스트 남음
                </p>
              </div>
            </div>
          )}

          {/* 하단 영역 */}
          <div className="p-4 border-t border-border space-y-3">
            {/* 다크모드 토글 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`w-full ${isOpen ? 'justify-start' : 'justify-center'}`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isOpen && <span className="ml-2">다크모드</span>}
            </Button>

            {/* 사용자 프로필 */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(!showProfile)}
                className={`w-full ${isOpen ? 'justify-start' : 'justify-center'} p-2`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOpen && (
                  <div className="ml-2 text-left flex-1">
                    <div className="text-sm font-medium">{user?.username || '사용자'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</div>
                  </div>
                )}
              </Button>

              {/* 프로필 드롭다운 */}
              {showProfile && isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-lg shadow-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowProfile(false)
                      // 프로필 페이지로 이동 또는 모달 열기
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    프로필 설정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setShowProfile(false)
                      logout()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  )
}

