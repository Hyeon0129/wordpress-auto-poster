import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.wordpress import wordpress_bp
from src.routes.content import content_bp
from src.routes.llm import llm_bp
from src.routes.seo import seo_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = 'wordpress-auto-poster-secret-key-2024'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-wordpress-auto-poster'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # 토큰 만료 없음 (개발용)

# CORS 설정
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"])

# JWT 설정
jwt = JWTManager(app)

# Blueprint 등록
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(wordpress_bp, url_prefix='/api/wordpress')
app.register_blueprint(content_bp, url_prefix='/api/content')
app.register_blueprint(llm_bp, url_prefix='/api/llm')
app.register_blueprint(seo_bp, url_prefix='/api/seo')

# Database 설정
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.errorhandler(404)
def not_found(error):
    return {"error": "Not found"}, 404

@app.errorhandler(500)
def internal_error(error):
    return {"error": "Internal server error"}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

