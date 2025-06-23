import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { 
  TrendingUp, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Lightbulb,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE_URL } from '../lib/api'

export default function SEOOptimizer() {
  const { token } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    metaDescription: '',
    targetKeyword: ''
  })

  const handleAnalyze = async () => {
    if (!formData.content.trim()) {
      alert('분석할 콘텐츠를 입력해주세요.')
      return
    }

    setIsAnalyzing(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/seo/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          meta_description: formData.metaDescription,
          target_keyword: formData.targetKeyword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data.analysis)
      } else {
        alert(`SEO 분석 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`SEO 분석 중 오류: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">높음</Badge>
      case 'medium':
        return <Badge variant="default">보통</Badge>
      case 'low':
        return <Badge variant="secondary">낮음</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'optimal':
        return <Badge variant="default" className="bg-green-500">최적</Badge>
      case 'good':
        return <Badge variant="default" className="bg-blue-500">양호</Badge>
      case 'too_low':
        return <Badge variant="destructive">부족</Badge>
      case 'too_high':
        return <Badge variant="destructive">과다</Badge>
      case 'missing':
        return <Badge variant="outline">누락</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">SEO 최적화</h1>
        <p className="text-muted-foreground">
          콘텐츠의 SEO 성능을 분석하고 개선 방안을 제시합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>SEO 분석 입력</span>
            </CardTitle>
            <CardDescription>
              분석할 콘텐츠와 메타데이터를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 타겟 키워드 */}
            <div className="space-y-2">
              <Label htmlFor="targetKeyword">타겟 키워드</Label>
              <Input
                id="targetKeyword"
                placeholder="예: 워드프레스 SEO"
                value={formData.targetKeyword}
                onChange={(e) => setFormData(prev => ({ ...prev, targetKeyword: e.target.value }))}
              />
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="포스트 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                권장 길이: 30-60자 (현재: {formData.title.length}자)
              </p>
            </div>

            {/* 메타 디스크립션 */}
            <div className="space-y-2">
              <Label htmlFor="metaDescription">메타 디스크립션</Label>
              <Textarea
                id="metaDescription"
                placeholder="검색 결과에 표시될 설명을 입력하세요"
                value={formData.metaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                권장 길이: 120-160자 (현재: {formData.metaDescription.length}자)
              </p>
            </div>

            {/* 콘텐츠 */}
            <div className="space-y-2">
              <Label htmlFor="content">콘텐츠</Label>
              <Textarea
                id="content"
                placeholder="분석할 콘텐츠를 입력하세요 (마크다운 형식)"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                단어 수: {formData.content.split(' ').filter(word => word.length > 0).length}
              </p>
            </div>

            {/* 분석 버튼 */}
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !formData.content.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  SEO 분석 중...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  SEO 분석 시작
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 패널 */}
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* 전체 점수 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>SEO 점수</span>
                    </div>
                    {getScoreIcon(analysis.score)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/100
                    </div>
                    <Progress value={analysis.score} className="mt-4" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {analysis.score >= 80 ? '우수한 SEO 최적화' :
                       analysis.score >= 60 ? '보통 수준의 SEO 최적화' :
                       '개선이 필요한 SEO 상태'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 키워드 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle>키워드 분석</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>키워드 밀도</span>
                    <div className="flex items-center space-x-2">
                      <span>{analysis.keyword_analysis.density}%</span>
                      {getStatusBadge(analysis.keyword_analysis.status)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>키워드 출현 횟수</span>
                    <span>{analysis.keyword_analysis.count}회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>총 단어 수</span>
                    <span>{analysis.keyword_analysis.total_words}개</span>
                  </div>
                </CardContent>
              </Card>

              {/* 제목 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle>제목 분석</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>제목 길이</span>
                    <div className="flex items-center space-x-2">
                      <span>{analysis.title_analysis.length}자</span>
                      {getStatusBadge(analysis.title_analysis.length_status)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>키워드 포함</span>
                    {getStatusBadge(analysis.title_analysis.keyword_status)}
                  </div>
                </CardContent>
              </Card>

              {/* 메타 디스크립션 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle>메타 디스크립션 분석</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>설명 길이</span>
                    <div className="flex items-center space-x-2">
                      <span>{analysis.meta_analysis.length}자</span>
                      {getStatusBadge(analysis.meta_analysis.length_status)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>키워드 포함</span>
                    {getStatusBadge(analysis.meta_analysis.keyword_status)}
                  </div>
                </CardContent>
              </Card>

              {/* 콘텐츠 구조 */}
              <Card>
                <CardHeader>
                  <CardTitle>콘텐츠 구조</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>H1 헤딩</span>
                    <span>{analysis.content_analysis.headings.h1}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>H2 헤딩</span>
                    <span>{analysis.content_analysis.headings.h2}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>H3 헤딩</span>
                    <span>{analysis.content_analysis.headings.h3}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>문단 수</span>
                    <span>{analysis.content_analysis.paragraphs}개</span>
                  </div>
                </CardContent>
              </Card>

              {/* 가독성 */}
              <Card>
                <CardHeader>
                  <CardTitle>가독성 분석</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>가독성 점수</span>
                    <span className={getScoreColor(analysis.readability.score)}>
                      {analysis.readability.score}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>평균 문장 길이</span>
                    <span>{analysis.readability.avg_words_per_sentence}단어</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>가독성 수준</span>
                    <Badge variant="outline">
                      {analysis.readability.level === 'easy' ? '쉬움' :
                       analysis.readability.level === 'medium' ? '보통' : '어려움'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">SEO 분석 준비 완료</p>
                    <p>콘텐츠를 입력하고 'SEO 분석 시작' 버튼을 클릭하세요</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 개선 제안 */}
      {analysis && analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>개선 제안</span>
            </CardTitle>
            <CardDescription>
              SEO 성능을 향상시키기 위한 구체적인 개선 방안
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.suggestions.map((suggestion, index) => (
                <Alert key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4" />
                        <span className="font-medium capitalize">{suggestion.type.replace('_', ' ')}</span>
                        {getPriorityBadge(suggestion.priority)}
                      </div>
                      <AlertDescription>{suggestion.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

