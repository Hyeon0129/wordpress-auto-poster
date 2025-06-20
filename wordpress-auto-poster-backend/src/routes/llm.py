from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from openai import OpenAI
import json

llm_bp = Blueprint('llm', __name__)

@llm_bp.route('/providers', methods=['GET'])
@jwt_required()
def get_llm_providers():
    """사용자의 LLM 제공자 설정 조회"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 조회
        # 현재는 예시 데이터 반환
        providers = [
            {
                'id': 1,
                'name': 'Ollama',
                'provider_type': 'ollama',
                'base_url': 'http://localhost:11434/v1',
                'model_name': 'qwen2.5:32b',
                'is_active': True,
                'status': 'connected',
                'created_at': '2024-06-20T10:00:00Z'
            },
            {
                'id': 2,
                'name': 'OpenAI',
                'provider_type': 'openai',
                'model_name': 'gpt-3.5-turbo',
                'is_active': False,
                'status': 'not_configured',
                'created_at': '2024-06-20T10:00:00Z'
            }
        ]
        
        return jsonify({'providers': providers}), 200
        
    except Exception as e:
        return jsonify({'error': f'LLM 제공자 조회 중 오류: {str(e)}'}), 500

@llm_bp.route('/providers', methods=['POST'])
@jwt_required()
def add_llm_provider():
    """LLM 제공자 추가"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        name = data.get('name', '').strip()
        provider_type = data.get('provider_type', '').strip()
        api_key = data.get('api_key', '').strip()
        base_url = data.get('base_url', '').strip()
        model_name = data.get('model_name', '').strip()
        
        if not name or not provider_type:
            return jsonify({'error': '이름과 제공자 타입을 입력해주세요.'}), 400
        
        if provider_type not in ['openai', 'ollama']:
            return jsonify({'error': '지원하지 않는 제공자 타입입니다.'}), 400
        
        if provider_type == 'openai' and not api_key:
            return jsonify({'error': 'OpenAI API 키를 입력해주세요.'}), 400
        
        if provider_type == 'ollama' and not base_url:
            base_url = 'http://localhost:11434/v1'
        
        if not model_name:
            if provider_type == 'openai':
                model_name = 'gpt-3.5-turbo'
            else:
                model_name = 'qwen2.5:32b'
        
        # 연결 테스트
        test_success, test_message = test_llm_connection(
            provider_type, api_key, base_url, model_name
        )
        
        if not test_success:
            return jsonify({'error': f'LLM 연결 테스트 실패: {test_message}'}), 400
        
        # 실제로는 데이터베이스에 저장
        provider_data = {
            'id': 3,  # 새로 생성된 ID
            'name': name,
            'provider_type': provider_type,
            'base_url': base_url if provider_type == 'ollama' else None,
            'model_name': model_name,
            'is_active': False,
            'status': 'connected',
            'test_result': test_message,
            'created_at': '2024-06-20T12:00:00Z'
        }
        
        return jsonify({
            'message': 'LLM 제공자가 성공적으로 추가되었습니다.',
            'provider': provider_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'LLM 제공자 추가 중 오류: {str(e)}'}), 500

