# WordPress Auto Poster

This project provides a simple platform for creating AI generated posts and publishing them to WordPress.  The backend is built with FastAPI and relies on JWT for authentication.  A small React frontend shows posting progress and allows you to manage your WordPress connection.

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
pip install -r requirements.txt
uvicorn server.src.main:app --reload
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to point the frontend to your backend (defaults to `http://localhost:8000`).

### Running Tests
```bash
pytest -q
```

## Usage
1. Register with `/api/auth/register` and log in via `/api/auth/login` to obtain a JWT.
2. Use the settings screen to connect your WordPress account (`/api/wordpress/sites`).
3. Generate content with `/api/content/generate` and publish directly from the dashboard.
