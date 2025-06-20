import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Wand2, 
  Copy, 
  Download, 
  Send, 
  Eye,
  RefreshCw,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ContentGenerator() {
  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  
  const [formData, setFormData] = useState({
    keyword: '',
    contentType: 'blog_post',
    context: '',
    title: '',
    metaDescription: '',
    categories: [],
    tags: [],
    status: 'draft'
  })

  const contentTypes = [
    { value: 'blog_post', label: '일반 블로그 포스트' },
    { value: 'product_review', label: '제품 리뷰' },
    { value: 'how_to', label: 'How-to 가이드' }
  ]

  const handleGenerate = async () => {
    if (!formData.keyword.trim()) {
      alert('키워드를 입력해주세요.')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keyword: formData.keyword,
          content_type: formData.contentType,
          context: formData.context
        })
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedContent(data.content)
        // 제목 자동 추출 (첫 번째 # 헤딩)
        const titleMatch = data.content.match(/^# (.+)$/m)
        if (titleMatch && !formData.title) {
          setFormData(prev => ({ ...prev, title: titleMatch[1] }))
        }
      } else {
        alert(`콘텐츠 생성 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`콘텐츠 생성 중 오류: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async () => {
    if (!generatedContent) {
      alert('미리보기할 콘텐츠가 없습니다.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/content/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: generatedContent
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPreviewHtml(data.html_content)
      } else {
        alert(`미리보기 생성 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`미리보기 생성 중 오류: ${error.message}`)
    }
  }

  const handlePost = async () => {
    if (!generatedContent || !formData.title) {
      alert('제목과 콘텐츠를 확인해주세요.')
      return
    }

    setIsPosting(true)

    try {
      // 실제로는 선택된 워드프레스 사이트에 포스팅
      const response = await fetch('http://localhost:5000/api/wordpress/sites/1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: generatedContent,
          excerpt: formData.metaDescription,
          status: formData.status,
          categories: formData.categories,
          tags: formData.tags
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('포스트가 성공적으로 발행되었습니다!')
        // 폼 초기화
        setFormData({
          keyword: '',
          contentType: 'blog_post',
          context: '',
          title: '',
          metaDescription: '',
          categories: [],
          tags: [],
          status: 'draft'
        })
        setGeneratedContent('')
        setPreviewHtml('')
      } else {
        alert(`포스팅 실패: ${data.error}`)
      }
    } catch (error) {
      alert(`포스팅 중 오류: ${error.message}`)
    } finally {
      setIsPosting(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    alert('콘텐츠가 클립보드에 복사되었습니다.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">콘텐츠 생성</h1>
        <p className="text-muted-foreground">
          AI를 활용하여 고품질 블로그 콘텐츠를 자동으로 생성하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 설정 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5" />
              <span>콘텐츠 생성 설정</span>
            </CardTitle>
            <CardDescription>
              키워드와 설정을 입력하여 AI 콘텐츠를 생성하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 키워드 */}
            <div className="space-y-2">
              <Label htmlFor="keyword">메인 키워드 *</Label>
              <Input
                id="keyword"
                placeholder="예: 인공지능, 워드프레스, SEO"
                value={formData.keyword}
                onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>

            {/* 콘텐츠 타입 */}
            <div className="space-y-2">
              <Label htmlFor="contentType">콘텐츠 타입</Label>
              <Select 
                value={formData.contentType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 추가 컨텍스트 */}
            <div className="space-y-2">
              <Label htmlFor="context">추가 정보 (선택사항)</Label>
              <Textarea
                id="context"
                placeholder="특정 관점이나 추가하고 싶은 정보를 입력하세요"
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                rows={3}
              />
            </div>

            {/* 생성 버튼 */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !formData.keyword.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  콘텐츠 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  콘텐츠 생성
                </>
              )}
            </Button>

            {/* 포스트 설정 */}
            {generatedContent && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">포스트 설정</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="포스트 제목을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">메타 디스크립션</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="SEO를 위한 메타 디스크립션을 입력하세요"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">발행 상태</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">초안</SelectItem>
                      <SelectItem value="publish">즉시 발행</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 결과 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>생성된 콘텐츠</span>
              </div>
              {generatedContent && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePreview}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <Tabs defaultValue="markdown" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="markdown">마크다운</TabsTrigger>
                  <TabsTrigger value="preview">미리보기</TabsTrigger>
                </TabsList>
                
                <TabsContent value="markdown" className="mt-4">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="생성된 콘텐츠가 여기에 표시됩니다..."
                  />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 min-h-[400px] bg-card">
                    {previewHtml ? (
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Eye className="h-8 w-8 mx-auto mb-2" />
                          <p>미리보기 버튼을 클릭하여 HTML 미리보기를 확인하세요</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <Wand2 className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">AI 콘텐츠 생성 준비 완료</p>
                  <p>키워드를 입력하고 '콘텐츠 생성' 버튼을 클릭하세요</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼 */}
      {generatedContent && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>단어 수: {generatedContent.split(' ').length}</span>
                </Badge>
                <Badge variant="outline">
                  문자 수: {generatedContent.length}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
                <Button onClick={handlePost} disabled={isPosting}>
                  {isPosting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      포스팅 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      워드프레스에 포스팅
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

