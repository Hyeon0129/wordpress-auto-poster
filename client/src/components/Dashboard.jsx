import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Clock,
  Plus,
  Eye,
  Edit,
  Calendar
} from 'lucide-react'

// 샘플 데이터
const statsData = [
  { name: '월', posts: 12, views: 2400 },
  { name: '화', posts: 8, views: 1800 },
  { name: '수', posts: 15, views: 3200 },
  { name: '목', posts: 10, views: 2800 },
  { name: '금', posts: 18, views: 4100 },
  { name: '토', posts: 6, views: 1500 },
  { name: '일', posts: 9, views: 2200 }
]

const categoryData = [
  { name: '기술', value: 35, color: '#8884d8' },
  { name: '라이프스타일', value: 25, color: '#82ca9d' },
  { name: '비즈니스', value: 20, color: '#ffc658' },
  { name: '기타', value: 20, color: '#ff7300' }
]

const recentPosts = [
  {
    id: 1,
    title: 'AI 기반 콘텐츠 마케팅 전략',
    status: 'published',
    views: 1250,
    date: '2024-06-20',
    category: '기술'
  },
  {
    id: 2,
    title: '워드프레스 SEO 최적화 가이드',
    status: 'draft',
    views: 0,
    date: '2024-06-19',
    category: '기술'
  },
  {
    id: 3,
    title: '디지털 마케팅 트렌드 2024',
    status: 'published',
    views: 890,
    date: '2024-06-18',
    category: '비즈니스'
  }
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    avgEngagement: 0,
    scheduledPosts: 0
  })

  useEffect(() => {
    // 실제로는 API에서 데이터를 가져옴
    setStats({
      totalPosts: 156,
      totalViews: 45280,
      avgEngagement: 3.2,
      scheduledPosts: 8
    })
  }, [])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground">
            WordPress Auto Poster 현황을 한눈에 확인하세요
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>새 포스트 생성</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 포스트</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              +12% 지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% 지난 주 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 참여도</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% 지난 주 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예약된 포스트</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
            <p className="text-xs text-muted-foreground">
              다음 7일 내
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 포스트 및 조회수 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle>주간 포스트 및 조회수</CardTitle>
            <CardDescription>
              최근 7일간의 포스트 발행 및 조회수 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#8884d8" name="포스트" />
                <Bar dataKey="views" fill="#82ca9d" name="조회수" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 카테고리별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 포스트 분포</CardTitle>
            <CardDescription>
              카테고리별 포스트 비율
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>최근 포스트</CardTitle>
          <CardDescription>
            최근에 생성되거나 수정된 포스트 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{post.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{post.date}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{post.views.toLocaleString()} 조회</span>
                    </span>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(post.status)}
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

