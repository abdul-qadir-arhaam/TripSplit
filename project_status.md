# Trip Finance — Project Status & Roadmap Tracker

> **Last Updated:** September 22, 2026  
> **Current Status:** Phases 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, and 10 Complete (11 / 24 Phases Complete)  
> **Next Milestone:** Phase 11 — Location-Based Expenses (Geolocation tagging & Leaflet trip map)

---

## 1. Executive Summary

Trip Finance is a full-stack, modular-monolith web application built with **FastAPI**, **SQLAlchemy**, **PostgreSQL/SQLite**, **React (TypeScript)**, and **Tailwind CSS**. It serves as a shared financial workspace for group travel, handling expenses, multi-mode splitting, debt settlements, location mapping, and budget tracking.

### System Health
| Component | Status | Port / URL | Details |
| :--- | :---: | :--- | :--- |
| **Backend API** | 🟢 Active | `http://127.0.0.1:8000` | FastAPI with reload, Swagger docs at `/docs`, Health check at `/api/health` |
| **Frontend Web App** | 🟢 Active | `http://localhost:5173` | React 18, TypeScript, Vite, Tailwind CSS |
| **Database** | 🟢 Active | `sqlite:///./trip_finance.db` | SQLAlchemy ORM + Alembic migrations (`001_initial_users`, `002_friends_groups_trips`, `003_add_trip_invites`, `004_add_expenses_and_splits`, `005_add_settlements`) |
| **Automated Tests** | 🟢 Passing | 24/24 tests pass | Pytest test suite covering auth, friends, groups, trips, invites, guest join, guest isolation, direct guest addition, guest conversion, multi-mode expense splits, balance/settlement graph, settlements tracking & ledger impact, and trip dashboard analytics |
| **Production Build** | 🟢 Passing | `npm run build` | 0 TypeScript errors, production bundle compiled |

---

## 2. Phase-by-Phase Roadmap Progress

