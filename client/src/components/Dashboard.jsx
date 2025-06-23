import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  PenTool, 
  FileText, 
  TrendingUp, 
  Users, 
  BarChart3,
  Calendar,
  Clock,
  Target,
  Zap,
  ArrowRight,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPosts: 0,
    thisMonth: 0,
    totalViews: 0,
    avgSeoScore: 0
  })

  const [recentPosts, setRecentPosts] = useState([])
  const [quickActions, setQuickActions] = useState([
    {
      title: '새 콘텐츠 생성',
      description: 'AI로 SEO 최적화된 콘텐츠 생성',
      icon: PenTool,
      path: '/content',
      color: 'bg-blue-500'
    },
    {
      title: '키워드 분석',
      description: '트렌딩 키워드 분석 및 연구',
      icon: Target,
      path: '/keywords',
      color: 'bg-green-500'
    },
    {
      title: 'SEO 최적화',
      description: '기존 콘텐츠 SEO 개선',
      icon: BarChart3,
      path: '/seo',
      color: 'bg-purple-500'
    },
    {
      title: '설정 관리',
      description: 'WordPress 및 API 설정',
      icon: Zap,
      path: '/settings',
      color: 'bg-orange-500'
    }
  ])

  useEffect(() => {
    // 데모 데이터 로드
    setStats({
      totalPosts: 47,
      thisMonth: 12,
      totalViews: 15420,
      avgSeoScore: 85
    })

    setRecentPosts([
      {
        id: 1,
        title: 'WordPress 블로그 최적화 가이드',
        status: 'published',
        createdAt: '2024-01-15',
        views: 1250,
        seoScore: 92
      },
      {
        id: 2,
        title: 'SEO 키워드 연구 방법론',
        status: 'draft',
        createdAt: '2024-01-14',
        views: 0,
        seoScore: 88
      },
      {
        id: 3,
        title: '콘텐츠 마케팅 전략 2024',
        status: 'published',
        createdAt: '2024-01-13',
        views: 890,
        seoScore: 85
      }
    ])
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">발행됨</Badge>
      case 'draft':
        return <Badge variant="secondary">초안</Badge>
      case 'scheduled':
        return <Badge variant="outline">예약됨</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            안녕하세요, {user?.username || '사용자'}님! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            오늘도 멋진 콘텐츠를 만들어보세요
          </p>
        </div>
        <Link to="/content">
          <Button size="lg" className="hidden sm:flex">
            <Plus className="mr-2 h-4 w-4" />
            새 콘텐츠 생성
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">총 포스트</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                이번 달 +{stats.thisMonth}개
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">총 조회수</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                지난 달 대비 +12%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">평균 SEO 점수</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.avgSeoScore}</div>
              <Progress value={stats.avgSeoScore} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">이번 달</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                목표: 20개 포스트
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 작업 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>
            자주 사용하는 기능들에 빠르게 접근하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} to={action.path}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 최근 포스트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>최근 포스트</CardTitle>
              <CardDescription>
                최근에 생성된 콘텐츠들을 확인하세요
              </CardDescription>
            </div>
            <Link to="/history">
              <Button variant="outline" size="sm">
                전체 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium">{post.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{post.createdAt}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{post.views.toLocaleString()} 조회</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>SEO {post.seoScore}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(post.status)}
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 팁 & 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>오늘의 팁</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">SEO 최적화 팁</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                제목에 타겟 키워드를 포함하고, 메타 디스크립션을 150-160자로 작성하세요.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100">콘텐츠 작성 팁</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                독자의 검색 의도를 파악하고, 문제 해결에 집중한 콘텐츠를 작성하세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

