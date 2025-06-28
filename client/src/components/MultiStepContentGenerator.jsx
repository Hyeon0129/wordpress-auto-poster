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
  Globe,
  Languages,
  Type,
  Palette,
  FileText,
  Hash,
  Target,
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
  BarChart3,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const GENERATION_STEPS = [
  { id: 1, name: '키워드 분석', description: 'SEO 키워드 분석 중...', icon: Target },
  { id: 2, name: 'AI 설정', description: 'AI 모델 설정 중...', icon: Settings },
  { id: 3, name: '콘텐츠 생성', description: 'AI가 콘텐츠를 생성 중...', icon: Sparkles },
  { id: 4, name: 'SEO 최적화', description: 'SEO 최적화 적용 중...', icon: BarChart3 },
  { id: 5, name: '완료 처리', description: '최종 검토 및 완료...', icon: CheckCircle }
]

const COUNTRIES = [
  { value: 'KR', label: '대한민국' },
  { value: 'US', label: '미국' },
  { value: 'JP', label: '일본' },
  { value: 'CN', label: '중국' },
  { value: 'GB', label: '영국' },
  { value: 'DE', label: '독일' },
  { value: 'FR', label: '프랑스' },
  { value: 'CA', label: '캐나다' },
  { value: 'AU', label: '호주' },
]

const LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

const CONTENT_TYPES = [
  { value: 'blog_post', label: '블로그 글', icon: FileText },
  { value: 'guide', label: '가이드', icon: Eye },
  { value: 'review', label: '리뷰', icon: Target },
  { value: 'comparison', label: '비교글', icon: BarChart3 },
  { value: 'tutorial', label: '튜토리얼', icon: Settings },
  { value: 'news', label: '뉴스', icon: Globe },
]

const TONES = [
  { value: 'professional', label: '전문가형', desc: '전문적이고 신뢰할 수 있는 톤' },
  { value: 'friendly', label: '친절한', desc: '따뜻하고 접근하기 쉬운 톤' },
  { value: 'cheerful', label: '유쾌한', desc: '밝고 에너지 넘치는 톤' },
  { value: 'casual', label: '캐주얼', desc: '편안하고 자연스러운 톤' },
  { value: 'formal', label: '공식적', desc: '격식 있고 진중한 톤' },
  { value: 'conversational', label: '대화형', desc: '친근하고 대화하는 듯한 톤' },
]

const WORD_COUNTS = [
  { value: 500, label: '500 단어', desc: '짧은 글 (3-5분 읽기)' },
  { value: 800, label: '800 단어', desc: '보통 글 (5-7분 읽기)' },
  { value: 1000, label: '1,000 단어', desc: '중간 글 (7-10분 읽기)' },
  { value: 2000, label: '2,000 단어', desc: '긴 글 (12-15분 읽기)' },
]

const HEADING_COUNTS = [
  { value: 5, label: '5개 헤딩', desc: '간결한 구조' },
  { value: 7, label: '7개 헤딩', desc: '균형잡힌 구조 (추천)' },
  { value: 9, label: '9개 헤딩', desc: '상세한 구조' },
]

const PERSPECTIVES = [
  { value: 'first_person', label: '1인칭 (나, 우리)', desc: '개인적이고 친근한 관점' },
  { value: 'third_person', label: '3인칭 (그들, 사용자들)', desc: '객관적이고 전문적인 관점' },
  { value: 'mixed', label: '혼합', desc: '상황에 따라 적절히 사용' },
]

