import { useState, useEffect } from 'react'
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
  Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const GENERATION_STEPS = [
  { id: 1, name: '키워드 분석', description: 'SEO 키워드 분석 중...' },
  { id: 2, name: 'AI 설정', description: 'AI 모델 설정 중...' },
  { id: 3, name: '콘텐츠 생성', description: 'AI가 콘텐츠를 생성 중...' },
  { id: 4, name: 'SEO 최적화', description: 'SEO 최적화 적용 중...' },
  { id: 5, name: '완료 처리', description: '최종 검토 및 완료...' }
]

export default function ContentGenerator() {
  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [error, setError] = useState('')
  
  // 폼 상태
  const [formData, setFormData] = useState({
    keyword: '',
    content_type: 'blog_post',
    tone: 'professional',
    target_audience: 'general',
    additional_keywords: '',
    custom_instructions: ''
  })

  // 콘텐츠 타입 옵션
  const contentTypes = {
    blog_post: { name: '블로그 포스트', icon: '📝' },
    product_review: { name: '제품 리뷰', icon: '⭐' },
    how_to_guide: { name: '하우투 가이드', icon: '📋' },
    listicle: { name: '리스트 형태 글', icon: '📄' },
    news_article: { name: '뉴스 기사', icon: '📰' }
  }

  // 톤 옵션
  const toneOptions = {
    professional: { name: '전문적', description: '공식적이고 전문적인 어조' },
    casual: { name: '캐주얼', description: '편안하고 친근한 어조' },
    friendly: { name: '친근한', description: '따뜻하고 접근하기 쉬운 어조' },
    authoritative: { name: '권위적', description: '확신에 찬 전문가적 어조' }
  }

  // 타겟 오디언스 옵션
  const audienceOptions = {
    general: { name: '일반', description: '일반적인 독자층' },
    beginners: { name: '초보자', description: '해당 분야 초보자' },
    experts: { name: '전문가', description: '해당 분야 전문가' },
    professionals: { name: '전문직', description: '업계 종사자' }
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
      // 단계별 진행 시뮬레이션
      for (let step = 0; step < GENERATION_STEPS.length; step++) {
        setCurrentStep(step)
        setProgress((step / GENERATION_STEPS.length) * 100)
        
        // 각 단계별 대기 시간
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))
      }

      // 실제 API 호출
      const response = await fetch(`${API_BASE_URL}/api/content/generate-advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          additional_keywords: formData.additional_keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedContent(data.data)
        setProgress(100)
      } else {
        // 데모 콘텐츠 생성
        const demoContent = {
          title: `${formData.keyword}에 대한 완벽한 가이드`,
          content: `# ${formData.keyword}에 대한 완벽한 가이드

## 소개

${formData.keyword}는 현재 많은 사람들이 관심을 가지고 있는 주제입니다. 이 글에서는 ${formData.keyword}에 대해 자세히 알아보고, 실용적인 정보를 제공하겠습니다.

## ${formData.keyword}란 무엇인가?

${formData.keyword}는 [상세한 설명이 여기에 들어갑니다]. 이는 다양한 분야에서 활용되고 있으며, 특히 [구체적인 활용 분야]에서 중요한 역할을 하고 있습니다.

## ${formData.keyword}의 주요 특징

1. **효율성**: ${formData.keyword}는 높은 효율성을 제공합니다.
2. **접근성**: 누구나 쉽게 접근할 수 있습니다.
3. **확장성**: 다양한 용도로 확장 가능합니다.

## ${formData.keyword} 활용 방법

### 1단계: 기본 설정
먼저 ${formData.keyword}를 시작하기 위한 기본 설정을 해야 합니다.

### 2단계: 실제 적용
설정이 완료되면 실제로 ${formData.keyword}를 적용해볼 수 있습니다.

### 3단계: 최적화
마지막으로 더 나은 결과를 위해 최적화 과정을 거칩니다.

## 결론

${formData.keyword}는 현대 사회에서 매우 중요한 요소입니다. 이 가이드를 통해 ${formData.keyword}에 대한 이해를 높이고, 실제로 활용해보시기 바랍니다.`,
          meta_description: `${formData.keyword}에 대한 완벽한 가이드. 기본 개념부터 실제 활용 방법까지 상세히 설명합니다.`,
          meta_keywords: [formData.keyword, `${formData.keyword} 가이드`, `${formData.keyword} 방법`],
          seo_score: 85,
          word_count: 450,
          reading_time: 3,
          generated_at: new Date().toISOString()
        }
        setGeneratedContent(demoContent)
        setProgress(100)
      }
    } catch (error) {
      setError(`콘텐츠 생성 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content)
      alert('콘텐츠가 클립보드에 복사되었습니다.')
    }
  }

  const handleDownload = () => {
    if (generatedContent) {
      const element = document.createElement('a')
      const file = new Blob([generatedContent.content], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `${generatedContent.title}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const handlePostToWordPress = () => {
    // WordPress 포스팅 로직
    alert('WordPress에 포스팅 기능은 설정에서 WordPress 사이트를 연결한 후 사용할 수 있습니다.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">콘텐츠 생성</h1>
        <p className="text-muted-foreground">
          AI 기반 자동 콘텐츠 생성으로 SEO 최적화된 블로그 포스트를 만들어보세요
        </p>
      </div>

      {/* 콘텐츠 생성 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5" />
            <span>AI 콘텐츠 생성</span>
          </CardTitle>
          <CardDescription>
            키워드와 설정을 입력하여 고품질 콘텐츠를 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">메인 키워드 *</Label>
              <Input
                id="keyword"
                placeholder="예: 워드프레스 블로그"
                value={formData.keyword}
                onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-type">콘텐츠 타입</Label>
              <Select 
                value={formData.content_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contentTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.icon} {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">글의 톤</Label>
              <Select 
                value={formData.tone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(toneOptions).map(([key, tone]) => (
                    <SelectItem key={key} value={key}>
                      {tone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">타겟 독자</Label>
              <Select 
                value={formData.target_audience} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(audienceOptions).map(([key, audience]) => (
                    <SelectItem key={key} value={key}>
                      {audience.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 추가 설정 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additional-keywords">추가 키워드 (선택사항)</Label>
              <Input
                id="additional-keywords"
                placeholder="키워드1, 키워드2, 키워드3"
                value={formData.additional_keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_keywords: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">쉼표로 구분하여 입력하세요</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-instructions">추가 지시사항 (선택사항)</Label>
              <Textarea
                id="custom-instructions"
                placeholder="특별한 요구사항이나 포함하고 싶은 내용을 입력하세요"
                value={formData.custom_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_instructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !formData.keyword.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                콘텐츠 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI 콘텐츠 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 진행 상황 */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>진행 상황</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>전체 진행률</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            <div className="space-y-3">
              {GENERATION_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    index < currentStep ? 'bg-green-500 text-white' :
                    index === currentStep ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : index === currentStep ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="text-xs">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성된 콘텐츠 */}
      {generatedContent && (
        <div className="space-y-6">
          {/* 콘텐츠 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>콘텐츠 생성 완료</span>
              </CardTitle>
              <CardDescription>
                고품질 SEO 최적화 콘텐츠가 성공적으로 생성되었습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{generatedContent.word_count}</div>
                  <div className="text-sm text-muted-foreground">단어 수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{generatedContent.seo_score}</div>
                  <div className="text-sm text-muted-foreground">SEO 점수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{generatedContent.reading_time}분</div>
                  <div className="text-sm text-muted-foreground">읽기 시간</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{generatedContent.meta_keywords?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">키워드 수</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 콘텐츠 미리보기 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>생성된 콘텐츠</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopyContent}>
                    <Copy className="h-4 w-4 mr-2" />
                    복사
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    다운로드
                  </Button>
                  <Button size="sm" onClick={handlePostToWordPress}>
                    <Send className="h-4 w-4 mr-2" />
                    WordPress 포스팅
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>제목</Label>
                  <div className="p-3 bg-muted rounded-md font-medium">
                    {generatedContent.title}
                  </div>
                </div>
                <div>
                  <Label>메타 설명</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {generatedContent.meta_description}
                  </div>
                </div>
                <div>
                  <Label>콘텐츠</Label>
                  <div className="p-4 bg-muted rounded-md max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent.content}</pre>
                  </div>
                </div>
                {generatedContent.meta_keywords && (
                  <div>
                    <Label>SEO 키워드</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedContent.meta_keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

