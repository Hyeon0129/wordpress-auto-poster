import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MultiStepContentGenerator from './components/MultiStepContentGenerator'
import KeywordAnalyzer from './components/KeywordAnalyzer'
import SeoOptimizer from './components/SeoOptimizer'
import Settings from './components/Settings'
import Login from './components/Login'
import { ApiStatusProvider } from './contexts/ApiStatusContext'
import './App.css'

// 보호된 라우트 컴포넌트
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

// 메인 레이아웃 컴포넌트
function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // 모바일에서는 기본적으로 사이드바 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/content" element={<MultiStepContentGenerator />} />
            <Route path="/keywords" element={<KeywordAnalyzer />} />
            <Route path="/seo" element={<SeoOptimizer />} />
            <Route path="/history" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">포스트 기록</h2><p className="text-muted-foreground mt-2">곧 출시될 예정입니다</p></div>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ApiStatusProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ApiStatusProvider>
  )
}

export default App