export default function MultiStepContentGenerator({ sidebarOpen = true }) {
  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState(0)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [error, setError] = useState('')
  const [wpSites, setWpSites] = useState([])
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    // Page 1: 콘텐츠 기획 정보
    keyword: '',
    target_country: 'KR',
    content_language: 'ko',
    title: '',
    tone: '',
    content_type: '',
    word_count: 800,
    
    // Page 2: SEO 및 구성 정보
    primary_keyword: '',
    secondary_keywords: [],
    heading_count: 7,
    perspective: 'third_person',
    
    // 추가 설정
    include_images: true,
    auto_post: false,
    selected_site: '',
    post_status: 'draft'
  })

  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)

  useEffect(() => {
    loadWordPressSites()
  }, [])

  useEffect(() => {
    // Page 1에서 키워드가 입력되면 Page 2의 primary_keyword에 자동 설정
    if (formData.keyword && formData.keyword !== formData.primary_keyword) {
      setFormData(prev => ({ ...prev, primary_keyword: formData.keyword }))
    }
  }, [formData.keyword])

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

  const addSecondaryKeyword = () => {
    const keyword = secondaryKeywordInput.trim()
    if (keyword && formData.secondary_keywords.length < 5 && !formData.secondary_keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        secondary_keywords: [...prev.secondary_keywords, keyword]
      }))
      setSecondaryKeywordInput('')
    }
  }

  const removeSecondaryKeyword = (keyword) => {
    setFormData(prev => ({
      ...prev,
      secondary_keywords: prev.secondary_keywords.filter(k => k !== keyword)
    }))
  }

  const handleSuggestTitle = async () => {
    // 필수 필드 검증
    if (!formData.keyword.trim()) {
      setError('Topic을 먼저 입력해주세요')
      return
    }
    if (!formData.primary_keyword.trim()) {
      setError('Primary Keyword를 먼저 입력해주세요')
      return
    }

    setError('')
    setIsGeneratingTitle(true)
    
    try {
      // TODO: 나중에 백엔드 API 연결
      // 임시로 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 임시 제목 예시
      const suggestedTitles = [
        `${formData.primary_keyword} 완전 가이드: 초보자를 위한 단계별 설명`,
        `${formData.primary_keyword}의 모든 것: 전문가가 알려주는 핵심 정보`,
        `${formData.primary_keyword} 마스터하기: 실무에서 바로 활용하는 방법`
      ]
      
      // 첫 번째 제목을 자동으로 설정 (실제로는 사용자가 선택할 수 있도록 모달 등을 구현할 수 있음)
      setFormData(prev => ({ ...prev, title: suggestedTitles[0] }))
      
    } catch (error) {
      setError('제목 추천 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  const validateForm = () => {
    const errors = []
    if (!formData.keyword.trim()) errors.push('핵심 키워드를 입력해주세요')
    if (!formData.tone) errors.push('톤 & 스타일을 선택해주세요')
    if (!formData.content_type) errors.push('콘텐츠 유형을 선택해주세요')
    if (!formData.primary_keyword.trim()) errors.push('Primary Keyword를 입력해주세요')
    
    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }
    setError('')
    return true
  }

  const simulateProgress = async () => {
    for (let step = 1; step <= GENERATION_STEPS.length; step++) {
      setGenerationStep(step)
      
      const stepProgress = ((step - 1) / GENERATION_STEPS.length) * 100
      const stepDuration = step === 3 ? 3000 : 1500
      
      for (let i = 0; i <= 100; i += 10) {
        const totalProgress = stepProgress + (i / GENERATION_STEPS.length)
        setGenerationProgress(Math.min(totalProgress, 100))
        await new Promise(resolve => setTimeout(resolve, stepDuration / 10))
      }
    }
  }

  const handleGenerate = async () => {
    if (!validateForm()) return

    setIsGenerating(true)
    setError('')
    setGenerationStep(0)
    setGenerationProgress(0)
    setGeneratedContent(null)

    try {
      const progressPromise = simulateProgress()

      const response = await fetch(`${API_BASE_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      await progressPromise

      if (data.success) {
        setGeneratedContent(data.content)
        setGenerationStep(GENERATION_STEPS.length + 1)
        setGenerationProgress(100)
      } else {
        throw new Error(data.message || '콘텐츠 생성에 실패했습니다.')
      }
    } catch (error) {
      setError(error.message)
      setGenerationStep(0)
      setGenerationProgress(0)
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
    if (!isGenerating && generationStep === 0) return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>콘텐츠 생성 중</span>
          </CardTitle>
          <CardDescription>
            AI가 SEO 최적화된 콘텐츠를 생성하고 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>전체 진행률</span>
              <span>{Math.round(generationProgress)}%</span>
            </div>
            <Progress value={generationProgress} className="w-full" />
          </div>

          <div className="space-y-3">
            {GENERATION_STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = generationStep > step.id
              const isCurrent = generationStep === step.id
              const isPending = generationStep < step.id

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
        </CardContent>
      </Card>
    )
  }

  const renderUnifiedForm = () => (
    <div className="flex h-full">
      {/* 좌측 컬럼 */}
      <div className="flex-1 pr-4">
        <div className="space-y-6 h-full flex flex-col">
          {/* 기본 정보 카드 */}
          <Card className="flex-grow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Target className="h-5 w-5 text-blue-600" />
                <span>기본 정보</span>
              </CardTitle>
              <CardDescription>콘텐츠의 핵심 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Topic */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Topic</Label>
                <Input
                  placeholder="예: tensorflow 설치"
                  value={formData.keyword}
                  onChange={(e) => handleInputChange('keyword', e.target.value)}
                  className="h-11 border-border focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Target Location & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Target Location</Label>
                  <Select value={formData.target_country} onValueChange={(value) => handleInputChange('target_country', value)}>
                    <SelectTrigger className="h-11 border-border focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Language</Label>
                  <Select value={formData.content_language} onValueChange={(value) => handleInputChange('content_language', value)}>
                    <SelectTrigger className="h-11 border-border focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Primary Keyword */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Primary Keyword</Label>
                <Input
                  placeholder="SEO 최적화의 핵심이 될 주요 키워드"
                  value={formData.primary_keyword}
                  onChange={(e) => handleInputChange('primary_keyword', e.target.value)}
                  className="h-11 border-border focus:border-primary focus:ring-primary"
                />
              </div>

              {/* 콘텐츠 제목 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">콘텐츠 제목 (선택사항)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestTitle}
                    disabled={isGeneratingTitle}
                    className="h-7 px-3 text-xs border-border hover:bg-muted"
                  >
                    {isGeneratingTitle ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        생성중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        제목추천
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  placeholder="원하는 제목이 있다면 입력하세요"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="h-11 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* 콘텐츠 유형 & 스타일 카드 */}
          <Card className="flex-grow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Palette className="h-5 w-5 text-purple-600" />
                <span>콘텐츠 유형 & 스타일</span>
              </CardTitle>
              <CardDescription>콘텐츠의 유형과 스타일을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Article Type */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Article Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CONTENT_TYPES.map((type) => {
                    const TypeIcon = type.icon
                    return (
                      <div
                        key={type.value}
                        className={`flex items-center space-x-2 px-3 py-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          formData.content_type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-muted-foreground dark:bg-muted dark:text-foreground'
                            : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => handleInputChange('content_type', type.value)}
                      >
                        <TypeIcon className="h-4 w-4" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Writing Style */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Writing Style</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TONES.map((tone) => (
                    <div
                      key={tone.value}
                      className={`px-3 py-3 border rounded-lg cursor-pointer transition-all hover:shadow-md text-center ${
                        formData.tone === tone.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-muted-foreground dark:bg-muted dark:text-foreground'
                          : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => handleInputChange('tone', tone.value)}
                    >
                      <div className="font-medium text-sm">{tone.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Keywords 카드 */}
          <Card className="flex-grow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Hash className="h-5 w-5 text-green-600" />
                <span>Secondary Keywords</span>
              </CardTitle>
              <CardDescription>콘텐츠에 포함될 보조 키워드들을 추가하세요 (최대 5개)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="보조 키워드 입력 후 Enter"
                  value={secondaryKeywordInput}
                  onChange={(e) => setSecondaryKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSecondaryKeyword()}
                  className="flex-1 h-11 border-border focus:border-primary focus:ring-primary"
                />
                <Button 
                  onClick={addSecondaryKeyword}
                  disabled={formData.secondary_keywords.length >= 5 || !secondaryKeywordInput.trim()}
                  className="h-11 px-4 bg-primary hover:bg-primary/90"
                >
                  추가
                </Button>
              </div>
              
              {formData.secondary_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                  {formData.secondary_keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center bg-muted-foreground/10 text-foreground border border-border">
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => removeSecondaryKeyword(keyword)}
                        className="ml-2 hover:text-red-500 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                {formData.secondary_keywords.length}/5 키워드 사용 중
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 우측 컬럼 */}
      <div className="flex-1 pl-4">
        <div className="space-y-6 h-full flex flex-col">
          {/* Article Structure 카드 */}
          <Card className="flex-grow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5 text-orange-600" />
                <span>Article Structure and Length</span>
              </CardTitle>
              <CardDescription>Choose the best format for your content goals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WORD_COUNTS.map((count) => (
                  <label
                    key={count.value}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.word_count === count.value
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200 shadow-sm dark:border-muted-foreground dark:bg-muted dark:ring-muted-foreground/20'
                        : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="word_count"
                      value={count.value}
                      checked={formData.word_count === count.value}
                      onChange={() => handleInputChange('word_count', count.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center ${
                      formData.word_count === count.value ? 'border-blue-500 dark:border-muted-foreground' : 'border-border'
                    }`}>
                      {formData.word_count === count.value && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-muted-foreground"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">{count.label}</div>
                      <div className="text-xs text-muted-foreground">{count.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Point of View 카드 */}
          <Card className="flex-grow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Eye className="h-5 w-5 text-indigo-600" />
                <span>Point of view</span>
              </CardTitle>
              <CardDescription>Choose the narrative perspective for your article</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PERSPECTIVES.map((perspective) => (
                  <div
                    key={perspective.value}
                    className={`px-4 py-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.perspective === perspective.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-muted-foreground dark:bg-muted dark:text-foreground'
                        : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={() => handleInputChange('perspective', perspective.value)}
                  >
                    <div className="font-semibold text-sm text-foreground">{perspective.label}</div>
                    <div className="text-xs text-muted-foreground">{perspective.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Select headings 카드 */}
          <Card className="flex-grow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Settings className="h-5 w-5 text-teal-600" />
                <span>Select headings</span>
              </CardTitle>
              <CardDescription>콘텐츠의 구조를 결정할 헤딩 수를 선택하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {HEADING_COUNTS.map((count) => (
                  <label
                    key={count.value}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.heading_count === count.value
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200 shadow-sm dark:border-muted-foreground dark:bg-muted dark:ring-muted-foreground/20'
                        : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="heading_count"
                      value={count.value}
                      checked={formData.heading_count === count.value}
                      onChange={() => handleInputChange('heading_count', count.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center ${
                      formData.heading_count === count.value ? 'border-blue-500 dark:border-muted-foreground' : 'border-border'
                    }`}>
                      {formData.heading_count === count.value && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-muted-foreground"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">{count.label}</div>
                      <div className="text-xs text-muted-foreground">{count.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderGeneratedContent = () => {
    if (!generatedContent) return null

    return (
      <Card className="mt-8">
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
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* 왼쪽 사이드바 - 입력 체크리스트 */}
      <div className={`w-80 bg-background fixed top-16 bottom-0 overflow-y-auto border-r border-border z-30 ${
        sidebarOpen ? 'left-72' : 'left-20'
      }`}>
        <div className="pt-4 pb-6 px-4 h-full">
          <h3 className="text-lg font-bold mb-4 text-foreground">입력 체크리스트</h3>
          <div className="space-y-4">
            {[
              { 
                key: 'keyword', 
                label: 'Topic 입력', 
                completed: !!formData.keyword.trim(),
                value: formData.keyword
              },
              { 
                key: 'target_country', 
                label: 'Target Location', 
                completed: !!formData.target_country,
                value: COUNTRIES.find(c => c.value === formData.target_country)?.label
              },
              { 
                key: 'content_language', 
                label: 'Article Language', 
                completed: !!formData.content_language,
                value: LANGUAGES.find(l => l.value === formData.content_language)?.label
              },
              { 
                key: 'primary_keyword', 
                label: 'Primary Keyword', 
                completed: !!formData.primary_keyword.trim(),
                value: formData.primary_keyword
              },
              { 
                key: 'content_type', 
                label: 'Article Type', 
                completed: !!formData.content_type,
                value: CONTENT_TYPES.find(t => t.value === formData.content_type)?.label
              },
              { 
                key: 'tone', 
                label: 'Writing Style', 
                completed: !!formData.tone,
                value: TONES.find(t => t.value === formData.tone)?.label
              },
              { 
                key: 'word_count', 
                label: 'Article Length', 
                completed: !!formData.word_count,
                value: WORD_COUNTS.find(w => w.value === formData.word_count)?.label
              },
              { 
                key: 'perspective', 
                label: 'Point of View', 
                completed: !!formData.perspective,
                value: PERSPECTIVES.find(p => p.value === formData.perspective)?.label
              },
              { 
                key: 'heading_count', 
                label: 'Select Headings', 
                completed: !!formData.heading_count,
                value: HEADING_COUNTS.find(h => h.value === formData.heading_count)?.label
              }
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    item.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-muted-foreground'
                  }`}>
                    {item.completed && <CheckCircle className="h-3 w-3" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    item.completed ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {item.completed && item.value && (
                  <div className="ml-8 text-xs text-muted-foreground">
                    {item.value}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 완료도 표시 */}
          <div className="mt-4 pt-3">
            <div className="text-sm font-medium text-foreground mb-2">완료도</div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.round(([
                    !!formData.keyword.trim(),
                    !!formData.target_country,
                    !!formData.content_language,
                    !!formData.primary_keyword.trim(),
                    !!formData.content_type,
                    !!formData.tone,
                    !!formData.word_count,
                    !!formData.perspective,
                    !!formData.heading_count
                  ].filter(Boolean).length / 9) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {[
                !!formData.keyword.trim(),
                !!formData.target_country,
                !!formData.content_language,
                !!formData.primary_keyword.trim(),
                !!formData.content_type,
                !!formData.tone,
                !!formData.word_count,
                !!formData.perspective,
                !!formData.heading_count
              ].filter(Boolean).length}/9 완료
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className={`flex-1 min-h-screen ${
        sidebarOpen ? 'ml-[24rem]' : 'ml-[24rem]'
      }`}>
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generation Progress */}
          {renderProgressSection()}

          {/* Generated Content */}
          {renderGeneratedContent()}

          {/* Unified Form */}
          {!isGenerating && generationStep <= GENERATION_STEPS.length && renderUnifiedForm()}

          {/* 페이지 하단 게시물 생성 버튼 */}
          {!isGenerating && generationStep <= GENERATION_STEPS.length && (
            <div className="mt-16 mb-12 flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-40 h-10 bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 dark:from-slate-200 dark:to-slate-400 dark:hover:from-slate-300 dark:hover:to-slate-500 dark:text-slate-900 font-semibold shadow-lg hover:shadow-xl transition-all rounded-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>게시물 생성</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 