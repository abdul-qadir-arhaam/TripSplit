# Trip Finance

Trip Finance is a modern full-stack web application designed for managing shared expenses, balances, settlements, budgets, location-based expenses, and financial analytics for group trips and outings.

## Architecture & Tech Stack

- **Backend**: Python FastAPI, SQLAlchemy ORM, Pydantic v2, Alembic migrations, PyJWT, Passlib (bcrypt).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack React Query, React Router DOM, Lucide Icons.
- **Database**: PostgreSQL (Production/Docker) / SQLite (Local development).

## Getting Started

### Backend Setup

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
3. API documentation will be available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

## Roadmap & Phases

Refer to `phases.md` for phase-by-phase implementation progress.
- [x] **Phase 0**: Project Foundation
- [x] **Phase 1**: Authentication & User Profiles
- [ ] **Phase 2**: Friends & Groups
- [ ] **Phase 3**: Trip Management
