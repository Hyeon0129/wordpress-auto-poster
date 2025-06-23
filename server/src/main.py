import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.db import Base, engine

from src.routes.auth import router as auth_router
from src.routes.user import router as user_router
from src.routes.wordpress import router as wordpress_router
from src.routes.content import router as content_router
from src.routes.llm import router as llm_router
from src.routes.seo import router as seo_router
from src.routes.keyword_analysis import router as keyword_analysis_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(user_router, prefix="/api/user")
app.include_router(wordpress_router, prefix="/api/wordpress")
app.include_router(content_router, prefix="/api/content")
app.include_router(llm_router, prefix="/api/llm")
app.include_router(seo_router, prefix="/api/seo")
app.include_router(keyword_analysis_router, prefix="/api/keyword-analysis")

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

