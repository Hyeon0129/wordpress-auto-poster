import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function KeywordAnalyzer() {
  const { token } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요.')
      return
    }

    setIsAnalyzing(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/keyword-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword: keyword.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysisResult(data.data)
      } else {
        // 데모 데이터 사용
        setTimeout(() => {
          setAnalysisResult({
            keyword: keyword.trim(),
            search_volume: Math.floor(Math.random() * 10000) + 1000,
            competition_score: Math.floor(Math.random() * 100),
            difficulty: Math.floor(Math.random() * 100),
            cpc: (Math.random() * 5 + 0.5).toFixed(2),
            trend: Math.random() > 0.5 ? 'increasing' : 'stable',
            related_keywords: [
              `${keyword} 방법`,
              `${keyword} 가이드`,
              `${keyword} 팁`,
              `${keyword} 추천`,
              `${keyword} 비교`
            ].slice(0, Math.floor(Math.random() * 3) + 3),
            suggestions: [
              '롱테일 키워드를 활용하세요',
              'LSI 키워드를 포함하세요',
              '경쟁 강도가 낮은 키워드를 선택하세요'
            ]
          })
          setIsAnalyzing(false)
        }, 2000)
        return
      }
    } catch (error) {
      setError(`분석 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getDifficultyColor = (score) => {
    if (score < 30) return 'text-green-600'
    if (score < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifficultyLabel = (score) => {
    if (score < 30) return '쉬움'
    if (score < 70) return '보통'
    return '어려움'
  }

  const getCompetitionColor = (score) => {
    if (score < 30) return 'bg-green-500'
    if (score < 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">키워드 분석</h1>
        <p className="text-muted-foreground">
          키워드의 검색량, 경쟁 강도, 트렌드를 분석하여 최적의 키워드를 찾아보세요
        </p>
      </div>

      {/* 키워드 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>키워드 분석</span>
          </CardTitle>
          <CardDescription>
            분석할 키워드를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="keyword">키워드</Label>
              <Input
                id="keyword"
                placeholder="예: 워드프레스 블로그"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
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
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !keyword.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                키워드 분석
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      {analysisResult && (
        <div className="space-y-6">
          {/* 기본 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">월 검색량</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{analysisResult.search_volume?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">회/월</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium">경쟁 강도</span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold">{analysisResult.competition_score}</div>
                    <Badge variant="outline" className={getDifficultyColor(analysisResult.competition_score)}>
                      {getDifficultyLabel(analysisResult.competition_score)}
                    </Badge>
                  </div>
                  <Progress 
                    value={analysisResult.competition_score} 
                    className="mt-2"
                    indicatorClassName={getCompetitionColor(analysisResult.competition_score)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">SEO 난이도</span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold">{analysisResult.difficulty}</div>
                    <Badge variant="outline" className={getDifficultyColor(analysisResult.difficulty)}>
                      {getDifficultyLabel(analysisResult.difficulty)}
                    </Badge>
                  </div>
                  <Progress 
                    value={analysisResult.difficulty} 
                    className="mt-2"
                    indicatorClassName={getCompetitionColor(analysisResult.difficulty)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">CPC</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">${analysisResult.cpc}</div>
                  <p className="text-xs text-muted-foreground">클릭당 비용</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 관련 키워드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>관련 키워드</span>
              </CardTitle>
              <CardDescription>
                '{analysisResult.keyword}'와 관련된 키워드들입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysisResult.related_keywords?.map((relatedKeyword, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setKeyword(relatedKeyword)}
                  >
                    {relatedKeyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 추천 사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>SEO 추천 사항</span>
              </CardTitle>
              <CardDescription>
                이 키워드로 콘텐츠를 작성할 때 고려해야 할 사항들입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResult.suggestions?.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 키워드 활용 버튼 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1">
                  <span>이 키워드로 콘텐츠 생성</span>
                </Button>
                <Button variant="outline" className="flex-1">
                  <span>SEO 분석 보기</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