Tracked against [phases.md](file:///c:/Users/PC-5/Desktop/trip_mang/phases.md):

| Phase | Title | Status | Completion Date | Highlights / Deliverables |
| :---: | :--- | :---: | :---: | :--- |
| **0** | **Project Foundation** | 🟢 **Completed** | 2026-09-21 | Monorepo scaffold, FastAPI + Vite React setup, Tailwind theme, Docker Compose, `/api/health`. |
| **1** | **Authentication & User Profiles** | 🟢 **Completed** | 2026-09-21 | User model, Bcrypt, JWT auth, Bearer dependency, Login/Register/Profile UI, ProtectedRoute. |
| **2** | **Friends & Groups** | 🟢 **Completed** | 2026-09-21 | User search, friend requests (send/accept/decline), friends list, reusable groups management. |
| **3** | **Trip Management** | 🟢 **Completed** | 2026-09-21 | Trip creation (dates, destination, budget, type), owner assignment, member selection, trip overview, trip settings editing. |
| **4** | **Hybrid Membership** | 🟢 **Completed** | 2026-09-21 | Support for registered and guest members, guest session tokens, strict guest isolation, owner direct guest companion addition, seamless guest-to-account conversion preserving history. |
| **5** | **Invite System** | 🟢 **Completed** | 2026-09-21 | Cryptographically secure invite tokens (SHA-256 hashed in DB), custom expiration presets (24h, 7d, 30d, Never), usage tracking (`max_uses`), owner link management (disable, regenerate), public preview, token join (registered & guest). |
| **6** | **WhatsApp Trip Sharing** | 🟢 **Completed** | 2026-09-21 | One-click outbound WhatsApp formatted invitations (`https://api.whatsapp.com/send?text=...`), message preview modal, public join preview page, and join endpoints (strictly client deep-link, zero WhatsApp scraping). |
| **7** | **Expense Management** | 🟢 **Completed** | 2026-09-22 | Add/edit/delete shared expenses, 10 categories with color badges, 4 split methods (Equal, Exact, Percentage, Shares) with exact decimal cent distribution, auto-balance remaining payer, and WhatsApp expense sharing. |
| **8** | **Balance & Settlement Engine** | 🟢 **Completed** | 2026-09-22 | Decimal-safe net balance calculations (`Total Paid - Total Share`), mathematical invariant verification (`sum(net_balances) == 0`), greedy debt minimization settlement graph, and WhatsApp settlement reminders. |
| **9** | **Settlement Management** | 🟢 **Completed** | 2026-09-22 | Settlement tracking (`PENDING`, `PAID`, `CANCELLED`), 1-click debt payoff recording from suggestions, settlement history list, receipt generation, and balance ledger integration ($Net = Paid - Share + SettlementPaid - SettlementReceived$). |
| **10** | **Budget & Trip Dashboard** | 🟢 **Completed** | 2026-09-22 | Central dashboard with budget velocity meter & threshold alerts (On Track, Caution, Over Budget), average daily spend, remaining daily budget, category distribution meter, daily timeline trends, and member spend ranking. |
| **11** | **Location-Based Expenses** | ⏸️ Queued | — | Geolocation expense tagging, Leaflet/OpenStreetMap interactive trip map. |
| **12** | **Location Analytics** | ⏸️ Queued | — | Spend breakdown by city, area, and geographic clusters. |
| **13** | **WhatsApp Expense Sharing** | ⏸️ Queued | — | Outbound expense receipts and debt settlement sheets formatted for WhatsApp. |
| **14** | **Receipt Management** | ⏸️ Queued | — | S3-compatible object storage for receipt file uploads and attachments. |
| **15** | **Receipt OCR** | ⏸️ Queued | — | Optical character recognition (merchant, total, date) with human confirmation. |
| **16** | **Advanced Analytics** | ⏸️ Queued | — | Long-term personal and group spending charts (Recharts). |
| **17** | **Data Science & AI** | ⏸️ Queued | — | Expense category auto-prediction, duplicate detection, budget forecasting. |
| **18** | **Notifications System** | ⏸️ Queued | — | In-app alerts for expense updates, settlement requests, budget threshold warnings. |
| **19** | **Export System** | ⏸️ Queued | — | Export trip ledger to CSV, JSON, and PDF formats. |
| **20** | **Offline Support** | ⏸️ Queued | — | Client-side optimistic expense queuing with idempotency tokens. |
| **21** | **Security & Production Hardening** | ⏸️ Queued | — | Rate limiting, CORS policies, token hashing, audit logs. |
| **22** | **Testing & QA** | ⏸️ Queued | — | End-to-end integration tests, regression coverage, and performance benchmarks. |
| **23** | **Deployment** | ⏸️ Queued | — | Docker containers, CI/CD pipeline, production environment configuration. |

---

## 3. Completed Phases Detail

### Phase 0: Project Foundation
* **Backend:** Initialized FastAPI app with CORS middleware, lifespan events, and Pydantic v2 settings.
* **Database:** Configured SQLAlchemy engine and session factory with SQLite/PostgreSQL portability and Alembic migrations.
* **Frontend:** Initialized Vite React 18 with TypeScript and Tailwind CSS with custom brand colors, glassmorphism, responsive shell, and typography.
* **UI Components:** Built reusable `Button`, `Input`, `Card`, `Badge`, `Spinner`, and `EmptyState` components.
* **Layouts:** Created `Navbar` with logo and dynamic user menu, plus `AppLayout` wrapper.
* **Verification:** `GET /api/health` confirmed working.

### Phase 1: Authentication & User Profiles
* **Models:** Created `User` model with UUID, name, email (unique, indexed), password_hash, and timestamps.
* **Migrations:** Applied Alembic revision `001_initial_users`.
* **Security:** Implemented Bcrypt password hashing (`app.security.password`) and JWT token utilities (`app.security.tokens`).
* **Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/users/me`, `PATCH /api/users/me`.
* **Frontend Pages:** `LoginPage`, `RegisterPage`, `DashboardPage`, `ProfilePage`, and `ProtectedRoute`.
* **Tests:** 11 automated tests passing.

### Phase 2: Friends & Groups
* **Models:** Created `FriendRequest`, `Group`, and `GroupMember` with foreign keys and cascade rules.
* **Migrations:** Applied Alembic revision `002_friends_groups_trips`.
* **Endpoints:**
  - `GET /api/users/search?q={query}` (Live registered user search)
  - `GET /api/friends`, `POST /api/friends/requests`, `POST /api/friends/requests/{id}/accept`, `POST /api/friends/requests/{id}/decline`, `DELETE /api/friends/{id}`
  - `GET /api/groups`, `POST /api/groups`, `GET /api/groups/{id}`, `PATCH /api/groups/{id}`, `DELETE /api/groups/{id}`, `POST /api/groups/{id}/members`, `DELETE /api/groups/{id}/members/{user_id}`
* **Frontend Pages:**
  - `FriendsPage`: Live debounced user search, pending requests tab, friends list, remove friend.
  - `GroupsPage`: Group creation, member roster, add friends to group, remove members, rename/delete group.
* **Tests:** Automated tests in `test_friends.py` and `test_groups.py`.

### Phase 3: Trip Management
* **Models:** Created `Trip` (with decimal-safe `Numeric(12, 2)` budget) and `TripMember` (with `OWNER` and `MEMBER` roles).
* **Endpoints:**
  - `GET /api/trips`, `POST /api/trips`, `GET /api/trips/{id}`, `PATCH /api/trips/{id}`, `DELETE /api/trips/{id}`
  - `POST /api/trips/{id}/members`, `DELETE /api/trips/{id}/members/{member_id}`
* **Frontend Pages:**
  - `TripsPage`: Filterable trip grid by status (`ALL`, `PLANNING`, `ACTIVE`, `COMPLETED`), destination, dates, budget.
  - `CreateTripPage`: Full trip creation with friend & group multi-selector.
  - `TripOverviewPage`: Trip dashboard header, budget summary meter, member roster, owner settings modal, delete trip action, and next-phase roadmap cards.
* **Tests:** Automated tests in `test_trips.py`.

### Phase 4: Hybrid Membership (Guest Access & Conversion)
* **Backend Security & Auth:**
  - Implemented `app.security.guest_auth` with signed guest JWT generation (`generate_guest_token`), SHA-256 token hashing (`hash_guest_token`), and decoding (`decode_guest_token`).
  - Added unified `AuthActor` and `get_current_actor` dependency in `app.dependencies` supporting both registered users and isolated guest sessions.
  - Implemented strict guest isolation: guests are restricted to their assigned trip only; attempts to access foreign trips return `403 Forbidden` and foreign user endpoints return `401 Unauthorized`.
* **Database & Repositories:**
  - Utilized `TripMember.member_type` (`REGISTERED` / `GUEST`) and `TripMember.guest_token_hash`.
  - Added repository methods for guest member creation, session retrieval, and guest-to-account conversion (`convert_guest_to_registered`).
* **Endpoints:**
  - `POST /api/trips/{id}/join-guest`: 1-click guest joining with display name without requiring account registration.
  - `POST /api/trips/{id}/members/guest`: Allows trip organizers to directly add guest companions by name to the trip roster.
  - `POST /api/trips/{id}/convert-guest`: Converts a guest participant into a registered account, preserving all trip records and preventing duplicate member rosters.
  - `GET /api/trips/{id}/guest-session`: Validates active guest participation session.
  - `GET /api/trips/{id}`: Updated to support hybrid access by registered users and authorized guests.
* **Frontend Experience:**
  - `AuthContext`: Added guest session tracking (`guestSession`, `isGuest`, `setGuestSession`, `clearGuestSession`, `convertGuestSession`).
  - Axios interceptor: Injects either user token or guest token into API requests with clean 401 recovery.
  - `ProtectedRoute`: Allows guest access to their specific trip while redirecting from registered-only routes.
  - `Navbar`: Displays amber "Guest: {Name}" status indicator, "Save Account" button, and exit action; hides registered-only navigation items.
  - `JoinTripPage`: Offers 1-click frictionless "Quick Join as Guest" alongside "Sign In or Register".
  - `TripOverviewPage`: Displays Guest Mode banner with conversion call-to-action, badges distinguishing `GUEST` and `REGISTERED` companions, and tabbed Add Companion modal (Friend vs Direct Guest).
  - `ConvertGuestModal`: Sleek interactive modal for guests to convert to a full registered account.
* **Tests:** Added 4 automated integration tests in `test_guest_conversion.py`. 18/18 test suite passing.

### Phase 6: WhatsApp Trip Sharing & Date Section Overhaul
* **Date Picker Enhancements:**
  - Fixed dark mode color-scheme and webkit indicator visibility for native date pickers (`[color-scheme:dark]`).
  - Added full clickable date input trigger with automated `showPicker()` fallback.
  - Added quick preset buttons (*This Weekend*, *Next Week*, *In 1 Month*, *Clear*) and live duration calculation (*"7 days trip"*).
  - Added date editing controls (`editStartDate`, `editEndDate`) to the **Edit Trip Settings** modal on `TripOverviewPage`.
  - Added date range display to trip cards in `TripsPage`.
* **WhatsApp Invitation Service:**
  - Built `frontend/src/services/whatsapp.ts` for rich formatted message generation and standard universal WhatsApp deep link generation (`https://api.whatsapp.com/send?text=...`).
  - Strict compliance with PRD Section 4.1 & Architecture Section 19: zero scraping/bot integration; 100% user-directed outbound sharing.
* **WhatsApp Share Modal:**
  - Built `WhatsAppShareModal` with live WhatsApp chat bubble preview, "Open in WhatsApp", "Copy Full Message", and "Copy Invite Link" with instant visual feedback.
  - Integrated modal triggers on trip creation (auto prompt), trip overview banner header, and companions roster card.
* **Public Invite Preview & Join Flow:**
  - Backend `GET /api/trips/{id}/invite` for safe public preview (destination, dates, organizer, member count).
  - Backend `POST /api/trips/{id}/join` for one-click joining by authenticated members.
  - Backend `POST /api/trips/{id}/join-guest` for instant guest joining.
  - Created `JoinTripPage` (`/join/:id`) for seamless invited friend onboarding with login/register/guest options.
* **Tests:** Added tests for invite preview, joining trips, and guest conversion. 18/18 tests passing.

### Phase 5: Invite System
* **Cryptographic Token Architecture:**
  - Secure random token generation via `secrets.token_urlsafe(32)` yielding 43-char URL-safe tokens.
  - One-way SHA-256 hashing before DB storage (`token_hash = sha256(raw_token)`). Raw tokens are never stored plaintext in the database.
  - Lookups hash incoming token and query indexed `token_hash`.
  - Migration `003_add_trip_invites` applied to create indexed `trip_invites` table.
* **Granular Expiration & Usage Controls:**
  - Configurable expiration presets: 24 Hours, 7 Days, 30 Days (default), or Never expires.
  - Optional `max_uses` threshold limit and real-time usage counter tracking (`use_count`).
  - Automatic expiration calculation during preview and join enforcement.
* **Owner Management Actions:**
  - `POST /api/trips/{id}/invites`: Generate customized invite link.
  - `GET /api/trips/{id}/invites`: List all links created with status, expiration, and usage counts.
  - `GET /api/trips/{id}/invites/active`: Fetch or create primary active link.
  - `POST /api/trips/{id}/invites/{invite_id}/disable`: Revoke an invite link immediately.
  - `POST /api/trips/{id}/invites/{invite_id}/regenerate`: Rotate token, invalidate previous token, and reset usage counter.
* **Public Preview & Token Join Endpoints:**
  - `GET /api/invites/{token}`: Unauthenticated safe preview with trip metadata, organizer, active status, expiration flags.
  - `POST /api/invites/{token}/join`: Authenticated registered user joins trip, increments usage counter.
  - `POST /api/invites/{token}/join-guest`: Anonymous companion joins with display name, receives signed guest token, increments usage counter.
* **Frontend UI & WhatsApp Integration:**
  - Built `ManageInvitesModal` (`frontend/src/components/trips/ManageInvitesModal.tsx`) with link copying, WhatsApp share launcher, expiration selector, link history, revocation, and regeneration controls.
  - Upgraded `JoinTripPage` to validate cryptographic tokens, show expiration/inactivity alerts, and fall back to legacy trip IDs if needed.
  - Updated `WhatsAppShareModal` and `TripOverviewPage` to dynamically inject active cryptographic invite tokens into WhatsApp invitation texts.
### Phase 7: Expense Management
* **Database Models & Migrations:**
  - Created `Expense` model (`backend/app/models/expense.py`) with fields for title, exact decimal `Numeric(12, 2)` amount, currency, category, payer (`paid_by_member_id`), split method (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`), date, location, notes, and receipt URL.
  - Created `ExpenseSplit` model (`backend/app/models/expense_split.py`) with cascade relationship, allocated amount, and stored `split_value`.
  - Created and applied Alembic migration `004_add_expenses_and_splits.py`.
* **Split Calculation Engine:**
  - Built `split_calculator.py` with exact decimal cent distribution avoiding all floating-point rounding drift.
  - Equal split automatically distributes remainder cents to first participants ensuring `sum(splits) == expense_amount`.
  - Exact split validates sum to the penny and produces detailed 400 error messages if mismatched.
  - Percentage split validates 100.00% sum and reconciles rounding differences.
  - Shares split computes proportional allocations.
* **API Endpoints:**
  - `POST /api/trips/{trip_id}/expenses`: Record shared bill with multi-mode allocations.
  - `GET /api/trips/{trip_id}/expenses`: Filterable by category, payer, search term, and sortable by date/amount.
  - `GET /api/trips/{trip_id}/expenses/{expense_id}`: Full participant breakdown.
  - `PATCH /api/trips/{trip_id}/expenses/{expense_id}`: Edit details and reallocate splits.
  - `DELETE /api/trips/{trip_id}/expenses/{expense_id}`: Cascade deletes splits.
* **Frontend UI & WhatsApp Sharing:**
  - Built `ExpenseModal` supporting all 4 split modes with real-time balance calculations, category picker with tailored icons and color palettes, and companion selectors.
  - Built `ExpenseDetailModal` showing full breakdown, payer info, and 1-click WhatsApp expense sharing link (`generateExpenseShareText`).

### Phase 8: Balance & Settlement Engine
* **Ledger & Invariant Validation:**
  - Built `BalanceService` calculating `total_paid`, `total_share`, and `net_balance = total_paid - total_share` for every active companion.
  - Verified core mathematical invariant: `sum(net_balances) == 0.00` across registered users and guest actors.
  - Computes dynamic trip total spent, remaining budget, and percentage used.
* **Greedy Debt Minimization Algorithm:**
  - Greedily resolves debts between sorted creditors and debtors, yielding at most $N-1$ optimal settlement transfers.
  - Endpoint: `GET /api/trips/{trip_id}/balances`.
* **Frontend UI & WhatsApp Integration:**
  - Built `BalancesTab` component featuring Member Balances Leaderboard, status badges (`Gets back`, `Owes`, `Settled`), and Minimized Suggested Settlements cards with visual transfer flow arrows.
  - Built 1-click "Share Settlement Sheet" and individual WhatsApp settlement reminder buttons (`generateSettlementShareText`).
  - Integrated dynamic budget meter in `TripOverviewPage` header reflecting real-time group spending.
* **Automated Tests:**
  - Added `backend/tests/test_expenses.py` and `backend/tests/test_balances.py` testing equal/odd-cent splits, exact splits, percentage splits, shares splits, net balances, and debt minimization graphs.
  - Test suite: 22/22 tests passing. Production build: 0 TypeScript errors.

### Phase 9: Settlement Management
* **Database & Models:**
  - Created `Settlement` model in `backend/app/models/settlement.py` with fields: `id`, `trip_id`, `from_member_id` (debtor), `to_member_id` (creditor), `amount`, `currency`, `status` (`PENDING`, `PAID`, `CANCELLED`), `payment_date`, `payment_method` (`UPI`, `Cash`, `Bank Transfer`, `Card`, `Other`), `notes`, `created_by_member_id`, and timestamps.
  - Linked `Trip.settlements` relationship with cascade orphan removal.
  - Executed Alembic migration `005_add_settlements.py` (`alembic current` is `005_add_settlements`).
* **Balance Ledger Integration:**
  - Updated `BalanceService` to incorporate `PAID` settlements into net balance computation:
    $$\text{Net Balance} = (\text{Total Paid} - \text{Total Share}) + \text{Settlement Paid Out} - \text{Settlement Received}$$
  - Preserved mathematical invariant $\sum \text{Net Balances} = 0.00$ at all times. Paying off a debt automatically decreases the debtor's debt, decreases the creditor's credit, and reduces remaining suggested transfers.
* **Backend API & Service:**
  - `POST /api/trips/{trip_id}/settlements`: Record settlement payment between two active trip companions.
  - `GET /api/trips/{trip_id}/settlements`: List settlements with status filter (`ALL`, `PAID`, `PENDING`, `CANCELLED`) and summary totals (`total_settled_amount`, `total_pending_amount`).
  - `GET /api/trips/{trip_id}/settlements/{settlement_id}`: Settlement details.
  - `PATCH /api/trips/{trip_id}/settlements/{settlement_id}`: Update settlement or mark as `PAID` / `CANCELLED`.
  - `DELETE /api/trips/{trip_id}/settlements/{settlement_id}`: Delete settlement with net balance rollback.
* **Frontend UI Components:**
  - `RecordSettlementModal.tsx`: Visual debt payoff modal pre-populating payer, recipient, amount, method pills, status, date, and notes.
  - `SettlementHistoryList.tsx`: Filterable history list with instant "Mark as Paid", "Cancel", "Delete", and WhatsApp receipt generation.
  - `BalancesTab.tsx`: Added 1-click **"Record Payment"** button directly on suggested transfer cards and embedded `SettlementHistoryList`.
  - Added `generateSettlementReceiptText` to `services/whatsapp.ts`.
* **Automated Tests:**
  - Added `backend/tests/test_settlements.py` covering settlement CRUD, pending vs paid ledger effects, status transitions, and self-settlement/authorization prevention.

### Phase 10: Budget & Trip Dashboard
* **Metrics & Analytics Calculation Engine:**
  - Built `DashboardService` (`backend/app/services/dashboard_service.py`) and schemas (`backend/app/schemas/dashboard.py`):
    - **Budget Velocity & Burn Rate:** Total budget vs total spent, remaining budget, percentage used, budget status (`ON_TRACK` <75%, `CAUTION` 75-99%, `OVER_BUDGET` >=100%, `NO_BUDGET`).
    - **Daily Spend Analytics:** Average daily spend, remaining daily budget allowance, total trip days, days elapsed, days remaining.
    - **Category Spending Distribution:** Category ranking by spend, percentage of total pool, and count of transactions.
    - **Daily Timeline Trends:** Grouped date spend aggregation for chart scaling.
    - **Member Spending Contributions:** Leaderboard with total paid, percentage of total pool, share, and net balance.
    - **Quick Activity Widgets:** Top 5 largest expenses, top 5 recent expenses, and settlements summary KPI.
* **Backend API:**
  - `GET /api/trips/{trip_id}/dashboard`: Centralized trip analytics payload.
* **Frontend UI:**
  - Built `TripDashboardTab.tsx` with animated budget velocity meter, color-coded threshold alerts, segmented multi-color category bar, responsive daily spending timeline histogram, member spend contribution cards, and largest expenses list.
  - Updated `TripOverviewPage.tsx` with primary **Dashboard** tab (`Dashboard`, `Expenses`, `Balances & Settlements`, `Companions`).
* **Automated Tests:**
  - Added `backend/tests/test_dashboard.py` testing financial metrics parity, category distributions, largest expenses, and timeline trends.
  - Overall test suite: 24/24 tests passing. Frontend build: 0 TypeScript errors.

---

## 4. Changelog & Activity Log

### [2026-09-22]
- **Implemented Phase 9 (Settlement Management) & Phase 10 (Budget & Trip Dashboard):**
  - Designed and executed Alembic migration `005_add_settlements.py`.
  - Built `Settlement` model, repository, and service with authorization and balance ledger integration.
  - Integrated paid settlements into `balance_service.py` ensuring $\sum \text{Net Balances} = 0.00$.
  - Built API endpoints in `backend/app/api/settlements.py` and `backend/app/api/dashboard.py`.
  - Created frontend components: `RecordSettlementModal`, `SettlementHistoryList`, and `TripDashboardTab`.
  - Integrated 1-click "Record Payment" button on suggested transfers in `BalancesTab`.
  - Added formatted WhatsApp settlement receipt sharing in `whatsapp.ts`.
  - Added `test_settlements.py` and `test_dashboard.py` (24/24 Pytest tests passing).
  - Validated live server via `test_live_phase9_10.py` (100% assertions passed).
  - Compiled frontend production bundle (`npm run build`) with 0 errors.
- **Implemented Phase 7 (Expense Management) & Phase 8 (Balance & Settlement Engine):**
  - Designed and executed Alembic migration `004_add_expenses_and_splits.py`.
  - Built decimal-safe calculation engine `split_calculator.py` supporting Equal, Exact, Percentage, and Shares splits.
  - Implemented `Expense` and `ExpenseSplit` models, repository, and service with hybrid actor authorization.
  - Implemented `BalanceService` with net balance calculation (`Total Paid - Total Share`) and graph-based greedy debt minimization.
  - Built API routes in `backend/app/api/expenses.py` under `/api/trips/{trip_id}/expenses` and `/api/trips/{trip_id}/balances`.
  - Built interactive frontend components: `ExpenseModal`, `ExpenseDetailModal`, and `BalancesTab`.
  - Added outbound WhatsApp sharing generators in `whatsapp.ts` for expense breakdowns and settlement reminders.
  - Revamped `TripOverviewPage` with dynamic tabs (Expenses, Balances & Settlements, Companions) and real-time budget meter.
  - Created 2 new test modules: `test_expenses.py` and `test_balances.py`. All 22 backend tests passing.
  - Verified frontend build with 0 TypeScript errors.
- **Implemented Phase 5 (Invite System):**
  - Created Alembic migration `003_add_trip_invites.py` and executed database upgrade.
  - Created Pydantic schemas in `backend/app/schemas/invite.py`.
  - Created database repository `backend/app/repositories/invite_repository.py`.
  - Built service logic in `backend/app/services/invite_service.py` with SHA-256 token hashing, expiration checks, and token join handlers.
  - Implemented routers: `backend/app/api/invites.py` and extended `backend/app/api/trips.py`.
  - Built frontend `ManageInvitesModal`, updated `JoinTripPage`, and integrated active token links with `WhatsAppShareModal`.
  - Added 2 new comprehensive integration tests in `backend/tests/test_invites.py` (20/20 tests passing).
  - Verified frontend production build (`npm run build`) with 0 errors.
- **Implemented Phase 4 (Hybrid Membership) & Integrated with Phase 6 (WhatsApp Trip Sharing):**
  - Added guest security utilities in `backend/app/security/guest_auth.py` (signed guest tokens, token hashing).
  - Implemented `AuthActor` and `get_current_actor` dependency supporting registered users and guest actors.
  - Added endpoints: `POST /api/trips/{id}/join-guest`, `POST /api/trips/{id}/members/guest`, `POST /api/trips/{id}/convert-guest`, `GET /api/trips/{id}/guest-session`.
  - Enforced strict guest isolation (access restricted solely to assigned trip; foreign trip access blocked with 403 Forbidden).
  - Built frontend `ConvertGuestModal` for claiming accounts and preserving historical data.
  - Added quick guest join on `JoinTripPage` (`/join/:id`) to provide frictionless 1-click onboarding for WhatsApp recipients.
  - Updated `Navbar` and `TripOverviewPage` with guest badges, banners, and tabbed companion additions.
  - Created `backend/tests/test_guest_conversion.py` with 4 new tests. 18/18 Pytest tests passing.
  - Clean frontend production build (`npm run build`) with 0 errors.
- **Fixed Date Picker Section & Missing WhatsApp Invitation System (User Request & Phase 6):**
  - Resolved non-functional date inputs in Tailwind dark mode via `[color-scheme:dark]` and automated `showPicker()`.
  - Added quick presets and duration preview on trip creation.
  - Added date editing inputs to `TripOverviewPage` edit settings modal.
  - Implemented client-side WhatsApp invitation generator and share modal (`WhatsAppShareModal`).
  - Added `/join/:id` public preview and backend endpoints (`/api/trips/{id}/invite`, `/api/trips/{id}/join`).
  - Verified with 14/14 Pytest tests passing and clean `npm run build`.
- **Implemented Phase 2 (Friends & Groups):**
  - Added `FriendRequest`, `Group`, `GroupMember` database models.
  - Added friend request lifecycle and group roster management endpoints.
  - Added `FriendsPage` and `GroupsPage` frontend views with live search and member management.
  - Added automated tests in `test_friends.py` and `test_groups.py`.
- **Implemented Phase 3 (Trip Management):**
  - Added `Trip` and `TripMember` models with decimal-safe financial budget.
  - Added trip creation with automatic `OWNER` role and batch friend/group member selection.
  - Added `TripsPage`, `CreateTripPage`, and `TripOverviewPage` frontend views.
  - Added automated tests in `test_trips.py`.
  - Applied Alembic migration `002_friends_groups_trips`.
  - Tested entire suite (14/14 tests passing).
  - Built frontend with `npm run build` — 0 errors.
  - Updated `project_status.md`.

