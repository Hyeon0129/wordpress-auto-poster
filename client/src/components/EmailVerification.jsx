import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Mail, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Timer,
  RefreshCw
} from 'lucide-react'

const EmailVerification = ({ email, onVerificationComplete, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [timeLeft, setTimeLeft] = useState(60) // 60초 타임아웃
  const [canResend, setCanResend] = useState(false)

  // 타이머 효과
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleVerification = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ type: '', message: '' })

    if (!verificationCode || verificationCode.length !== 6) {
      setAlert({ type: 'error', message: '6자리 인증번호를 입력해주세요.' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          verification_code: verificationCode
        })
      })

      const result = await response.json()

      if (result.success) {
        setAlert({ type: 'success', message: '이메일 인증이 완료되었습니다!' })
        setTimeout(() => {
          onVerificationComplete(result)
        }, 1500)
      } else {
        setAlert({ type: 'error', message: result.message || '인증에 실패했습니다.' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: '인증 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setAlert({ type: '', message: '' })

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      })

      const result = await response.json()

      if (result.success) {
        setAlert({ type: 'success', message: '인증번호가 재발송되었습니다.' })
        setTimeLeft(60)
        setCanResend(false)
        setVerificationCode('')
      } else {
        setAlert({ type: 'error', message: result.message || '재발송에 실패했습니다.' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: '재발송 중 오류가 발생했습니다.' })
    } finally {
      setResendLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">이메일 인증</CardTitle>
            <CardDescription>
              <strong>{email}</strong>로 발송된 <br />
              6자리 인증번호를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alert.message && (
              <Alert className={`${
                alert.type === 'error' ? 'border-red-500' : 
                alert.type === 'success' ? 'border-green-500' : 
                'border-blue-500'
              }`}>
                {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : 
                 <CheckCircle className="h-4 w-4" />}
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">인증번호</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="6자리 숫자 입력"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setVerificationCode(value)
                  }}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>남은 시간: {formatTime(timeLeft)}</span>
                </div>
                
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={!canResend || resendLoading}
                  className="p-0 h-auto"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      재발송 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      재발송
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      인증 중...
                    </>
                  ) : (
                    '인증 완료'
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={onCancel}
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                이메일을 받지 못하셨나요? <br />
                스팸 폴더를 확인하거나 위의 재발송 버튼을 클릭하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EmailVerification

