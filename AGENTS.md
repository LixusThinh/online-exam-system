# SKY-EXAM Agent Guidelines

## Stack
- **Backend**: Python FastAPI + SQLAlchemy + Redis
- **Frontend**: Next.js 16 (React 19) + TypeScript + Tailwind CSS 4

## Build Commands
```
# Frontend
npm run dev | npm run build && npm start | npm run lint && npx tsc --noEmit

# Backend
uvicorn main:app --reload --port 8000
alembic upgrade head && alembic migrate -m "msg"
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
```

## Security Policies

| Policy | Details |
|--------|---------|
| Secrets | Never commit `.env`; `SECRET_KEY` min 32 chars |
| Cookies | HttpOnly, SameSite=Strict; tokens in cookies only |
| CSRF | `X-CSRF-Token` header on POST/PUT/DELETE |
| Rate Limiting | `/register`: 3/min, `/login`: 5/min, `/submit`: 2/10min |
| Validation | Pydantic schemas for all inputs |
| DB | Parameterized queries (SQLAlchemy default) |

## Auth Flow

1. **Login**: `POST /login` → backend sets `access_token` (15min), `refresh_token` (7d), `csrf_token` cookies
2. **API Calls**: All fetch with `credentials: "include"` (no manual Authorization header)
3. **CSRF**: Get token via `document.cookie.match(/csrf_token=([^;]+)/)?.[1]`
4. **Auto-refresh**: Timer at 14min (1min before expiry); call `POST /refresh` → new cookies
5. **Logout**: `POST /logout` → Redis blacklists tokens, clears cookies

## Code Conventions

### TypeScript
- Client components: `"use client"` | Imports: 1) React→2) Third-party→3) API→4) Local
- Files: kebab-case | Components: PascalCase | Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE | Types: PascalCase

### Python
- Files: snake_case | Classes: PascalCase | Functions: snake_case
- `index=True` on foreign keys and frequently queried columns

### Error Handling
```typescript
try { await api(); } catch (err: any) { setError(err.message); }
```
```python
except Exception: raise HTTPException(status_code=400, detail="Error")
```

## Environment Variables
```
# Backend .env
DATABASE_URL=sqlite:///./sky_exam.db
SECRET_KEY=<min-32-chars>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Database
- Dev: SQLite (`sky_exam.db`) | Prod: PostgreSQL (`DATABASE_URL`)
- Use Alembic for migrations | `__tablename__`: snake_case plural
