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
  X,
  Search,
  Database
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const GENERATION_STEPS = [
  { id: 1, name: 'Topic Analysis', icon: Target },
  { id: 2, name: 'AI Research', icon: Search },
  { id: 3, name: 'Content Writing', icon: Sparkles },
  { id: 4, name: 'SEO Optimization', icon: BarChart3 },
  { id: 5, name: 'Final Review', icon: CheckCircle }
]

const COUNTRIES = [
  { value: 'AF', label: 'Afghanistan', flag: '🇦🇫' },
  { value: 'AL', label: 'Albania', flag: '🇦🇱' },
  { value: 'DZ', label: 'Algeria', flag: '🇩🇿' },
  { value: 'AS', label: 'American Samoa', flag: '🇦🇸' },
  { value: 'AD', label: 'Andorra', flag: '🇦🇩' },
  { value: 'AO', label: 'Angola', flag: '🇦🇴' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'CN', label: 'China', flag: '🇨🇳' },
  { value: 'FR', label: 'France', flag: '🇫🇷' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵' },
  { value: 'KR', label: 'South Korea', flag: '🇰🇷' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
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

const ARTICLE_TYPES = [
  { id: 'ai-recommended', label: 'AI Recommended', icon: Sparkles },
  { id: 'news-articles', label: 'News Articles', icon: Globe },
  { id: 'blog-posts', label: 'Blog Posts', icon: FileText },
  { id: 'how-to-guides', label: 'How-To Guides', icon: Eye },
  { id: 'listicles', label: 'Listicles', icon: Hash },
  { id: 'comparison-blogs', label: 'Comparison Blogs', icon: BarChart3 },
  { id: 'technical-articles', label: 'Technical Articles', icon: Settings },
  { id: 'product-reviews', label: 'Product Reviews', icon: Target },
  { id: 'glossary-pages', label: 'Glossary Pages', icon: Type }
]

export default function MultiStepContentGenerator({ sidebarOpen = true }) {
  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [error, setError] = useState('')
  const [wpSites, setWpSites] = useState([])
  
  const [formData, setFormData] = useState({
    topic: '',
    target_country: 'US',
    article_language: 'en',
    keywords: '',
    article_type: 'ai-recommended',
    research_method: 'ai-web-research',
    primary_keyword: '',
    secondary_keywords: [],
    competitor_urls: []
  })
  
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false)
  const [topRankingArticles, setTopRankingArticles] = useState([])
  const [countrySearchTerm, setCountrySearchTerm] = useState('')
  const [languageSearchTerm, setLanguageSearchTerm] = useState('')

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

  const validateForm = () => {
    if (!formData.topic.trim()) {
      setError('Topic을 입력해주세요')
      return false
    }
    return true
  }

  const simulateProgress = async () => {
    setCurrentStep(0)
    for (let i = 0; i <= 100; i += 10) {
      setGenerationProgress(i)
      if (i % 20 === 0 && i > 0) {
        setCurrentStep(prev => Math.min(prev + 1, GENERATION_STEPS.length - 1))
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const handleGenerate = async () => {
    if (!validateForm()) return

    setError('')
    setIsGenerating(true)
    setCurrentStep(0)
    setGenerationProgress(0)

    try {
      await simulateProgress()
      
      // 실제 API 호출
      const response = await fetch(`${API_BASE_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('콘텐츠 생성에 실패했습니다')
      }

      const data = await response.json()
      setGeneratedContent(data)
    } catch (error) {
      console.error('Generation error:', error)
      setError(error.message || '콘텐츠 생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
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

  const addCompetitorUrl = async () => {
    if (!urlInput.trim() || formData.competitor_urls.length >= 5) return
    
    setIsAnalyzingUrl(true)
    try {
      // 실제로는 백엔드 API를 호출하여 URL을 분석
      // 여기서는 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newUrl = {
        url: urlInput.trim(),
        title: 'Home - ' + urlInput.replace(/https?:\/\//, '').split('/')[0],
        status: 'Added',
        id: Date.now() // 고유 ID 추가
      }
      
      setFormData(prev => ({
        ...prev,
        competitor_urls: [...prev.competitor_urls, newUrl]
      }))
      
      // Top Ranking Articles 시뮬레이션
      setTopRankingArticles(prev => [
        ...prev,
        {
          title: 'Home - ' + urlInput.replace(/https?:\/\//, '').split('/')[0],
          url: urlInput.trim(),
          selected: true,
          id: Date.now()
        }
      ])
      
      setUrlInput('')
    } catch (error) {
      console.error('URL 분석 실패:', error)
    } finally {
      setIsAnalyzingUrl(false)
    }
  }

  const removeCompetitorUrl = (urlId) => {
    setFormData(prev => ({
      ...prev,
      competitor_urls: prev.competitor_urls.filter(url => url.id !== urlId)
    }))
    setTopRankingArticles(prev => prev.filter(article => article.id !== urlId))
  }

  const filteredCountries = COUNTRIES.filter(country =>
    country.label.toLowerCase().includes(countrySearchTerm.toLowerCase())
  )

  const filteredLanguages = LANGUAGES.filter(language =>
    language.label.toLowerCase().includes(languageSearchTerm.toLowerCase())
  )

  const renderSidebar = () => (
    <div className="w-full max-w-[170px] mx-auto">
      <div className="space-y-3">
        {[
          { step: 1, label: 'Enter a Topic', completed: !!formData.topic.trim() },
          { step: 2, label: 'Target Location', completed: !!formData.target_country },
          { step: 3, label: 'Article Language', completed: !!formData.article_language },
          { step: 4, label: 'Competitor URLs', completed: formData.competitor_urls.length > 0 },
          { step: 5, label: 'Keywords', completed: !!formData.keywords.trim() },
          { step: 6, label: 'Article Type', completed: !!formData.article_type },
          { step: 7, label: 'Primary Keyword', completed: !!formData.primary_keyword.trim() },
          { step: 8, label: 'Secondary Keywords', completed: formData.secondary_keywords.length > 0 },
          { step: 9, label: 'Research Method', completed: !!formData.research_method },
          { step: 10, label: 'Generate Article', completed: !!generatedContent }
        ].map((item) => (
          <div key={item.step} className="flex items-center space-x-3 py-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              item.completed 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {item.step}
            </div>
            <span className={`text-sm leading-tight ${
              item.completed ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderMainContent = () => {
    if (isGenerating) {
      return renderProgressSection()
    }
    
    if (generatedContent) {
      return renderGeneratedContent()
    }
    
    return renderInputForm()
  }

  const renderProgressSection = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AI가 콘텐츠를 생성하고 있습니다</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {GENERATION_STEPS[currentStep]?.name}... 잠시만 기다려주세요
        </p>
      </div>
      
      <div className="space-y-3">
        <Progress value={generationProgress} className="h-2" />
        <p className="text-sm text-gray-500">{generationProgress}% 완료</p>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">처리 중...</span>
      </div>
    </div>
  )

  const renderInputForm = () => (
    <div className="w-full max-w-none px-16 xl:px-20 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Start Your Article: Choose Your Topic</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Define the key elements to tailor your content for targeted impact
        </p>
      </div>

      {/* Topic Input */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Topic</Label>
        <Input
          placeholder="Enter your article's topic here"
          value={formData.topic}
          onChange={(e) => handleInputChange('topic', e.target.value)}
          className="h-12 text-base"
        />
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">ansible은 왜 많은 클러스터 관리 도구 중에서 선택되는가?</Badge>
          <Badge variant="outline" className="text-xs">ansible은 CICD 파이프라인의 구성요소인가?</Badge>
          <Badge variant="outline" className="text-xs">ansible은 운을 실무 에서도 요긴하게 놀라다</Badge>
          <Badge variant="outline" className="text-xs">ansible은 클러스터 관리 자동화의 핵심 도구가</Badge>
        </div>
      </div>

      {/* Two Column Layout - 5:5 ratio with full width */}
      <div className="grid grid-cols-2 gap-16">
        {/* Target Audience Location - 50% width */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Target Audience Location</Label>
          <Select value={formData.target_country} onValueChange={(value) => handleInputChange('target_country', value)}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue>
                {COUNTRIES.find(c => c.value === formData.target_country) && (
                  <div className="flex items-center gap-2">
                    <span>{COUNTRIES.find(c => c.value === formData.target_country).flag}</span>
                    <span>{COUNTRIES.find(c => c.value === formData.target_country).label}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-80 w-full">
              <div className="p-2 sticky top-0 bg-white dark:bg-gray-950 z-10">
                <Input 
                  placeholder="Select location..." 
                  className="h-8 text-sm"
                  value={countrySearchTerm}
                  onChange={(e) => {
                    setCountrySearchTerm(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    // 특정 키들만 Select로 전파되지 않도록 차단
                    if (e.key !== 'Escape' && e.key !== 'Tab' && e.key !== 'Enter') {
                      e.stopPropagation()
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.map(country => (
                  <SelectItem key={country.value} value={country.value} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.label}</span>
                    </div>
                  </SelectItem>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No countries found
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Article Language - 50% width */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Article Language</Label>
          <Select value={formData.article_language} onValueChange={(value) => handleInputChange('article_language', value)}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80 w-full">
              <div className="p-2 sticky top-0 bg-white dark:bg-gray-950 z-10">
                <Input 
                  placeholder="Select language..." 
                  className="h-8 text-sm"
                  value={languageSearchTerm}
                  onChange={(e) => {
                    setLanguageSearchTerm(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    // 특정 키들만 Select로 전파되지 않도록 차단
                    if (e.key !== 'Escape' && e.key !== 'Tab' && e.key !== 'Enter') {
                      e.stopPropagation()
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredLanguages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No languages found
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Select Top-Performing Competitor Articles */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Select Top-Performing Competitor Articles</Label>
          <p className="text-sm text-muted-foreground mt-1">Choose up to 5 articles to optimize your content strategy</p>
        </div>

        {/* Add Your Own */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Add Your Own</Label>
          <div className="relative">
            <Input
              placeholder="Enter URL of a specific article you want to analyze"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-12 pr-20"
              onKeyPress={(e) => e.key === 'Enter' && addCompetitorUrl()}
            />
            <Button 
              onClick={addCompetitorUrl}
              disabled={isAnalyzingUrl || !urlInput.trim() || formData.competitor_urls.length >= 5}
              className="absolute right-2 top-2 h-8 px-4 bg-black hover:bg-gray-800 text-white text-sm dark:bg-white dark:hover:bg-gray-200 dark:text-black"
            >
              {isAnalyzingUrl ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Add +'
              )}
            </Button>
          </div>
        </div>

        {/* Top Ranking Articles */}
        {topRankingArticles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Top Ranking Articles</Label>
              <span className="text-sm text-muted-foreground">Selected: {topRankingArticles.filter(a => a.selected).length}/{topRankingArticles.length}</span>
            </div>
            <div className="space-y-2">
              {topRankingArticles.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{article.title}</div>
                      <div className="text-xs text-muted-foreground">{article.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Added
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeCompetitorUrl(article.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keywords */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Keywords (Optional)</Label>
        <Textarea
          placeholder="Enter your keywords here..."
          value={formData.keywords}
          onChange={(e) => handleInputChange('keywords', e.target.value)}
          className="min-h-20 resize-none"
        />
      </div>

      {/* Article Type - Full Width Single Row */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Article Type</Label>
        <div className="grid grid-cols-5 lg:grid-cols-9 gap-3">
          {ARTICLE_TYPES.map(type => {
            const Icon = type.icon
            const isSelected = formData.article_type === type.id
            return (
              <Button
                key={type.id}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto py-4 px-3 flex-col gap-2 relative ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => handleInputChange('article_type', type.id)}
              >
                {type.id === 'ai-recommended' && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    AI
                  </div>
                )}
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center leading-tight">
                  {type.label}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout for Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Primary Keyword */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Primary Keyword</Label>
          <Input
            placeholder="Enter your primary SEO keyword"
            value={formData.primary_keyword}
            onChange={(e) => handleInputChange('primary_keyword', e.target.value)}
            className="h-12"
          />
        </div>

        {/* Secondary Keywords */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Secondary Keywords</Label>
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Input
                placeholder="Enter secondary keyword and press Enter"
                value={secondaryKeywordInput}
                onChange={(e) => setSecondaryKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSecondaryKeyword()}
                className="flex-1 h-12"
              />
              <Button 
                onClick={addSecondaryKeyword}
                disabled={formData.secondary_keywords.length >= 5 || !secondaryKeywordInput.trim()}
                className="h-12 px-6"
              >
                Add
              </Button>
            </div>

            {formData.secondary_keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg border border-border/20">
                {formData.secondary_keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1.5 flex items-center bg-background text-foreground border border-border hover:bg-muted">
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
            
            <p className="text-sm text-muted-foreground">
              {formData.secondary_keywords.length}/5 keywords used • Helps improve SEO ranking
            </p>
          </div>
        </div>
      </div>

      {/* Research Method - Full Width */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Research Method</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            variant={formData.research_method === 'ai-web-research' ? 'default' : 'outline'}
            className="h-16 justify-start p-6"
            onClick={() => handleInputChange('research_method', 'ai-web-research')}
          >
            <div className="flex items-center gap-4">
              <Search className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold text-base">AI Web Research</div>
                <div className="text-sm opacity-70">Recommended • Analyzes hundreds of articles</div>
              </div>
            </div>
          </Button>
          <Button
            variant={formData.research_method === 'custom-sources' ? 'default' : 'outline'}
            className="h-16 justify-start p-6"
            onClick={() => handleInputChange('research_method', 'custom-sources')}
          >
            <div className="flex items-center gap-4">
              <Database className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold text-base">Custom Sources</div>
                <div className="text-sm opacity-70">Upload files/links • Brand consistency</div>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-8">
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || !formData.topic.trim()}
          className="px-12 py-3 text-lg font-semibold"
        >
          Generate Article
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  const renderGeneratedContent = () => {
    if (!generatedContent) return null

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">생성된 콘텐츠</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedContent.content)}>
              <Copy className="w-4 h-4 mr-2" />
              복사
            </Button>
            <Button size="sm">
              <Send className="w-4 h-4 mr-2" />
              WordPress로 발행
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{generatedContent.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {generatedContent.content}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* 왼쪽 사이드바 - 10-Step 체크리스트 */}
      <div className={`w-80 bg-background fixed top-16 bottom-0 overflow-y-auto border-r border-border z-30 transition-[left] duration-300 ease-out ${
        sidebarOpen ? 'left-64' : 'left-16'
      }`}>
        <div className="pt-8 pb-6 px-6 h-full flex flex-col">
          <div className="mb-8 text-center">
            <h3 className="text-lg font-bold text-foreground mb-1">10-Step Article</h3>
            <p className="text-sm text-muted-foreground">Content Generator</p>
          </div>
          <div className="flex-1">
            {renderSidebar()}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className={`flex-1 min-h-screen transition-[margin] duration-300 ease-out ${
        sidebarOpen ? 'ml-[24rem]' : 'ml-[24rem]'
      }`}>
        <div className="p-8">
          {renderMainContent()}
        </div>
      </div>
    </div>
  )
} 