from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# 라우터 임포트
from .routes import auth, llm, wordpress, seo, posts, settings

app = FastAPI(
    title="WordPress Auto Poster API",
    description="AI 기반 WordPress 자동 포스팅 플랫폼",
    version="2.1.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(llm.router)
app.include_router(wordpress.router)
app.include_router(seo.router)
app.include_router(posts.router)
app.include_router(settings.router)

# 정적 파일 서빙 (프론트엔드)
if os.path.exists("../client/dist"):
    app.mount("/static", StaticFiles(directory="../client/dist/assets"), name="static")
    app.mount("/", StaticFiles(directory="../client/dist", html=True), name="frontend")

@app.get("/api/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "version": "2.1.0",
        "message": "WordPress Auto Poster API is running"
    }

@app.get("/api/")
async def root():
    """API 루트 엔드포인트"""
    return {
        "message": "WordPress Auto Poster API v2.1.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

