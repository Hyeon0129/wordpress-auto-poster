import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Zap, 
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EmailVerification from './EmailVerification'

const Login = () => {
  const { login, register } = useAuth()
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [alert, setAlert] = useState({ type: '', message: '' })

  // 로그인 폼 상태
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    twoFactorCode: ''
  })

  // 회원가입 폼 상태
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ type: '', message: '' })

    try {
      const result = await login(
        loginForm.username, 
        loginForm.password, 
        loginForm.twoFactorCode || null
      )

      if (result.success) {
        setAlert({ type: 'success', message: '로그인 성공!' })
      } else if (result.requires2FA) {
        setRequires2FA(true)
        setAlert({ type: 'info', message: result.message })
      } else {
        setAlert({ type: 'error', message: result.message })
      }
    } catch (error) {
      setAlert({ type: 'error', message: '로그인 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ type: '', message: '' })

    // 비밀번호 확인
    if (registerForm.password !== registerForm.confirmPassword) {
      setAlert({ type: 'error', message: '비밀번호가 일치하지 않습니다.' })
      setLoading(false)
      return
    }

    try {
      const result = await register(
        registerForm.username,
        registerForm.email,
        registerForm.password,
        registerForm.fullName
      )

      if (result.success) {
        // 이메일 인증이 필요한 경우
        if (result.data && result.data.email_verification_sent) {
          setPendingEmail(registerForm.email)
          setShowEmailVerification(true)
          setAlert({ type: 'success', message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.' })
        } else {
          setAlert({ type: 'success', message: result.message })
        }
      } else {
        setAlert({ type: 'error', message: result.message })
      }
    } catch (error) {
      setAlert({ type: 'error', message: '회원가입 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailVerificationComplete = (result) => {
    setShowEmailVerification(false)
    setPendingEmail('')
    setAlert({ type: 'success', message: '이메일 인증이 완료되었습니다. 로그인해주세요.' })
    setActiveTab('login')
  }

  const handleEmailVerificationCancel = () => {
    setShowEmailVerification(false)
    setPendingEmail('')
    setAlert({ type: 'info', message: '이메일 인증이 취소되었습니다. 나중에 설정에서 인증할 수 있습니다.' })
  }

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'AI 기반 콘텐츠 생성',
      description: '고품질의 SEO 최적화된 콘텐츠를 자동으로 생성'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: '키워드 분석',
      description: '경쟁 강도 분석과 함께 최적의 키워드 추천'
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: '자동 포스팅',
      description: '워드프레스 사이트에 자동으로 포스트 발행'
    }
  ]

  // 이메일 인증 화면 표시
  if (showEmailVerification) {
    return (
      <EmailVerification
        email={pendingEmail}
        onVerificationComplete={handleEmailVerificationComplete}
        onCancel={handleEmailVerificationCancel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* 왼쪽: 브랜딩 및 기능 소개 */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">WordPress Auto Poster</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              AI 기반 워드프레스 자동화 플랫폼으로 <br />
              고품질 콘텐츠를 자동으로 생성하고 수익화하세요
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {feature.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <Badge variant="secondary">SEO 최적화</Badge>
            <Badge variant="secondary">키워드 분석</Badge>
            <Badge variant="secondary">자동 포스팅</Badge>
            <Badge variant="secondary">API 연동</Badge>
          </div>
        </div>

        {/* 오른쪽: 로그인/회원가입 폼 */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">시작하기</CardTitle>
              <CardDescription>
                계정에 로그인하거나 새 계정을 만드세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alert.message && (
                <Alert className={`mb-4 ${
                  alert.type === 'error' ? 'border-red-500' : 
                  alert.type === 'success' ? 'border-green-500' : 
                  'border-blue-500'
                }`}>
                  {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : 
                   <CheckCircle className="h-4 w-4" />}
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">로그인</TabsTrigger>
                  <TabsTrigger value="register">회원가입</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">사용자명 또는 이메일</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="사용자명 또는 이메일을 입력하세요"
                          value={loginForm.username}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="비밀번호를 입력하세요"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {requires2FA && (
                      <div className="space-y-2">
                        <Label htmlFor="twoFactorCode">2단계 인증 코드</Label>
                        <Input
                          id="twoFactorCode"
                          type="text"
                          placeholder="6자리 인증 코드를 입력하세요"
                          value={loginForm.twoFactorCode}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                          maxLength={6}
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          로그인 중...
                        </>
                      ) : (
                        '로그인'
                      )}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Button variant="link" size="sm">
                      비밀번호를 잊으셨나요?
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">이름 (선택사항)</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="이름을 입력하세요"
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registerUsername">사용자명</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="registerUsername"
                          type="text"
                          placeholder="사용자명을 입력하세요"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="이메일을 입력하세요"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">비밀번호</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="registerPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="비밀번호를 입력하세요"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          회원가입 중...
                        </>
                      ) : (
                        '회원가입'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              계속 진행하면{' '}
              <Button variant="link" className="p-0 h-auto text-sm">
                서비스 약관
              </Button>
              {' '}및{' '}
              <Button variant="link" className="p-0 h-auto text-sm">
                개인정보 처리방침
              </Button>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

