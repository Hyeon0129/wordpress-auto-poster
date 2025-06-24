import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  TrendingUp, 
  FileText, 
  Users, 
  BarChart3,
  PenTool,
  Target,
  Globe,
  Zap,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Rocket
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalSites: 0,
    seoScore: 0
  })
  const [recentPosts, setRecentPosts] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // 시뮬레이션 데이터 (실제 환경에서는 API 호출)
      setTimeout(() => {
        setStats({
          totalPosts: 24,
          totalViews: 12500,
          totalSites: 3,
          seoScore: 85
        })
        
        setRecentPosts([
          {
            id: 1,
            title: "디지털 마케팅 트렌드 2024",
            status: "published",
            views: 1250,
            date: "2024-01-15",
            seoScore: 92
          },
          {
            id: 2,
            title: "AI 기반 콘텐츠 마케팅 전략",
            status: "draft",
            views: 0,
            date: "2024-01-14",
            seoScore: 88
          },
          {
            id: 3,
            title: "SEO 최적화 완벽 가이드",
            status: "published",
            views: 2100,
            date: "2024-01-13",
            seoScore: 95
          }
        ])

        setChartData([
          { name: '1월', posts: 4, views: 2400 },
          { name: '2월', posts: 6, views: 3200 },
          { name: '3월', posts: 8, views: 4100 },
          { name: '4월', posts: 12, views: 5800 },
          { name: '5월', posts: 18, views: 7200 },
          { name: '6월', posts: 24, views: 12500 }
        ])
        
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 text-white group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${color}-400 to-${color}-600`} />
    </Card>
  )

  const QuickActionCard = ({ title, description, icon: Icon, action, color = "blue" }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={action}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br from-${color}-100 to-${color}-200 group-hover:from-${color}-200 group-hover:to-${color}-300 transition-all duration-300`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
              시작하기 <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 로드하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            환영합니다
          </h1>
          <p className="text-slate-300 text-lg mb-6">
            효율적인 콘텐츠 관리로 성공을 만들어가세요
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
              <Sparkles className="mr-2 h-4 w-4" />
              새 콘텐츠 생성
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Rocket className="mr-2 h-4 w-4" />
              튜토리얼 보기
            </Button>
          </div>
        </div>
        
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-3 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 포스트"
          value={stats.totalPosts}
          icon={FileText}
          trend="+12% 이번 달"
          color="blue"
        />
        <StatCard
          title="총 조회수"
          value={stats.totalViews.toLocaleString()}
          icon={BarChart3}
          trend="+23% 이번 달"
          color="green"
        />
        <StatCard
          title="연결된 사이트"
          value={stats.totalSites}
          icon={Globe}
          color="purple"
        />
        <StatCard
          title="평균 SEO 점수"
          value={`${stats.seoScore}점`}
          icon={Target}
          trend="+5점 향상"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 성과 차트 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>월별 성과</span>
              </CardTitle>
              <CardDescription>
                포스트 수와 조회수 추이를 확인해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="posts" fill="#3b82f6" name="포스트 수" />
                    <Line yAxisId="right" type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} name="조회수" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 포스트 기록 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-500" />
                <span>포스트 기록</span>
              </CardTitle>
              <CardDescription>
                실제로 포스팅한 항목들을 확인해보세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">{post.title}</h4>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status === 'published' ? '발행됨' : '초안'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(post.date).toLocaleDateString('ko-KR')}
                    </span>
                    <span>{post.views.toLocaleString()} 조회</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">SEO 점수</span>
                      <div className="flex items-center space-x-1">
                        <Progress value={post.seoScore} className="w-16 h-2" />
                        <span className="text-xs font-medium text-gray-700">{post.seoScore}</span>
                      </div>
                    </div>
                    {post.seoScore >= 90 && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {post.seoScore < 70 && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full mt-4">
                모든 포스트 보기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 성능 개요 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <span>이번 달 성과</span>
          </CardTitle>
          <CardDescription>
            콘텐츠 성과와 SEO 개선 현황을 확인해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">24</div>
              <div className="text-sm text-blue-700">생성된 포스트</div>
              <div className="text-xs text-blue-600 mt-1">+20% 증가</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
              <div className="text-sm text-green-700">평균 SEO 점수</div>
              <div className="text-xs text-green-600 mt-1">+5점 향상</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">12.5K</div>
              <div className="text-sm text-purple-700">총 조회수</div>
              <div className="text-xs text-purple-600 mt-1">+23% 증가</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

