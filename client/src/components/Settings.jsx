import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bot, 
  Key, 
  User,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE_URL } from '../lib/api'

export default function Settings() {
  const { token, user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState({})
  
  // WordPress 사이트 설정
  const [wpSites, setWpSites] = useState([])
  const [newSite, setNewSite] = useState({
    name: '',
    url: '',
    username: '',
    password: ''
  })

  // LLM 제공자 설정
  const [llmProviders, setLlmProviders] = useState([])
  const [newProvider, setNewProvider] = useState({
    name: '',
    provider_type: 'ollama',
    api_key: '',
    base_url: 'http://localhost:11434/v1',
    model_name: 'qwen2.5:32b'
  })

  // 사용자 설정
  const [userSettings, setUserSettings] = useState({
    auto_post: false,
    default_status: 'draft',
    notification_email: true,
    seo_analysis: true
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // WordPress 사이트 목록 로드
      const wpResponse = await fetch(`${API_BASE_URL}/api/wordpress/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (wpResponse.ok) {
        const wpData = await wpResponse.json()
        setWpSites(wpData.sites)
      }

      // LLM 제공자 목록 로드
      const llmResponse = await fetch(`${API_BASE_URL}/api/llm/providers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (llmResponse.ok) {
        const llmData = await llmResponse.json()
        setLlmProviders(llmData.providers)
      }

    } catch (error) {
      console.error('설정 로드 실패:', error)
    }
  }

  const handleAddWpSite = async () => {
    if (!newSite.name || !newSite.url || !newSite.username || !newSite.password) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordpress/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSite)
      })

      const data = await response.json()

      if (response.ok) {
        setWpSites(prev => [...prev, data.site])
        setNewSite({ name: '', url: '', username: '', password: '' })
        alert('WordPress 사이트가 성공적으로 추가되었습니다.')
      } else {
        alert(`사이트 추가 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`사이트 추가 중 오류: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestWpConnection = async (siteId, siteData) => {
    setIsTesting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordpress/sites/${siteId}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(siteData)
      })

      const data = await response.json()
      setTestResults(prev => ({
        ...prev,
        [`wp_${siteId}`]: data
      }))

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [`wp_${siteId}`]: { success: false, message: error.message }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const handleAddLlmProvider = async () => {
    if (!newProvider.name || !newProvider.provider_type) {
      alert('이름과 제공자 타입을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProvider)
      })

      const data = await response.json()

      if (response.ok) {
        setLlmProviders(prev => [...prev, data.provider])
        setNewProvider({
          name: '',
          provider_type: 'ollama',
          api_key: '',
          base_url: 'http://localhost:11434/v1',
          model_name: 'qwen2.5:32b'
        })
        alert('LLM 제공자가 성공적으로 추가되었습니다.')
      } else {
        alert(`제공자 추가 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`제공자 추가 중 오류: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestLlmProvider = async (providerId, providerData) => {
    setIsTesting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers/${providerId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(providerData)
      })

      const data = await response.json()
      setTestResults(prev => ({
        ...prev,
        [`llm_${providerId}`]: data
      }))

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [`llm_${providerId}`]: { success: false, message: error.message }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const handleActivateLlmProvider = async (providerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers/${providerId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // 제공자 목록 새로고침
        loadSettings()
        alert('LLM 제공자가 활성화되었습니다.')
      }
    } catch (error) {
      alert(`제공자 활성화 중 오류: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">설정</h1>
        <p className="text-muted-foreground">
          WordPress Auto Poster의 설정을 관리하세요
        </p>
      </div>

      <Tabs defaultValue="wordpress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          <TabsTrigger value="llm">LLM 설정</TabsTrigger>
          <TabsTrigger value="user">사용자 설정</TabsTrigger>
          <TabsTrigger value="profile">프로필</TabsTrigger>
        </TabsList>

        {/* WordPress 설정 */}
        <TabsContent value="wordpress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>WordPress 사이트 관리</span>
              </CardTitle>
              <CardDescription>
                자동 포스팅할 WordPress 사이트를 추가하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 기존 사이트 목록 */}
              {wpSites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">등록된 사이트</h3>
                  {wpSites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{site.name}</h4>
                        <p className="text-sm text-muted-foreground">{site.url}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={site.is_active ? "default" : "secondary"}>
                            {site.is_active ? '활성' : '비활성'}
                          </Badge>
                          {testResults[`wp_${site.id}`] && (
                            <Badge variant={testResults[`wp_${site.id}`].success ? "default" : "destructive"}>
                              {testResults[`wp_${site.id}`].success ? '연결 성공' : '연결 실패'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTestWpConnection(site.id, {
                            url: site.url,
                            username: site.username,
                            password: '***' // 실제로는 저장된 비밀번호 사용
                          })}
                          disabled={isTesting}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 사이트 추가 */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">새 사이트 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">사이트 이름</Label>
                    <Input
                      id="site-name"
                      placeholder="내 블로그"
                      value={newSite.name}
                      onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-url">사이트 URL</Label>
                    <Input
                      id="site-url"
                      placeholder="https://myblog.com"
                      value={newSite.url}
                      onChange={(e) => setNewSite(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-username">사용자명</Label>
                    <Input
                      id="site-username"
                      placeholder="admin"
                      value={newSite.username}
                      onChange={(e) => setNewSite(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-password">비밀번호</Label>
                    <Input
                      id="site-password"
                      type="password"
                      placeholder="비밀번호"
                      value={newSite.password}
                      onChange={(e) => setNewSite(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddWpSite} disabled={isSaving}>
                  {isSaving ? (
                    <>저장 중...</>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      사이트 추가
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM 설정 */}
        <TabsContent value="llm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>LLM 제공자 관리</span>
              </CardTitle>
              <CardDescription>
                콘텐츠 생성에 사용할 LLM 제공자를 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 기존 제공자 목록 */}
              {llmProviders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">등록된 제공자</h3>
                  {llmProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{provider.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {provider.provider_type === 'openai' ? 'OpenAI' : 'Ollama'} - {provider.model_name}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={provider.is_active ? "default" : "secondary"}>
                            {provider.is_active ? '활성' : '비활성'}
                          </Badge>
                          <Badge variant={provider.status === 'connected' ? "default" : "destructive"}>
                            {provider.status === 'connected' ? '연결됨' : '연결 안됨'}
                          </Badge>
                          {testResults[`llm_${provider.id}`] && (
                            <Badge variant={testResults[`llm_${provider.id}`].success ? "default" : "destructive"}>
                              {testResults[`llm_${provider.id}`].success ? '테스트 성공' : '테스트 실패'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTestLlmProvider(provider.id, {
                            provider_type: provider.provider_type,
                            api_key: provider.api_key || 'ollama',
                            base_url: provider.base_url,
                            model_name: provider.model_name
                          })}
                          disabled={isTesting}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        {!provider.is_active && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleActivateLlmProvider(provider.id)}
                          >
                            활성화
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 제공자 추가 */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">새 제공자 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-name">제공자 이름</Label>
                    <Input
                      id="provider-name"
                      placeholder="내 Ollama 서버"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-type">제공자 타입</Label>
                    <Select 
                      value={newProvider.provider_type} 
                      onValueChange={(value) => setNewProvider(prev => ({ 
                        ...prev, 
                        provider_type: value,
                        base_url: value === 'ollama' ? 'http://localhost:11434/v1' : '',
                        model_name: value === 'ollama' ? 'qwen2.5:32b' : 'gpt-3.5-turbo'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ollama">Ollama</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newProvider.provider_type === 'openai' && (
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API 키</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="sk-..."
                        value={newProvider.api_key}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, api_key: e.target.value }))}
                      />
                    </div>
                  )}
                  {newProvider.provider_type === 'ollama' && (
                    <div className="space-y-2">
                      <Label htmlFor="base-url">베이스 URL</Label>
                      <Input
                        id="base-url"
                        placeholder="http://localhost:11434/v1"
                        value={newProvider.base_url}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, base_url: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="model-name">모델명</Label>
                    <Input
                      id="model-name"
                      placeholder={newProvider.provider_type === 'ollama' ? 'qwen2.5:32b' : 'gpt-3.5-turbo'}
                      value={newProvider.model_name}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, model_name: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddLlmProvider} disabled={isSaving}>
                  {isSaving ? (
                    <>저장 중...</>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      제공자 추가
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 설정 */}
        <TabsContent value="user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>일반 설정</span>
              </CardTitle>
              <CardDescription>
                자동 포스팅 및 알림 설정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 포스팅</Label>
                  <p className="text-sm text-muted-foreground">
                    생성된 콘텐츠를 자동으로 WordPress에 포스팅합니다
                  </p>
                </div>
                <Switch
                  checked={userSettings.auto_post}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, auto_post: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>기본 포스트 상태</Label>
                <Select 
                  value={userSettings.default_status} 
                  onValueChange={(value) => setUserSettings(prev => ({ ...prev, default_status: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">초안</SelectItem>
                    <SelectItem value="publish">즉시 발행</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    포스팅 완료 시 이메일로 알림을 받습니다
                  </p>
                </div>
                <Switch
                  checked={userSettings.notification_email}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, notification_email: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 SEO 분석</Label>
                  <p className="text-sm text-muted-foreground">
                    콘텐츠 생성 시 자동으로 SEO 분석을 수행합니다
                  </p>
                </div>
                <Switch
                  checked={userSettings.seo_analysis}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, seo_analysis: checked }))}
                />
              </div>

              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 프로필 설정 */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>프로필 정보</span>
              </CardTitle>
              <CardDescription>
                계정 정보를 확인하고 수정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">사용자명</Label>
                <Input
                  id="username"
                  value={user?.username || ''}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-password">현재 비밀번호</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                비밀번호 변경
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

