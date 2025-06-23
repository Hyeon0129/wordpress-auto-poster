import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { 
  PenTool, 
  Wand2, 
  FileText, 
  Target, 
  Users, 
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Send,
  Sparkles,
  Eye,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const GENERATION_STEPS = [
  { id: 1, name: '키워드 분석', description: 'SEO 키워드 분석 중...', icon: Target },
  { id: 2, name: 'AI 설정', description: 'AI 모델 설정 중...', icon: Settings },
  { id: 3, name: '콘텐츠 생성', description: 'AI가 콘텐츠를 생성 중...', icon: PenTool },
  { id: 4, name: 'SEO 최적화', description: 'SEO 최적화 적용 중...', icon: BarChart3 },
  { id: 5, name: '완료 처리', description: '최종 검토 및 완료...', icon: CheckCircle }
]

export default function ContentGenerator() {
  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [error, setError] = useState('')
  const [wpSites, setWpSites] = useState([])
  
  // 폼 상태
  const [formData, setFormData] = useState({
    keyword: '',
    content_type: 'blog_post',
    tone: 'professional',
    target_audience: 'general',
    word_count: 800,
    include_images: true,
    auto_post: false,
    selected_site: '',
    post_status: 'draft'
  })

  useEffect(() => {
    loadWordPressSites()
  }, [])

  const loadWordPressSites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordpress/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setWpSites(data.sites || [])
      }
    } catch (error) {
      console.error('WordPress 사이트 로드 실패:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const simulateProgress = async () => {
    for (let step = 1; step <= GENERATION_STEPS.length; step++) {
      setCurrentStep(step)
      
      // 각 단계별 진행률 시뮬레이션
      const stepProgress = ((step - 1) / GENERATION_STEPS.length) * 100
      const stepDuration = step === 3 ? 3000 : 1500 // 콘텐츠 생성 단계는 더 오래
      
      for (let i = 0; i <= 100; i += 10) {
        const totalProgress = stepProgress + (i / GENERATION_STEPS.length)
        setProgress(Math.min(totalProgress, 100))
        await new Promise(resolve => setTimeout(resolve, stepDuration / 10))
      }
    }
  }

  const handleGenerate = async () => {
    if (!formData.keyword.trim()) {
      setError('키워드를 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError('')
    setCurrentStep(0)
    setProgress(0)
    setGeneratedContent(null)

    try {
      // 진행상황 시뮬레이션 시작
      const progressPromise = simulateProgress()

      // 실제 API 호출
      const response = await fetch(`${API_BASE_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      // 진행상황 완료 대기
      await progressPromise

      if (data.success) {
        setGeneratedContent(data.content)
        setCurrentStep(GENERATION_STEPS.length + 1) // 완료 상태
        setProgress(100)
      } else {
        throw new Error(data.message || '콘텐츠 생성에 실패했습니다.')
      }
    } catch (error) {
      setError(error.message)
      setCurrentStep(0)
      setProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content)
      // 복사 완료 알림 (실제로는 toast 사용)
      alert('콘텐츠가 클립보드에 복사되었습니다.')
    }
  }

  const handlePostToWordPress = async () => {
    if (!generatedContent || !formData.selected_site) {
      setError('WordPress 사이트를 선택해주세요.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wordpress/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          site_id: parseInt(formData.selected_site),
          title: generatedContent.title,
          content: generatedContent.content,
          status: formData.post_status,
          categories: generatedContent.categories,
          tags: generatedContent.tags,
          excerpt: generatedContent.excerpt,
          meta_description: generatedContent.meta_description
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('WordPress에 성공적으로 포스팅되었습니다!')
      } else {
        throw new Error(data.message || '포스팅에 실패했습니다.')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const renderProgressSection = () => {
    if (!isGenerating && currentStep === 0) return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>콘텐츠 생성</span>
          </CardTitle>
          <CardDescription>
            AI 기반 자동 콘텐츠 생성으로 SEO 최적화된 포스트를 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 전체 진행률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>전체 진행률</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {/* 단계별 진행상황 */}
            <div className="space-y-3">
              {GENERATION_STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                const isPending = currentStep < step.id

                return (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isCompleted ? 'text-green-600' :
                        isCurrent ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isCurrent ? step.description : 
                         isCompleted ? '완료됨' : '대기 중'}
                      </div>
                    </div>
                    <div>
                      {isCompleted && <Badge variant="default">완료</Badge>}
                      {isCurrent && <Badge variant="secondary">진행 중</Badge>}
                      {isPending && <Badge variant="outline">대기</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">콘텐츠 생성</h1>
        <p className="text-muted-foreground">
          AI 기반 자동 콘텐츠 생성으로 SEO 최적화된 포스트를 만들어보세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 진행상황 표시 */}
      {renderProgressSection()}

      {/* 생성된 콘텐츠 표시 */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>생성된 콘텐츠</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleCopyContent}>
                  <Copy className="mr-2 h-4 w-4" />
                  복사
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">제목</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {generatedContent.title}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">콘텐츠</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: generatedContent.content }} />
              </div>
            </div>

            {generatedContent.seo_analysis && (
              <div>
                <Label className="text-sm font-medium">SEO 분석</Label>
                <div className="mt-1 p-3 bg-blue-50 rounded-md">
                  <p>SEO 점수: {generatedContent.seo_analysis.score}/100</p>
                  <p>키워드 밀도: {generatedContent.seo_analysis.keyword_density}%</p>
                </div>
              </div>
            )}

            {/* WordPress 포스팅 옵션 */}
            {wpSites.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">WordPress 포스팅</Label>
                <div className="mt-2 space-y-3">
                  <Select value={formData.selected_site} onValueChange={(value) => handleInputChange('selected_site', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="사이트 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {wpSites.map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name} ({site.url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={formData.post_status} onValueChange={(value) => handleInputChange('post_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">초안</SelectItem>
                      <SelectItem value="publish">발행</SelectItem>
                      <SelectItem value="private">비공개</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={handlePostToWordPress} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    WordPress에 포스팅
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 콘텐츠 생성 폼 */}
      {!isGenerating && currentStep <= GENERATION_STEPS.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5" />
              <span>새 콘텐츠 생성</span>
            </CardTitle>
            <CardDescription>
              키워드와 설정을 입력하여 AI가 최적화된 콘텐츠를 생성하도록 하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">핵심 키워드 *</Label>
                <Input
                  id="keyword"
                  placeholder="예: 디지털 마케팅"
                  value={formData.keyword}
                  onChange={(e) => handleInputChange('keyword', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content_type">콘텐츠 유형</Label>
                <Select value={formData.content_type} onValueChange={(value) => handleInputChange('content_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_post">블로그 포스트</SelectItem>
                    <SelectItem value="article">기사</SelectItem>
                    <SelectItem value="tutorial">튜토리얼</SelectItem>
                    <SelectItem value="review">리뷰</SelectItem>
                    <SelectItem value="news">뉴스</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">톤 & 스타일</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">전문적</SelectItem>
                    <SelectItem value="casual">캐주얼</SelectItem>
                    <SelectItem value="friendly">친근한</SelectItem>
                    <SelectItem value="formal">공식적</SelectItem>
                    <SelectItem value="conversational">대화형</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">타겟 독자</Label>
                <Select value={formData.target_audience} onValueChange={(value) => handleInputChange('target_audience', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반인</SelectItem>
                    <SelectItem value="beginners">초보자</SelectItem>
                    <SelectItem value="professionals">전문가</SelectItem>
                    <SelectItem value="students">학생</SelectItem>
                    <SelectItem value="business">비즈니스</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="word_count">단어 수</Label>
                <Select value={formData.word_count.toString()} onValueChange={(value) => handleInputChange('word_count', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500 단어</SelectItem>
                    <SelectItem value="800">800 단어</SelectItem>
                    <SelectItem value="1200">1,200 단어</SelectItem>
                    <SelectItem value="1500">1,500 단어</SelectItem>
                    <SelectItem value="2000">2,000 단어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  콘텐츠 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  콘텐츠 생성 시작
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

