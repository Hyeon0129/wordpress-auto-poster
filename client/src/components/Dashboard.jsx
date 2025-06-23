import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FileText, Eye, Globe, TrendingUp, Calendar, Clock, 
  Target, Award, ArrowUp, ArrowDown, Activity
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_posts: 0,
    total_views: 0,
    connected_sites: 0,
    avg_seo_score: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 가져오기
      const statsResponse = await fetch('/api/posts/statistics/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.statistics);
      }
      
      // 최근 포스트 가져오기
      const postsResponse = await fetch('/api/posts?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setRecentPosts(postsData.posts);
      }
      
      // 차트 데이터 생성 (모의 데이터)
      const monthlyData = generateMonthlyData();
      setChartData(monthlyData);
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
    return months.map(month => ({
      month,
      posts: Math.floor(Math.random() * 20) + 5,
      views: Math.floor(Math.random() * 1000) + 200,
      seo_score: Math.floor(Math.random() * 30) + 70
    }));
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600", 
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600"
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const ChartCard = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl h-96"></div>
              <div className="bg-white rounded-xl h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">콘텐츠 성과와 주요 지표를 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="총 포스트"
            value={stats.total_posts}
            icon={FileText}
            trend="up"
            trendValue="+12%"
            color="blue"
          />
          <StatCard
            title="총 조회수"
            value={stats.total_views.toLocaleString()}
            icon={Eye}
            trend="up"
            trendValue="+8%"
            color="green"
          />
          <StatCard
            title="연결된 사이트"
            value={stats.connected_sites || 1}
            icon={Globe}
            trend="up"
            trendValue="+1"
            color="purple"
          />
          <StatCard
            title="평균 SEO 점수"
            value={`${stats.avg_seo_score}점`}
            icon={TrendingUp}
            trend="up"
            trendValue="+5점"
            color="orange"
          />
        </div>

        {/* 차트 및 정보 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 월별 성과 차트 (col-8) */}
          <div className="lg:col-span-2">
            <ChartCard title="월별 성과 분석">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="posts" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="포스트 수"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="조회수"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* 중요 정보 (col-4) */}
          <div className="space-y-6">
            {/* 이번 달 목표 */}
            <ChartCard title="이번 달 목표">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">포스트 작성</span>
                  <span className="text-sm font-medium">15/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SEO 점수</span>
                  <span className="text-sm font-medium">85/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
            </ChartCard>

            {/* 빠른 통계 */}
            <ChartCard title="빠른 통계">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">이번 주</span>
                  </div>
                  <span className="text-sm font-medium">3 포스트</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">평균 작성 시간</span>
                  </div>
                  <span className="text-sm font-medium">25분</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Target className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-600">키워드 적중률</span>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* SEO 성과 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="SEO 점수 추이">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="seo_score" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  name="SEO 점수"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="콘텐츠 유형별 분포">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: '블로그', value: 45, color: '#3b82f6' },
                    { name: '기사', value: 30, color: '#10b981' },
                    { name: '튜토리얼', value: 15, color: '#f59e0b' },
                    { name: '리뷰', value: 10, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: '블로그', value: 45, color: '#3b82f6' },
                    { name: '기사', value: 30, color: '#10b981' },
                    { name: '튜토리얼', value: 15, color: '#f59e0b' },
                    { name: '리뷰', value: 10, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

