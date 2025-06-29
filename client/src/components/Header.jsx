import { useState, useContext } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Menu, 
  Bell, 
  Moon, 
  Sun,
  Zap,
  User,
  LogOut
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { ApiStatusContext } from '../contexts/ApiStatusContext'
import { useAuth } from '../contexts/AuthContext'
import ProfileModal from './ProfileModal'

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [notifications] = useState([
    { id: 1, message: '새로운 콘텐츠가 생성되었습니다', time: '5분 전' },
    { id: 2, message: 'WordPress 포스팅이 완료되었습니다', time: '1시간 전' }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const { apiConnected } = useContext(ApiStatusContext)

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
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
        {/* 알림 왼쪽에 작은 API 연결 점 하나만! */}
        <span
          className={`api-status-dot${apiConnected ? ' on' : ''}`}
          style={{
            width: 8,
            height: 8,
            marginRight: 6,
            position: 'static',
            display: 'inline-block',
            verticalAlign: 'middle'
          }}
        ></span>
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

        {/* 사용자 프로필 */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfile(!showProfile)}
            className="p-2 relative"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>

          {/* 프로필 드롭다운 */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user?.username || '사용자'}</div>
                    <div className="text-sm text-muted-foreground">{user?.email || 'user@example.com'}</div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowProfile(false)
                    setShowProfileModal(true)
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  프로필 설정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-full justify-start"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === 'dark' ? '라이트 모드' : '다크 모드'}
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
            </div>
          )}
        </div>
      </div>

      {/* 클릭 외부 영역 감지 */}
      {showProfile && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* 프로필 설정 모달 */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

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

