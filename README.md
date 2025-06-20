# WordPress Auto Poster

This is a personal project for automating blog post submissions to a WordPress site.

The goal is to save time by reducing repetitive tasks like manual posting, and to streamline the publishing workflow through a simple UI and backend system.

## Features

- Automatically post articles to WordPress using the XML-RPC API
- Simple frontend interface for managing content
- Lightweight backend for handling post data and user management

## Getting Started

### Backend

```bash
cd wordpress-auto-poster-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
