import { useState, useEffect, useContext } from 'react'
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
  Edit,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Tooltip } from './ui/tooltip'
import { useTheme } from '../contexts/ThemeContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from './ui/sheet'
import { ApiStatusContext } from '../contexts/ApiStatusContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Settings() {
  const { token, user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const [showPassword, setShowPassword] = useState({})
  
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
    provider_type: 'openai',
    api_key: '',
    base_url: '',
    model_name: 'gpt-3.5-turbo'
  })

  // 사용자 설정
  const [userSettings, setUserSettings] = useState({
    auto_post: false,
    default_status: 'draft',
    notification_email: true,
    seo_analysis: true
  })

  // API 연결 상태
  const { apiConnected, setApiConnected } = useContext(ApiStatusContext)
  const [apiTestLoading, setApiTestLoading] = useState(false)
  // 수정 모달 상태
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editProvider, setEditProvider] = useState(null)
  const [wpEditModalOpen, setWpEditModalOpen] = useState(false)
  const [editSite, setEditSite] = useState(null)

  const { theme } = useTheme()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadLlmProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setLlmProviders(data.providers || [])
      }
    } catch (error) {
      console.error('LLM 제공자 로드 실패:', error)
    }
  }

  const loadSettings = async () => {
    try {
      // WordPress 사이트 목록 로드
      const wpResponse = await fetch(`${API_BASE_URL}/api/wordpress/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (wpResponse.ok) {
        const wpData = await wpResponse.json()
        setWpSites(wpData.sites || [])
      }

      // LLM 제공자 목록 로드
      await loadLlmProviders()

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
      // 먼저 연결 테스트 수행
      const testResponse = await fetch(`${API_BASE_URL}/api/wordpress/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: newSite.url,
          username: newSite.username,
          password: newSite.password
        })
      })

      const testResult = await testResponse.json()
      
      if (!testResult.success) {
        alert(`연결 테스트 실패: ${testResult.message}`)
        return
      }

      // 연결 테스트 성공 시 사이트 추가
      const response = await fetch(`${API_BASE_URL}/api/wordpress/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSite)
      })

      const data = await response.json()

      if (response.ok) {
        await loadSettings() // 최신 데이터로 새로고침
        setNewSite({ name: '', url: '', username: '', password: '' })
        alert('WordPress 사이트가 성공적으로 추가되고 활성화되었습니다!')
      } else {
        alert(`사이트 추가 실패: ${data.detail || data.error}`)
      }
    } catch (error) {
      alert(`사이트 추가 중 오류: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }



  const handleAddLlmProvider = async () => {
    if (!newProvider.name || !newProvider.provider_type) {
      alert('이름과 제공자 타입을 입력해주세요.')
      return
    }

    if (newProvider.provider_type === 'openai' && !newProvider.api_key) {
      alert('OpenAI API 키를 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // 먼저 연결 테스트 수행
      const testResponse = await fetch(`${API_BASE_URL}/api/llm/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProvider.name,
          provider_type: newProvider.provider_type,
          api_key: newProvider.api_key,
          base_url: newProvider.base_url,
          model_name: newProvider.model_name
        })
      })

      const testResult = await testResponse.json()

      if (!testResult.success) {
        alert(`연결 테스트 실패: ${testResult.message}`)
        return
      }

      
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
        await loadLlmProviders() // 목록 새로고침
        setNewProvider({
          name: '',
          provider_type: 'openai',
          api_key: '',
          base_url: '',
          model_name: 'gpt-3.5-turbo'
        })
        alert('LLM 제공자가 성공적으로 추가되고 활성화되었습니다!')
      } else {
        alert(`제공자 추가 실패: ${data.detail || data.message}`)
      }
    } catch (error) {
      alert(`제공자 추가 중 오류: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }



  const handleDeleteLlmProvider = async (providerId) => {
    if (!confirm('정말로 이 LLM 제공자를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers/${providerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await loadLlmProviders()
        alert('LLM 제공자가 성공적으로 삭제되었습니다.')
      } else {
        const data = await response.json()
        alert(`삭제 실패: ${data.detail || data.message}`)
      }
    } catch (error) {
      alert(`삭제 중 오류: ${error.message}`)
    }
  }

  const handleEditLlmProvider = (provider) => {
    setEditProvider(provider)
    setEditModalOpen(true)
  }

  const handleEditWpSite = (site) => {
    setEditSite(site)
    setWpEditModalOpen(true)
  }

  const handleEditSiteSave = async (updatedSite) => {
    if (!updatedSite.name || !updatedSite.url || !updatedSite.username || !updatedSite.password) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // 먼저 연결 테스트 수행
      const testResponse = await fetch(`${API_BASE_URL}/api/wordpress/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: updatedSite.url,
          username: updatedSite.username,
          password: updatedSite.password
        })
      })

      const testResult = await testResponse.json()
      
      if (!testResult.success) {
        alert(`연결 테스트 실패: ${testResult.message}`)
        return
      }

      // 연결 테스트 성공 시 사이트 수정
      const response = await fetch(`${API_BASE_URL}/api/wordpress/sites/${updatedSite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: updatedSite.name,
          url: updatedSite.url,
          username: updatedSite.username,
          password: updatedSite.password
        })
      })

      if (response.ok) {
        setWpEditModalOpen(false)
        setEditSite(null)
        await loadSettings()
        alert('사이트 정보가 성공적으로 수정되었습니다!')
      } else {
        const errorData = await response.json()
        alert(`오류: ${errorData.detail || '사이트 수정에 실패했습니다.'}`)
      }
    } catch (error) {
      console.error('사이트 수정 오류:', error)
      alert('사이트 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWpSite = async (siteId) => {
    if (!confirm('정말로 이 사이트를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/wordpress/sites/${siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadSettings()
        alert('사이트가 삭제되었습니다.')
      } else {
        alert('사이트 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('사이트 삭제 오류:', error)
      alert('사이트 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleWpSiteActive = async (siteId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordpress/sites/${siteId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadSettings()
      } else {
        alert('사이트 활성화 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('사이트 활성화 변경 오류:', error)
      alert('사이트 활성화 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleToggleLlmProviderActive = async (providerId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers/${providerId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadLlmProviders()
      } else {
        alert('LLM 제공자 활성화 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('LLM 제공자 활성화 변경 오류:', error)
      alert('LLM 제공자 활성화 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // LLM 연결 상태 테스트 (가장 최근 활성화된 provider 기준)
  const testApiConnection = async () => {
    setApiTestLoading(true)
    try {
      // 활성화된 provider 찾기
      const active = llmProviders.find(p => p.is_active)
      if (!active) {
        setApiConnected(false)
        setApiTestLoading(false)
        return
      }
      const response = await fetch(`${API_BASE_URL}/api/llm/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: active.name,
          provider_type: active.provider_type,
          api_key: active.api_key,
          base_url: active.base_url,
          model_name: active.model_name
        })
      })
      const data = await response.json()
      setApiConnected(!!data.success)
    } catch (e) {
      setApiConnected(false)
    } finally {
      setApiTestLoading(false)
    }
  }

  useEffect(() => {
    if (llmProviders.length > 0) testApiConnection()
  }, [llmProviders])

  // 수정 모달 저장
  const handleEditProviderSave = async (updated) => {
    if (!updated.name || !updated.provider_type) {
      alert('이름과 제공자 타입을 입력해주세요.')
      return
    }

    if (updated.provider_type === 'openai' && !updated.api_key) {
      alert('OpenAI API 키를 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // 먼저 연결 테스트 수행
      const testResponse = await fetch(`${API_BASE_URL}/api/llm/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: updated.name,
          provider_type: updated.provider_type,
          api_key: updated.api_key,
          base_url: updated.base_url,
          model_name: updated.model_name
        })
      })

      const testResult = await testResponse.json()

      if (!testResult.success) {
        alert(`연결 테스트 실패: ${testResult.message}`)
        return
      }

      // 연결 테스트 성공 시 제공자 수정
      const response = await fetch(`${API_BASE_URL}/api/llm/providers/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (response.ok) {
        await loadLlmProviders()
        setEditModalOpen(false)
        setEditProvider(null)
        alert('LLM 제공자 정보가 성공적으로 수정되었습니다!')
      } else {
        const data = await response.json()
        alert(`수정 실패: ${data.detail || data.message}`)
      }
    } catch (e) {
      alert('수정 중 오류: ' + e.message)
    } finally {
      setIsSaving(false)
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
                <span>새 WordPress 사이트 추가</span>
              </CardTitle>
              <CardDescription>
                자동 포스팅할 WordPress 사이트를 추가하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">사이트 이름 *</Label>
                  <Input
                    id="site-name"
                    placeholder="내 블로그"
                    value={newSite.name}
                    onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url">사이트 URL *</Label>
                  <Input
                    id="site-url"
                    placeholder="https://myblog.com"
                    value={newSite.url}
                    onChange={(e) => setNewSite(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-username">사용자명 *</Label>
                  <Input
                    id="site-username"
                    placeholder="WordPress 관리자 사용자명"
                    value={newSite.username}
                    onChange={(e) => setNewSite(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-password">비밀번호 *</Label>
                  <div className="relative">
                    <Input
                      id="site-password"
                      type={showPassword.newSite ? "text" : "password"}
                      placeholder="WordPress 관리자 비밀번호"
                      value={newSite.password}
                      onChange={(e) => setNewSite(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('newSite')}
                    >
                      {showPassword.newSite ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              


              <Button onClick={handleAddWpSite} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>저장 중...</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    사이트 추가
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 등록된 사이트 목록 */}
          {wpSites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>등록된 사이트</CardTitle>
                <CardDescription>
                  현재 등록된 WordPress 사이트 목록입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wpSites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{site.name}</h4>
                        <p className="text-sm text-muted-foreground">{site.url}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={site.is_active ? "default" : "secondary"}>
                            {site.is_active ? '활성화됨' : '비활성'}
                          </Badge>
                          <Badge variant="default" className="bg-green-500">
                            연결됨
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant={site.is_active ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleWpSiteActive(site.id, site.is_active)}
                        >
                          {site.is_active ? '활성화됨' : '활성화'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditWpSite(site)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteWpSite(site.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* LLM 설정 */}
        <TabsContent value="llm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>새 LLM 설정 추가</span>
              </CardTitle>
              <CardDescription>
                AI 콘텐츠 생성을 위한 LLM 설정을 추가하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="provider-name">제공자 이름 *</Label>
                  <Input
                    id="provider-name"
                    placeholder="예: 내 OpenAI 계정"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-type">제공자 *</Label>
                  <Select 
                    value={newProvider.provider_type} 
                    onValueChange={(value) => setNewProvider(prev => ({ 
                      ...prev, 
                      provider_type: value,
                      model_name: value === 'openai' ? 'gpt-3.5-turbo' : 'llama3.1:latest',
                      base_url: value === 'openai' ? '' : 'http://localhost:11434/api/generate',
                      api_key: value === 'ollama' ? '' : prev.api_key
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="제공자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-model">모델명 *</Label>
                  <Select 
                    value={newProvider.model_name} 
                    onValueChange={(value) => setNewProvider(prev => ({ ...prev, model_name: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {newProvider.provider_type === 'openai' ? (
                        <>
                          <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                          <SelectItem value="gpt-4">gpt-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="llama3.1:latest">llama3.1:latest</SelectItem>
                          <SelectItem value="qwen3:30b">qwen3:30b</SelectItem>
                          <SelectItem value="hermes3:8b">hermes3:8b</SelectItem>
                          <SelectItem value="qwen2.5vl:7b">qwen2.5vl:7b</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {newProvider.provider_type === 'openai' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="api-key">API 키 *</Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showPassword.newProvider ? "text" : "password"}
                        placeholder="sk-..."
                        value={newProvider.api_key}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, api_key: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('newProvider')}
                      >
                        {showPassword.newProvider ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {newProvider.provider_type === 'ollama' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="base-url">Ollama API 주소</Label>
                    <Input
                      id="base-url"
                      placeholder="http://localhost:11434/api/generate"
                      value={newProvider.base_url}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, base_url: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              
              <Button onClick={handleAddLlmProvider} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>저장 중...</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    LLM 설정 추가
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 등록된 LLM 제공자 목록 */}
          {llmProviders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>등록된 LLM 설정</CardTitle>
                <CardDescription>
                  현재 등록된 LLM 제공자 목록입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {llmProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{provider.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {provider.provider_type === 'openai' ? 'OpenAI' : 'Ollama'} - {provider.model_name}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={provider.is_active ? "default" : "secondary"}>
                            {provider.is_active ? '활성화됨' : '비활성'}
                          </Badge>
                          <Badge variant="default" className="bg-green-500">
                            연결됨
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant={provider.is_active ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleLlmProviderActive(provider.id, provider.is_active)}
                        >
                          {provider.is_active ? '활성화됨' : '활성화'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditLlmProvider(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteLlmProvider(provider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 사용자 설정 */}
        <TabsContent value="user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>사용자 설정</span>
              </CardTitle>
              <CardDescription>
                개인화된 설정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>자동 포스팅</Label>
                    <p className="text-sm text-muted-foreground">
                      콘텐츠 생성 후 자동으로 WordPress에 포스팅
                    </p>
                  </div>
                  <Switch
                    checked={userSettings.auto_post}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({ ...prev, auto_post: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>기본 포스트 상태</Label>
                  <Select 
                    value={userSettings.default_status} 
                    onValueChange={(value) => 
                      setUserSettings(prev => ({ ...prev, default_status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">초안</SelectItem>
                      <SelectItem value="publish">발행</SelectItem>
                      <SelectItem value="private">비공개</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      포스팅 완료 시 이메일 알림 받기
                    </p>
                  </div>
                  <Switch
                    checked={userSettings.notification_email}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({ ...prev, notification_email: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SEO 분석</Label>
                    <p className="text-sm text-muted-foreground">
                      콘텐츠 생성 시 자동 SEO 분석 수행
                    </p>
                  </div>
                  <Switch
                    checked={userSettings.seo_analysis}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({ ...prev, seo_analysis: checked }))
                    }
                  />
                </div>
              </div>

              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 프로필 */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>프로필 정보</span>
              </CardTitle>
              <CardDescription>
                계정 정보를 관리하세요
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
                <Label htmlFor="created-at">가입일</Label>
                <Input
                  id="created-at"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                  disabled
                />
              </div>
              
              <Button variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                프로필 수정
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WordPress 사이트 수정 모달 */}
      {wpEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`bg-background rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-border relative animate-fadeIn ${theme === 'dark' ? 'dark' : 'light'}`}
            onClick={e => e.stopPropagation()}
            style={{ minWidth: 360 }}
          >
            <button
              onClick={() => setWpEditModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-2xl font-bold focus:outline-none"
              aria-label="닫기"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">WordPress 사이트 정보 수정</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="edit-site-name">사이트 이름</label>
                <Input
                  id="edit-site-name"
                  value={editSite?.name || ''}
                  onChange={e => setEditSite(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="edit-site-url">사이트 URL</label>
                <Input
                  id="edit-site-url"
                  value={editSite?.url || ''}
                  onChange={e => setEditSite(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full"
                  placeholder="https://myblog.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="edit-site-username">사용자명</label>
                <Input
                  id="edit-site-username"
                  value={editSite?.username || ''}
                  onChange={e => setEditSite(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="edit-site-password">비밀번호</label>
                <Input
                  id="edit-site-password"
                  type="password"
                  value={editSite?.password || ''}
                  onChange={e => setEditSite(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full"
                  placeholder="애플리케이션 패스워드"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={() => handleEditSiteSave(editSite)}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg text-base font-semibold shadow-sm"
              >
                {isSaving ? '저장 중...' : '저장'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setWpEditModalOpen(false)}
                className="px-6 py-2 rounded-lg text-base font-semibold"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LLM 정보 수정 모달 (중앙, 심플&고급스럽게) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`bg-background rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-border relative animate-fadeIn ${theme === 'dark' ? 'dark' : 'light'}`}
            onClick={e => e.stopPropagation()}
            style={{ minWidth: 360 }}
          >
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-2xl font-bold focus:outline-none"
              aria-label="닫기"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">LLM 제공자 정보 수정</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="edit-provider-name">제공자 이름</label>
                <Input
                  id="edit-provider-name"
                  value={editProvider?.name || ''}
                  onChange={e => setEditProvider(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  autoFocus
                />
              </div>
              {editProvider?.provider_type === 'openai' && (
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="edit-provider-api-key">API Key</label>
                  <Input
                    id="edit-provider-api-key"
                    type="password"
                    value={editProvider?.api_key || ''}
                    onChange={e => setEditProvider(prev => ({ ...prev, api_key: e.target.value }))}
                    className="w-full"
                  />
                </div>
              )}
              {editProvider?.provider_type === 'ollama' && (
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="edit-provider-base-url">Ollama API 주소</label>
                  <Input
                    id="edit-provider-base-url"
                    value={editProvider?.base_url || ''}
                    onChange={e => setEditProvider(prev => ({ ...prev, base_url: e.target.value }))}
                    className="w-full"
                    placeholder="http://localhost:11434/api/generate"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="edit-provider-model">모델명</label>
                <Select
                  value={editProvider?.model_name || ''}
                  onValueChange={(value) => setEditProvider(prev => ({ ...prev, model_name: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {editProvider?.provider_type === 'openai' ? (
                      <>
                        <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                        <SelectItem value="gpt-4">gpt-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="llama3.1:latest">llama3.1:latest</SelectItem>
                        <SelectItem value="qwen3:30b">qwen3:30b</SelectItem>
                        <SelectItem value="hermes3:8b">hermes3:8b</SelectItem>
                        <SelectItem value="qwen2.5vl:7b">qwen2.5vl:7b</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={() => handleEditProviderSave(editProvider)}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg text-base font-semibold shadow-sm"
              >
                {isSaving ? '저장 중...' : '저장'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-2 rounded-lg text-base font-semibold"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

