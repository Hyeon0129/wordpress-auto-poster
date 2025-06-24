import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Menu, 
  Bell, 
  Moon, 
  Sun,
  Zap
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const [notifications] = useState([
    { id: 1, message: '새로운 콘텐츠가 생성되었습니다', time: '5분 전' },
    { id: 2, message: 'WordPress 포스팅이 완료되었습니다', time: '1시간 전' }
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  // API 연결 상태 (데모용)
  const [apiStatus] = useState({
    wordpress: true,
    openai: true,
    connected: true
  })

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* 왼쪽: 메뉴 버튼 (모바일) */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div className="flex items-center space-x-3">
        {/* API 상태 표시 */}
        {apiStatus.connected && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium hidden sm:inline">API 연결됨</span>
            </div>
          </div>
        )}

        {/* 알림 */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 relative"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notifications.length}
              </Badge>
            )}
          </Button>

          {/* 알림 드롭다운 */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">알림</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-border last:border-b-0 hover:bg-muted">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    새로운 알림이 없습니다
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full">
                    모든 알림 확인
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 클릭 외부 영역 감지 */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  )
}

