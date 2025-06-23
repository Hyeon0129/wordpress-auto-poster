import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Calendar, 
  Clock, 
  Eye, 
  Edit, 
  Trash2,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

// 샘플 포스팅 기록 데이터
const samplePosts = [
  {
    id: 1,
    title: 'AI 기반 콘텐츠 마케팅 전략 완벽 가이드',
    status: 'published',
    views: 1250,
    date: '2024-06-20T10:30:00',
    category: '기술',
    site: '내 블로그',
    url: 'https://myblog.com/ai-content-marketing-guide',
    excerpt: 'AI를 활용한 콘텐츠 마케팅의 모든 것을 알아보세요...'
  },
  {
    id: 2,
    title: '워드프레스 SEO 최적화 완벽 가이드',
    status: 'draft',
    views: 0,
    date: '2024-06-19T15:45:00',
    category: '기술',
    site: '내 블로그',
    url: null,
    excerpt: '워드프레스 사이트의 SEO를 향상시키는 방법...'
  },
  {
    id: 3,
    title: '2024년 디지털 마케팅 트렌드',
    status: 'published',
    views: 890,
    date: '2024-06-18T09:15:00',
    category: '비즈니스',
    site: '내 블로그',
    url: 'https://myblog.com/digital-marketing-trends-2024',
    excerpt: '올해 주목해야 할 디지털 마케팅 트렌드를 소개합니다...'
  },
  {
    id: 4,
    title: '블로그 수익화 전략 A to Z',
    status: 'scheduled',
    views: 0,
    date: '2024-06-21T08:00:00',
    category: '비즈니스',
    site: '내 블로그',
    url: null,
    excerpt: '블로그로 수익을 창출하는 다양한 방법들...'
  }
]

export default function PostHistory() {
  const [posts, setPosts] = useState(samplePosts)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">게시됨</Badge>
      case 'draft':
        return <Badge variant="secondary">초안</Badge>
      case 'scheduled':
        return <Badge variant="outline">예약됨</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleDelete = (postId) => {
    if (confirm('정말로 이 포스트를 삭제하시겠습니까?')) {
      setPosts(prev => prev.filter(post => post.id !== postId))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">포스팅 기록</h1>
        <p className="text-muted-foreground">
          생성되고 발행된 모든 포스트를 관리하세요
        </p>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>필터 및 검색</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제목 또는 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="published">게시됨</SelectItem>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="scheduled">예약됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 카테고리</SelectItem>
                  <SelectItem value="기술">기술</SelectItem>
                  <SelectItem value="비즈니스">비즈니스</SelectItem>
                  <SelectItem value="라이프스타일">라이프스타일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 포스트 목록 */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {post.title}
                      </h3>
                      {getStatusBadge(post.status)}
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views.toLocaleString()} 조회</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>사이트: {post.site}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {post.url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(post.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  포스트가 없습니다
                </h3>
                <p className="text-muted-foreground">
                  검색 조건에 맞는 포스트를 찾을 수 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 통계 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>포스팅 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {posts.length}
              </div>
              <div className="text-sm text-muted-foreground">총 포스트</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {posts.filter(p => p.status === 'published').length}
              </div>
              <div className="text-sm text-muted-foreground">게시됨</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {posts.filter(p => p.status === 'draft').length}
              </div>
              <div className="text-sm text-muted-foreground">초안</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {posts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">총 조회수</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

