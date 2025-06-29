import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  LayoutDashboard, 
  PenTool, 
  Search, 
  BarChart3, 
  History, 
  Settings, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ApiStatusContext } from '../contexts/ApiStatusContext'

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
  const { apiConnected } = useContext(ApiStatusContext)

  // 이번 달 사용량 (데모용)
  const monthlyUsage = {
    posts: 15,
    limit: 100,
    percentage: 15
  }

  return (
    <>
      {/* 사이드바 */}
      <div className={`fixed left-0 top-0 h-full bg-background transition-[width] duration-300 ease-in-out z-20 ${
        isOpen ? 'w-64' : 'w-16'
      }`}>
        {/* 세로 구분선: 헤더 끝까지 표시 */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-border" />
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4">
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



          {/* 메뉴 항목 */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2 border-0">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <li key={item.path} className="border-0">
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors border-0 ${
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
            <div className="p-4">
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

