import os
import json
from typing import List, Dict, Optional
from datetime import datetime
import requests
from openai import OpenAI

class LLMService:
    """LLM 제공자 관리 서비스"""
    
    def __init__(self):
        # 간단한 메모리 기반 저장소 (실제 환경에서는 데이터베이스 사용)
        self.providers_store = {}
        self.user_providers = {}
    
    def get_user_providers(self, user_id: int) -> List[Dict]:
        """사용자의 LLM 제공자 목록 조회"""
        user_providers = self.user_providers.get(user_id, [])
        
        # 환경변수에서 OpenAI API 키가 있으면 기본 제공자 추가
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if openai_api_key and not any(p.get('provider_type') == 'openai' for p in user_providers):
            default_openai = {
                'id': 0,
                'name': 'Default OpenAI',
                'provider_type': 'openai',
                'model_name': 'gpt-3.5-turbo',
                'is_active': len(user_providers) == 0,  # 다른 제공자가 없으면 활성화
                'status': 'connected',
                'created_at': datetime.utcnow().isoformat()
            }
            user_providers = [default_openai] + user_providers
        
        return user_providers
    
    def add_provider(self, user_id: int, name: str, provider_type: str, 
                    api_key: Optional[str], base_url: Optional[str], 
                    model_name: str, is_active: bool = False) -> Dict:
        """새 LLM 제공자 추가"""
        
        if user_id not in self.user_providers:
            self.user_providers[user_id] = []
        
        # 새 제공자 ID 생성
        provider_id = len(self.user_providers[user_id]) + 1
        
        # 활성화 설정 시 다른 제공자들 비활성화
        if is_active:
            for provider in self.user_providers[user_id]:
                provider['is_active'] = False
        
        provider = {
            'id': provider_id,
            'name': name,
            'provider_type': provider_type,
            'api_key': api_key,
            'base_url': base_url,
            'model_name': model_name,
            'is_active': is_active,
            'status': 'disconnected',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # 연결 테스트
        try:
            test_result = self.test_connection(provider_type, api_key, base_url, model_name)
            provider['status'] = 'connected' if test_result['success'] else 'disconnected'
        except:
            provider['status'] = 'disconnected'
        
        self.user_providers[user_id].append(provider)
        return provider
    
    def update_provider(self, provider_id: int, user_id: int, name: str, 
                       provider_type: str, api_key: Optional[str], 
                       base_url: Optional[str], model_name: str, 
                       is_active: bool = False) -> Dict:
        """LLM 제공자 정보 수정"""
        
        if user_id not in self.user_providers:
            raise ValueError("사용자의 제공자를 찾을 수 없습니다.")
        
        provider_found = False
        for provider in self.user_providers[user_id]:
            if provider['id'] == provider_id:
                # 활성화 설정 시 다른 제공자들 비활성화
                if is_active:
                    for p in self.user_providers[user_id]:
                        p['is_active'] = False
                
                provider.update({
                    'name': name,
                    'provider_type': provider_type,
                    'api_key': api_key,
                    'base_url': base_url,
                    'model_name': model_name,
                    'is_active': is_active,
                    'updated_at': datetime.utcnow().isoformat()
                })
                
                # 연결 테스트
                try:
                    test_result = self.test_connection(provider_type, api_key, base_url, model_name)
                    provider['status'] = 'connected' if test_result['success'] else 'disconnected'
                except:
                    provider['status'] = 'disconnected'
                
                provider_found = True
                return provider
        
        if not provider_found:
            raise ValueError("제공자를 찾을 수 없습니다.")
    
    def delete_provider(self, provider_id: int, user_id: int):
        """LLM 제공자 삭제"""
        if user_id not in self.user_providers:
            raise ValueError("사용자의 제공자를 찾을 수 없습니다.")
        
        self.user_providers[user_id] = [
            p for p in self.user_providers[user_id] 
            if p['id'] != provider_id
        ]
    
    def activate_provider(self, provider_id: int, user_id: int):
        """LLM 제공자 활성화"""
        if user_id not in self.user_providers:
            raise ValueError("사용자의 제공자를 찾을 수 없습니다.")
        
        # 모든 제공자 비활성화
        for provider in self.user_providers[user_id]:
            provider['is_active'] = False
        
        # 선택된 제공자 활성화
        for provider in self.user_providers[user_id]:
            if provider['id'] == provider_id:
                provider['is_active'] = True
                break
    
    def get_active_provider(self, user_id: int) -> Optional[Dict]:
        """현재 활성화된 LLM 제공자 조회"""
        providers = self.get_user_providers(user_id)
        
        for provider in providers:
            if provider.get('is_active'):
                return provider
        
        return None
    
    def test_connection(self, provider_type: str, api_key: Optional[str], 
                       base_url: Optional[str], model_name: str) -> Dict:
        """LLM 연결 테스트"""
        
        try:
            if provider_type == 'openai':
                if not api_key:
                    # 환경변수에서 API 키 확인
                    api_key = os.getenv('OPENAI_API_KEY')
                    if not api_key:
                        return {
                            'success': False,
                            'message': 'OpenAI API 키가 필요합니다.'
                        }
                
                # OpenAI API 테스트
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": "Hello"}],
                    max_tokens=5
                )
                
                return {
                    'success': True,
                    'message': 'OpenAI 연결 성공',
                    'model': model_name
                }
                
            elif provider_type == 'ollama':
                # Ollama API 테스트
                if not base_url:
                    base_url = 'http://localhost:11434'
                
                # Ollama 서버 상태 확인
                response = requests.get(f"{base_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    models = response.json().get('models', [])
                    model_names = [m['name'] for m in models]
                    
                    if model_name in model_names:
                        return {
                            'success': True,
                            'message': f'Ollama 연결 성공 - {model_name} 모델 사용 가능',
                            'available_models': model_names
                        }
                    else:
                        return {
                            'success': False,
                            'message': f'{model_name} 모델을 찾을 수 없습니다. 사용 가능한 모델: {", ".join(model_names)}'
                        }
                else:
                    return {
                        'success': False,
                        'message': 'Ollama 서버에 연결할 수 없습니다.'
                    }
            
            elif provider_type == 'anthropic':
                if not api_key:
                    return {
                        'success': False,
                        'message': 'Anthropic API 키가 필요합니다.'
                    }
                
                # Anthropic API 테스트 (간단한 구현)
                headers = {
                    'x-api-key': api_key,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
                
                data = {
                    'model': model_name,
                    'max_tokens': 5,
                    'messages': [{'role': 'user', 'content': 'Hello'}]
                }
                
                response = requests.post(
                    'https://api.anthropic.com/v1/messages',
                    headers=headers,
                    json=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    return {
                        'success': True,
                        'message': 'Anthropic 연결 성공',
                        'model': model_name
                    }
                else:
                    return {
                        'success': False,
                        'message': f'Anthropic API 오류: {response.status_code}'
                    }
            
            else:
                return {
                    'success': False,
                    'message': f'지원하지 않는 제공자 타입: {provider_type}'
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'message': '연결 시간 초과'
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'message': '서버에 연결할 수 없습니다'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'연결 테스트 실패: {str(e)}'
            }
    
    def get_client(self, user_id: int):
        """활성화된 제공자의 클라이언트 반환"""
        provider = self.get_active_provider(user_id)
        
        if not provider:
            # 환경변수에서 OpenAI API 키 확인
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if openai_api_key:
                return OpenAI(api_key=openai_api_key), 'gpt-3.5-turbo'
            else:
                raise ValueError("활성화된 LLM 제공자가 없습니다.")
        
        if provider['provider_type'] == 'openai':
            api_key = provider.get('api_key') or os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OpenAI API 키가 설정되지 않았습니다.")
            
            return OpenAI(api_key=api_key), provider['model_name']
        
        elif provider['provider_type'] == 'ollama':
            base_url = provider.get('base_url', 'http://localhost:11434/v1')
            return OpenAI(
                base_url=base_url,
                api_key='ollama'  # Ollama는 API 키가 필요하지 않음
            ), provider['model_name']
        
        else:
            raise ValueError(f"지원하지 않는 제공자 타입: {provider['provider_type']}")

