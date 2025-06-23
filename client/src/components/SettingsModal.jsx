import React, { useState, useEffect } from 'react';
import { 
  X, Save, Settings, Globe, Key, User, Palette, 
  Bell, Shield, Database, Check, AlertCircle,
  Eye, EyeOff, Plus, Trash2, Edit3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user, updateProfile } = useAuth();

  // 설정 상태
  const [settings, setSettings] = useState({
    // 일반 설정
    theme: 'system',
    language: 'ko',
    notifications: true,
    
    // LLM 설정
    llmConfigs: [],
    
    // WordPress 설정
    wordpressConfigs: [],
    
    // 사용자 정보
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // 사용자 정보 설정
      if (user) {
        setSettings(prev => ({
          ...prev,
          username: user.username || '',
          email: user.email || ''
        }));
      }

      // LLM 설정 로드
      const llmResponse = await fetch('/api/llm/configs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        setSettings(prev => ({
          ...prev,
          llmConfigs: llmData.configs || []
        }));
      }

      // WordPress 설정 로드
      const wpResponse = await fetch('/api/wordpress/sites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (wpResponse.ok) {
        const wpData = await wpResponse.json();
        setSettings(prev => ({
          ...prev,
          wordpressConfigs: wpData.sites || []
        }));
      }

      // 사용자 설정 로드
      const userSettingsResponse = await fetch('/api/settings/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (userSettingsResponse.ok) {
        const userSettingsData = await userSettingsResponse.json();
        setSettings(prev => ({
          ...prev,
          theme: userSettingsData.settings?.theme || 'system',
          language: userSettingsData.settings?.language || 'ko',
          notifications: userSettingsData.settings?.notifications !== false
        }));
      }

    } catch (error) {
      console.error('설정 로드 실패:', error);
      setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // 사용자 설정 저장
      const userSettingsResponse = await fetch('/api/settings/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          theme: settings.theme,
          language: settings.language,
          notifications: settings.notifications
        })
      });

      if (userSettingsResponse.ok) {
        setMessage({ type: 'success', text: '설정이 저장되었습니다.' });
        
        // 테마 적용
        applyTheme(settings.theme);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        throw new Error('설정 저장 실패');
      }

    } catch (error) {
      console.error('설정 저장 실패:', error);
      setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // 시스템 설정 따르기
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const addLLMConfig = () => {
    const newConfig = {
      id: Date.now().toString(),
      name: '',
      provider: 'OpenAI',
      api_key: '',
      model: 'gpt-3.5-turbo',
      is_active: false
    };
    
    setSettings(prev => ({
      ...prev,
      llmConfigs: [...prev.llmConfigs, newConfig]
    }));
  };

  const updateLLMConfig = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      llmConfigs: prev.llmConfigs.map(config =>
        config.id === id ? { ...config, [field]: value } : config
      )
    }));
  };

  const deleteLLMConfig = (id) => {
    setSettings(prev => ({
      ...prev,
      llmConfigs: prev.llmConfigs.filter(config => config.id !== id)
    }));
  };

  const saveLLMConfig = async (config) => {
    try {
      const response = await fetch('/api/llm/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'LLM 설정이 저장되었습니다.' });
        loadSettings(); // 설정 다시 로드
      } else {
        throw new Error('LLM 설정 저장 실패');
      }
    } catch (error) {
      console.error('LLM 설정 저장 실패:', error);
      setMessage({ type: 'error', text: 'LLM 설정 저장에 실패했습니다.' });
    }
  };

  const addWordPressConfig = () => {
    const newConfig = {
      id: Date.now().toString(),
      name: '',
      url: '',
      username: '',
      password: '',
      is_active: false
    };
    
    setSettings(prev => ({
      ...prev,
      wordpressConfigs: [...prev.wordpressConfigs, newConfig]
    }));
  };

  const updateWordPressConfig = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      wordpressConfigs: prev.wordpressConfigs.map(config =>
        config.id === id ? { ...config, [field]: value } : config
      )
    }));
  };

  const deleteWordPressConfig = (id) => {
    setSettings(prev => ({
      ...prev,
      wordpressConfigs: prev.wordpressConfigs.filter(config => config.id !== id)
    }));
  };

  const saveWordPressConfig = async (config) => {
    try {
      const response = await fetch('/api/wordpress/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'WordPress 설정이 저장되었습니다.' });
        loadSettings(); // 설정 다시 로드
      } else {
        throw new Error('WordPress 설정 저장 실패');
      }
    } catch (error) {
      console.error('WordPress 설정 저장 실패:', error);
      setMessage({ type: 'error', text: 'WordPress 설정 저장에 실패했습니다.' });
    }
  };

  const updatePassword = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: settings.currentPassword,
          new_password: settings.newPassword
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
        setSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const data = await response.json();
        throw new Error(data.detail || '비밀번호 변경 실패');
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', name: '일반', icon: Settings },
    { id: 'llm', name: 'LLM 설정', icon: Key },
    { id: 'wordpress', name: 'WordPress', icon: Globe },
    { id: 'account', name: 'Account', icon: User }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 사이드바 */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* 메시지 */}
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg flex items-center ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* 일반 설정 */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">테마</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: '라이트 모드' },
                        { value: 'dark', label: '다크 모드' },
                        { value: 'system', label: '시스템' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSettings(prev => ({ ...prev, theme: option.value }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            settings.theme === option.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">언어</h3>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">알림</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        콘텐츠 생성 완료 시 알림 받기
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* LLM 설정 */}
              {activeTab === 'llm' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">LLM 설정</h3>
                    <button
                      onClick={addLLMConfig}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      LLM 추가
                    </button>
                  </div>

                  <div className="space-y-4">
                    {settings.llmConfigs.map((config) => (
                      <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              이름
                            </label>
                            <input
                              type="text"
                              value={config.name}
                              onChange={(e) => updateLLMConfig(config.id, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="설정 이름"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              제공자
                            </label>
                            <select
                              value={config.provider}
                              onChange={(e) => updateLLMConfig(config.id, 'provider', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="OpenAI">OpenAI</option>
                              <option value="Anthropic">Anthropic</option>
                              <option value="Google">Google</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API 키
                          </label>
                          <input
                            type="password"
                            value={config.api_key}
                            onChange={(e) => updateLLMConfig(config.id, 'api_key', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="sk-..."
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.is_active}
                              onChange={(e) => updateLLMConfig(config.id, 'is_active', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">활성화</span>
                          </label>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveLLMConfig(config)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => deleteLLMConfig(config.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WordPress 설정 */}
              {activeTab === 'wordpress' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">WordPress 사이트</h3>
                    <button
                      onClick={addWordPressConfig}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      사이트 추가
                    </button>
                  </div>

                  <div className="space-y-4">
                    {settings.wordpressConfigs.map((config) => (
                      <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              사이트 이름
                            </label>
                            <input
                              type="text"
                              value={config.name}
                              onChange={(e) => updateWordPressConfig(config.id, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="내 블로그"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              사이트 URL
                            </label>
                            <input
                              type="url"
                              value={config.url}
                              onChange={(e) => updateWordPressConfig(config.id, 'url', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              사용자명
                            </label>
                            <input
                              type="text"
                              value={config.username}
                              onChange={(e) => updateWordPressConfig(config.id, 'username', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="WordPress 사용자명"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              비밀번호
                            </label>
                            <input
                              type="password"
                              value={config.password}
                              onChange={(e) => updateWordPressConfig(config.id, 'password', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="WordPress 비밀번호"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.is_active}
                              onChange={(e) => updateWordPressConfig(config.id, 'is_active', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">활성화</span>
                          </label>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveWordPressConfig(config)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => deleteWordPressConfig(config.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 계정 설정 */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          사용자명
                        </label>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이메일
                        </label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 비밀번호
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={settings.currentPassword}
                            onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          새 비밀번호
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={settings.newPassword}
                            onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          새 비밀번호 확인
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={settings.confirmPassword}
                            onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={updatePassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        비밀번호 변경
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

