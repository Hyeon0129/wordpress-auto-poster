import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  X, 
  User, 
  Mail, 
  Globe, 
  Moon, 
  Sun, 
  Bell,
  Shield,
  Palette,
  Languages
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    language: 'ko',
    timezone: 'Asia/Seoul',
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      profilePublic: false,
      showEmail: false
    }
  })

  const handleSave = async () => {
    try {
      await updateProfile(formData)
      onClose()
    } catch (error) {
      console.error('프로필 업데이트 실패:', error)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: '일반', icon: User },
    { id: 'appearance', label: '테마', icon: Palette },
    { id: 'notifications', label: '알림', icon: Bell },
    { id: 'privacy', label: '개인 및 보안', icon: Shield },
    { id: 'language', label: '언어', icon: Languages }
  ]

  return createPortal(
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-60 p-4">
      <div className="bg-white dark:bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border">
        <div className="flex h-full">
          {/* 사이드바 */}
          <div className="w-64 bg-muted/30 border-r border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">설정</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">일반 설정</h3>
                  <p className="text-muted-foreground mb-6">계정 정보를 관리하세요</p>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.avatar} />
                    <AvatarFallback className="text-lg">
                      {formData.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      프로필 사진 변경
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG 파일만 업로드 가능합니다
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">사용자명</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">테마 설정</h3>
                  <p className="text-muted-foreground mb-6">애플리케이션의 외관을 설정하세요</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                      <span>다크 모드</span>
                    </CardTitle>
                    <CardDescription>
                      어두운 테마를 사용하여 눈의 피로를 줄이세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                      />
                      <Label>다크 모드 사용</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>라이트 모드</CardTitle>
                    <CardDescription>
                      밝은 테마로 깔끔한 인터페이스를 경험하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={theme === 'light'}
                        onCheckedChange={toggleTheme}
                      />
                      <Label>라이트 모드 사용</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">언어 설정</h3>
                  <p className="text-muted-foreground mb-6">사용할 언어를 선택하세요</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Languages className="h-5 w-5" />
                      <span>언어</span>
                    </CardTitle>
                    <CardDescription>
                      인터페이스에서 사용할 언어를 선택하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>시간대</span>
                    </CardTitle>
                    <CardDescription>
                      콘텐츠 스케줄링에 사용할 시간대를 설정하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData({...formData, timezone: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">서울 (GMT+9)</SelectItem>
                        <SelectItem value="America/New_York">뉴욕 (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">런던 (GMT+0)</SelectItem>
                        <SelectItem value="Asia/Tokyo">도쿄 (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">알림 설정</h3>
                  <p className="text-muted-foreground mb-6">받고 싶은 알림을 설정하세요</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>이메일 알림</CardTitle>
                    <CardDescription>
                      중요한 업데이트를 이메일로 받아보세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>포스팅 완료 알림</Label>
                        <p className="text-sm text-muted-foreground">WordPress 포스팅이 완료되면 알림을 받습니다</p>
                      </div>
                      <Switch
                        checked={formData.notifications.email}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData, 
                            notifications: {...formData.notifications, email: checked}
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>마케팅 이메일</Label>
                        <p className="text-sm text-muted-foreground">새로운 기능과 팁에 대한 이메일을 받습니다</p>
                      </div>
                      <Switch
                        checked={formData.notifications.marketing}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData, 
                            notifications: {...formData.notifications, marketing: checked}
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">개인정보 및 보안</h3>
                  <p className="text-muted-foreground mb-6">계정 보안과 개인정보를 관리하세요</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>계정 보안</CardTitle>
                    <CardDescription>
                      계정을 안전하게 보호하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                      비밀번호 변경
                    </Button>
                    <Button variant="outline" className="w-full">
                      2단계 인증 설정
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>개인정보 설정</CardTitle>
                    <CardDescription>
                      다른 사용자에게 공개할 정보를 선택하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>프로필 공개</Label>
                        <p className="text-sm text-muted-foreground">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                      </div>
                      <Switch
                        checked={formData.privacy.profilePublic}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData, 
                            privacy: {...formData.privacy, profilePublic: checked}
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 저장 버튼 */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleSave}>
                저장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  , document.body)
}

