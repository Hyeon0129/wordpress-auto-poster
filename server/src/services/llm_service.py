import os
import json
from typing import Dict, List, Optional
from fastapi import HTTPException
import openai
from pydantic import BaseModel

class LLMConfig(BaseModel):
    name: str
    provider: str
    api_key: str
    model: str
    is_active: bool = True

class LLMService:
    def __init__(self):
        self.configs: Dict[str, LLMConfig] = {}
        self.load_configs()
    
    def load_configs(self):
        """환경 변수와 저장된 설정에서 LLM 설정 로드"""
        # 환경 변수에서 OpenAI API 키 확인
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key and openai_key.startswith('sk-'):
            self.configs['openai_default'] = LLMConfig(
                name="OpenAI GPT-4",
                provider="OpenAI",
                api_key=openai_key,
                model="gpt-4",
                is_active=True
            )
    
    def add_llm_config(self, config: LLMConfig) -> Dict:
        """새로운 LLM 설정 추가"""
        try:
            # API 키 유효성 검증
            if not self.validate_api_key(config.provider, config.api_key):
                raise HTTPException(status_code=400, detail="유효하지 않은 API 키입니다.")
            
            # 설정 저장
            config_id = f"{config.provider.lower()}_{len(self.configs)}"
            self.configs[config_id] = config
            
            # 파일에 저장
            self.save_configs()
            
            return {
                "success": True,
                "message": "LLM 설정이 성공적으로 추가되었습니다.",
                "config_id": config_id
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 추가 실패: {str(e)}")
    
    def update_llm_config(self, config_id: str, config: LLMConfig) -> Dict:
        """기존 LLM 설정 업데이트"""
        try:
            if config_id not in self.configs:
                raise HTTPException(status_code=404, detail="설정을 찾을 수 없습니다.")
            
            # API 키 유효성 검증
            if not self.validate_api_key(config.provider, config.api_key):
                raise HTTPException(status_code=400, detail="유효하지 않은 API 키입니다.")
            
            self.configs[config_id] = config
            self.save_configs()
            
            return {
                "success": True,
                "message": "LLM 설정이 성공적으로 업데이트되었습니다."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 업데이트 실패: {str(e)}")
    
    def delete_llm_config(self, config_id: str) -> Dict:
        """LLM 설정 삭제"""
        try:
            if config_id not in self.configs:
                raise HTTPException(status_code=404, detail="설정을 찾을 수 없습니다.")
            
            del self.configs[config_id]
            self.save_configs()
            
            return {
                "success": True,
                "message": "LLM 설정이 성공적으로 삭제되었습니다."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"설정 삭제 실패: {str(e)}")
    
    def get_llm_configs(self) -> List[Dict]:
        """모든 LLM 설정 조회"""
        configs_list = []
        for config_id, config in self.configs.items():
            configs_list.append({
                "id": config_id,
                "name": config.name,
                "provider": config.provider,
                "model": config.model,
                "is_active": config.is_active,
                "api_key_masked": self.mask_api_key(config.api_key)
            })
        return configs_list
    
    def validate_api_key(self, provider: str, api_key: str) -> bool:
        """API 키 유효성 검증"""
        try:
            if provider.lower() == "openai":
                if not api_key.startswith('sk-'):
                    return False
                
                # OpenAI API 키 테스트
                client = openai.OpenAI(api_key=api_key)
                response = client.models.list()
                return True
            
            # 다른 제공자들에 대한 검증 로직 추가 가능
            return True
            
        except Exception as e:
            print(f"API 키 검증 실패: {str(e)}")
            return False
    
    def mask_api_key(self, api_key: str) -> str:
        """API 키 마스킹"""
        if len(api_key) <= 8:
            return "*" * len(api_key)
        return api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
    
    def save_configs(self):
        """설정을 파일에 저장"""
        try:
            configs_data = {}
            for config_id, config in self.configs.items():
                configs_data[config_id] = {
                    "name": config.name,
                    "provider": config.provider,
                    "api_key": config.api_key,
                    "model": config.model,
                    "is_active": config.is_active
                }
            
            os.makedirs("data", exist_ok=True)
            with open("data/llm_configs.json", "w", encoding="utf-8") as f:
                json.dump(configs_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"설정 저장 실패: {str(e)}")
    
    def load_saved_configs(self):
        """저장된 설정 파일에서 로드"""
        try:
            if os.path.exists("data/llm_configs.json"):
                with open("data/llm_configs.json", "r", encoding="utf-8") as f:
                    configs_data = json.load(f)
                
                for config_id, config_data in configs_data.items():
                    self.configs[config_id] = LLMConfig(**config_data)
        except Exception as e:
            print(f"설정 로드 실패: {str(e)}")
    
    def get_active_config(self) -> Optional[LLMConfig]:
        """활성화된 LLM 설정 반환"""
        for config in self.configs.values():
            if config.is_active:
                return config
        return None
    
    def generate_content(self, prompt: str, **kwargs) -> Dict:
        """콘텐츠 생성"""
        active_config = self.get_active_config()
        if not active_config:
            raise HTTPException(status_code=400, detail="활성화된 LLM 설정이 없습니다.")
        
        try:
            if active_config.provider.lower() == "openai":
                client = openai.OpenAI(api_key=active_config.api_key)
                
                response = client.chat.completions.create(
                    model=active_config.model,
                    messages=[
                        {"role": "system", "content": "당신은 전문적인 콘텐츠 작성자입니다. SEO에 최적화된 고품질 콘텐츠를 작성해주세요."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=kwargs.get('max_tokens', 2000),
                    temperature=kwargs.get('temperature', 0.7)
                )
                
                content = response.choices[0].message.content
                
                return {
                    "success": True,
                    "content": content,
                    "model_used": active_config.model,
                    "provider": active_config.provider
                }
            
            else:
                # 다른 제공자들에 대한 구현
                raise HTTPException(status_code=400, detail="지원하지 않는 LLM 제공자입니다.")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"콘텐츠 생성 실패: {str(e)}")

# 전역 LLM 서비스 인스턴스
llm_service = LLMService()

