# AGENTS.md

## 목표
기존 Flask 기반 WordPress 자동화 백엔드를 FastAPI로 전면 마이그레이션하고, 모든 API/기능을 테스트한 후 문제를 자동 감지 및 수정한다.

워드프레스 자동화 포스팅 웹 플랫폼
추가할기능들은 키워드 분석후 경쟁강도 확인 기능 추가 , 포스팅 진행상황 실시간 확인가능 , SEO최적화

모든기능들은 로그인후 정상작동해야하고 사용방법 가이드를 영문으로 작성할것

## Agents

### MigrationAgent
- 역할: Flask 코드를 FastAPI 스타일로 자동 변환
- 도구: Python AST, file I/O
- 기능:
  - Flask Blueprint → FastAPI APIRouter 변경
  - request.form/json → Pydantic 모델 변환
  - jsonify → dict 리턴으로 수정
  - 서버 실행 구조 (`main.py`)를 `FastAPI` 형식으로 재구성

### TestAgent
- 역할: FastAPI로 변경된 API의 정상 동작 확인
- 도구: `pytest`, `httpx`, 또는 `requests`
- 기능:
  - 각 endpoint에 대해 자동 테스트 케이스 실행
  - 오류 발생 시 에러 로그 출력 및 추적

### CleanupAgent
- 역할: 사용하지 않는 Flask 코드 제거 및 FastAPI 관련 모듈 정리
- 도구: static analyzer, regex
- 기능:
  - `from flask import` 등 import 정리
  - 남아있는 `Blueprint`/`Flask()` 관련 코드 제거

---

## 작업 순서

1. **MigrationAgent**가 모든 `routes/`, `main.py`, `request` 관련 코드를 FastAPI 스타일로 변환
2. **CleanupAgent**가 불필요한 코드와 모듈을 정리
3. **TestAgent**가 API 테스트를 통해 실제 실행 오류가 있는지 확인

---

## 참고d
- 변경 후 서버 실행 명령:
```bash
uvicorn src.main:app --reload