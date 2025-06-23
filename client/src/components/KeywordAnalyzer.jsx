import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Search, 
  TrendingUp, 
  Target, 
  Lightbulb,
  RefreshCw,
  Copy,
  Download,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE_URL } from '../lib/api'

export default function KeywordAnalyzer() {
  const { token } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [relatedKeywords, setRelatedKeywords] = useState([])
  const [seoSuggestions, setSeoSuggestions] = useState([])
  
  const [keyword, setKeyword] = useState('')

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      alert('분석할 키워드를 입력해주세요.')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // 키워드 분석
      const analysisResponse = await fetch(`${API_BASE_URL}/api/content/analyze-keyword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword })
      })

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        setAnalysis(analysisData)
      }

      // 관련 키워드 조회
      const relatedResponse = await fetch(`${API_BASE_URL}/api/seo/keywords/related`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword })
      })

      if (relatedResponse.ok) {
        const relatedData = await relatedResponse.json()
        setRelatedKeywords(relatedData.related_keywords)
      }

      // SEO 제안 조회
      const suggestionsResponse = await fetch(`${API_BASE_URL}/api/seo/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword, content_type: 'blog_post' })
      })

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json()
        setSeoSuggestions(suggestionsData.suggestions)
      }

    } catch (error) {
      alert(`키워드 분석 중 오류: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyKeyword = (keywordText) => {
    navigator.clipboard.writeText(keywordText)
    alert('키워드가 클립보드에 복사되었습니다.')
  }

  const exportKeywords = () => {
    const data = {
      main_keyword: keyword,
      analysis: analysis,
      related_keywords: relatedKeywords,
      seo_suggestions: seoSuggestions,
      exported_at: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyword-analysis-${keyword}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">키워드 분석</h1>
        <p className="text-muted-foreground">
          키워드의 잠재력을 분석하고 관련 키워드를 발견하세요
        </p>
      </div>

      {/* 검색 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>키워드 분석</span>
          </CardTitle>
          <CardDescription>
            분석하고 싶은 키워드를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="keyword">키워드</Label>
              <Input
                id="keyword"
                placeholder="예: 워드프레스, SEO, 블로그 마케팅"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !keyword.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    분석 시작
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 키워드 분석 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>키워드 분석 결과</span>
                </div>
                <Button variant="outline" size="sm" onClick={exportKeywords}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">키워드 정보</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{analysis.meaning}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">타겟 독자층</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.target_audience.map((audience, index) => (
                    <Badge key={index} variant="outline">
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">콘텐츠 제안</h3>
                <div className="space-y-2">
                  {analysis.content_suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{suggestion}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyKeyword(suggestion)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">SEO 활용 팁</h3>
                <div className="space-y-2">
                  {analysis.seo_tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 관련 키워드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>관련 키워드</span>
              </CardTitle>
              <CardDescription>
                메인 키워드와 관련된 추천 키워드들
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="related" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="related">관련 키워드</TabsTrigger>
                  <TabsTrigger value="suggestions">제목 제안</TabsTrigger>
                </TabsList>
                
                <TabsContent value="related" className="mt-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {relatedKeywords.map((relatedKeyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                        <span className="text-sm font-medium">{relatedKeyword}</span>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyKeyword(relatedKeyword)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setKeyword(relatedKeyword)
                              handleAnalyze()
                            }}
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="suggestions" className="mt-4">
                  <div className="space-y-4">
                    {seoSuggestions.map((category, index) => (
                      <div key={index}>
                        <h3 className="font-medium mb-2 capitalize">
                          {category.category === 'title' ? '제목 제안' : 
                           category.category === 'meta_description' ? '메타 디스크립션 제안' : 
                           category.category}
                        </h3>
                        <div className="space-y-2">
                          {category.suggestions.map((suggestion, suggestionIndex) => (
                            <div key={suggestionIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm flex-1">{suggestion}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyKeyword(suggestion)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {!analysis && !isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">키워드 분석 준비 완료</p>
                <p>키워드를 입력하고 '분석 시작' 버튼을 클릭하세요</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