@llm_bp.route('/providers/<int:provider_id>', methods=['PUT'])
@jwt_required()
def update_llm_provider(provider_id):
    """LLM 제공자 설정 업데이트"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        name = data.get('name', '').strip()
        api_key = data.get('api_key', '').strip()
        base_url = data.get('base_url', '').strip()
        model_name = data.get('model_name', '').strip()
        is_active = data.get('is_active', False)
        
        # 실제로는 데이터베이스에서 기존 설정 조회 및 업데이트
        
        return jsonify({
            'message': 'LLM 제공자 설정이 업데이트되었습니다.',
            'provider_id': provider_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'LLM 제공자 업데이트 중 오류: {str(e)}'}), 500

@llm_bp.route('/providers/<int:provider_id>', methods=['DELETE'])
@jwt_required()
def delete_llm_provider(provider_id):
    """LLM 제공자 삭제"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 삭제
        
        return jsonify({
            'message': 'LLM 제공자가 삭제되었습니다.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'LLM 제공자 삭제 중 오류: {str(e)}'}), 500

@llm_bp.route('/providers/<int:provider_id>/test', methods=['POST'])
@jwt_required()
def test_llm_provider(provider_id):
    """LLM 제공자 연결 테스트"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        provider_type = data.get('provider_type', '').strip()
        api_key = data.get('api_key', '').strip()
        base_url = data.get('base_url', '').strip()
        model_name = data.get('model_name', '').strip()
        
        if not provider_type:
            return jsonify({'error': '제공자 타입을 입력해주세요.'}), 400
        
        success, message = test_llm_connection(provider_type, api_key, base_url, model_name)
        
        return jsonify({
            'success': success,
            'message': message
        }), 200 if success else 400
        
    except Exception as e:
        return jsonify({'error': f'LLM 연결 테스트 중 오류: {str(e)}'}), 500

@llm_bp.route('/providers/<int:provider_id>/activate', methods=['POST'])
@jwt_required()
def activate_llm_provider(provider_id):
    """LLM 제공자 활성화"""
    try:
        current_user_id = get_jwt_identity()
        
        # 실제로는 데이터베이스에서 다른 제공자들을 비활성화하고
        # 선택된 제공자를 활성화
        
        return jsonify({
            'message': f'LLM 제공자 {provider_id}가 활성화되었습니다.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'LLM 제공자 활성화 중 오류: {str(e)}'}), 500

@llm_bp.route('/models', methods=['GET'])
@jwt_required()
def get_available_models():
    """사용 가능한 모델 목록 조회"""
    try:
        provider_type = request.args.get('provider_type', 'ollama')
        
        if provider_type == 'openai':
            models = [
                {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo', 'description': '빠르고 효율적인 모델'},
                {'id': 'gpt-4', 'name': 'GPT-4', 'description': '가장 강력한 모델'},
                {'id': 'gpt-4-turbo', 'name': 'GPT-4 Turbo', 'description': '개선된 GPT-4 모델'}
            ]
        else:  # ollama
            models = [
                {'id': 'qwen2.5:32b', 'name': 'Qwen2.5 32B', 'description': '고성능 한국어 지원 모델'},
                {'id': 'qwen2.5:14b', 'name': 'Qwen2.5 14B', 'description': '중간 성능 모델'},
                {'id': 'qwen2.5:7b', 'name': 'Qwen2.5 7B', 'description': '경량 모델'},
                {'id': 'llama3.1:8b', 'name': 'Llama 3.1 8B', 'description': 'Meta의 오픈소스 모델'},
                {'id': 'mistral:7b', 'name': 'Mistral 7B', 'description': '효율적인 유럽 모델'}
            ]
        
        return jsonify({'models': models}), 200
        
    except Exception as e:
        return jsonify({'error': f'모델 목록 조회 중 오류: {str(e)}'}), 500

def test_llm_connection(provider_type, api_key, base_url, model_name):
    """LLM 연결 테스트"""
    try:
        if provider_type == 'openai':
            if not api_key:
                return False, "OpenAI API 키가 필요합니다."
            
            client = OpenAI(api_key=api_key)
            model_name = model_name or 'gpt-3.5-turbo'
        else:  # ollama
            if not base_url:
                base_url = 'http://localhost:11434/v1'
            
            client = OpenAI(
                api_key="ollama",
                base_url=base_url
            )
            model_name = model_name or 'qwen2.5:32b'
        
        # 간단한 테스트 요청
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "user", "content": "안녕하세요. 연결 테스트입니다."}
            ],
            max_tokens=50,
            temperature=0.5
        )
        
        if response.choices and response.choices[0].message:
            return True, f"연결 성공! 모델: {model_name}"
        else:
            return False, "응답을 받지 못했습니다."
            
    except Exception as e:
        error_message = str(e)
        if "Connection" in error_message:
            return False, f"연결 실패: {base_url}에 연결할 수 없습니다."
        elif "API key" in error_message:
            return False, "API 키가 유효하지 않습니다."
        elif "model" in error_message.lower():
            return False, f"모델 '{model_name}'을 찾을 수 없습니다."
        else:
            return False, f"연결 테스트 실패: {error_message}"

