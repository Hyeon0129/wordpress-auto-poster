import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Search, TrendingUp, 
  PenTool, Settings, LogOut, User, ChevronLeft,
  ChevronRight, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isCollapsed, onToggle, onSettingsClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState({ connected: false, checking: false });

  useEffect(() => {
    checkApiStatus();
    // 5분마다 API 상태 확인
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      setApiStatus(prev => ({ ...prev, checking: true }));
      
      const response = await fetch('/api/llm/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiStatus({ 
          connected: data.connected || false, 
          checking: false 
        });
      } else {
        setApiStatus({ connected: false, checking: false });
      }
    } catch (error) {
      console.error('API 상태 확인 실패:', error);
      setApiStatus({ connected: false, checking: false });
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      id: 'content',
      label: '콘텐츠 생성',
      icon: PenTool,
      path: '/content-generator'
    },
    {
      id: 'keyword',
      label: '키워드 분석',
      icon: Search,
      path: '/keyword-analysis'
    },
    {
      id: 'seo',
      label: 'SEO 최적화',
      icon: TrendingUp,
      path: '/seo-optimizer'
    },
    {
      id: 'posts',
      label: '포스트 기록',
      icon: FileText,
      path: '/post-history'
    }
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">WP</span>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">Auto</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* API 상태 표시 */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">API 상태</span>
            <div className="flex items-center">
              {apiStatus.checking ? (
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              ) : (
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
              )}
              <span className={`ml-2 text-xs ${
                apiStatus.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {apiStatus.checking ? '확인 중...' : (apiStatus.connected ? '연결됨' : '연결 안됨')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 사용자 정보 및 설정 */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && user && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.username || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onSettingsClick}
            className={`w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? '설정' : ''}
          >
            <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>설정</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? '로그아웃' : ''}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>로그아웃</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

