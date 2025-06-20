from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from src.models.user import db, User
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """이메일 형식 검증"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """비밀번호 강도 검증"""
    if len(password) < 8:
        return False, "비밀번호는 최소 8자 이상이어야 합니다."
    if not re.search(r'[A-Za-z]', password):
        return False, "비밀번호에는 영문자가 포함되어야 합니다."
    if not re.search(r'\d', password):
        return False, "비밀번호에는 숫자가 포함되어야 합니다."
    return True, "유효한 비밀번호입니다."

@auth_bp.route('/register', methods=['POST'])
def register():
    """사용자 회원가입"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '요청 데이터가 없습니다.'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # 입력 검증
        if not username or not email or not password:
            return jsonify({'error': '모든 필드를 입력해주세요.'}), 400
        
        if len(username) < 3:
            return jsonify({'error': '사용자명은 최소 3자 이상이어야 합니다.'}), 400
        
        if not validate_email(email):
            return jsonify({'error': '유효한 이메일 주소를 입력해주세요.'}), 400
        
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # 중복 검사
        if User.query.filter_by(username=username).first():
            return jsonify({'error': '이미 존재하는 사용자명입니다.'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': '이미 존재하는 이메일입니다.'}), 409
        
        # 사용자 생성
        password_hash = generate_password_hash(password)
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # JWT 토큰 생성
        access_token = create_access_token(identity=new_user.id)
        
        return jsonify({
            'message': '회원가입이 완료되었습니다.',
            'access_token': access_token,
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'회원가입 중 오류가 발생했습니다: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """사용자 로그인"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '요청 데이터가 없습니다.'}), 400
        
        username_or_email = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username_or_email or not password:
            return jsonify({'error': '사용자명/이메일과 비밀번호를 입력해주세요.'}), 400
        
        # 사용자 찾기 (사용자명 또는 이메일로)
        user = User.query.filter(
            (User.username == username_or_email) | 
            (User.email == username_or_email)
        ).first()
        
        if not user:
            return jsonify({'error': '존재하지 않는 사용자입니다.'}), 401
        
        if not user.is_active:
            return jsonify({'error': '비활성화된 계정입니다.'}), 401
        
        # 비밀번호 확인
        if not check_password_hash(user.password_hash, password):
            return jsonify({'error': '비밀번호가 올바르지 않습니다.'}), 401
        
        # JWT 토큰 생성
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': '로그인 성공',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'로그인 중 오류가 발생했습니다: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """현재 로그인한 사용자 정보 조회"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'사용자 정보 조회 중 오류가 발생했습니다: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """사용자 로그아웃"""
    # JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됨
    return jsonify({'message': '로그아웃되었습니다.'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """비밀번호 변경"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'error': '현재 비밀번호와 새 비밀번호를 입력해주세요.'}), 400
        
        # 현재 비밀번호 확인
        if not check_password_hash(user.password_hash, current_password):
            return jsonify({'error': '현재 비밀번호가 올바르지 않습니다.'}), 401
        
        # 새 비밀번호 검증
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # 비밀번호 업데이트
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'message': '비밀번호가 성공적으로 변경되었습니다.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'비밀번호 변경 중 오류가 발생했습니다: {str(e)}'}), 500

