# Architecture Document

## 1. Project Overview

**Project:** Trip Finance

Trip Finance is a full-stack web application for managing shared expenses during trips and group outings.

The system supports:

* User accounts
* Friends
* Reusable groups
* Trips
* Registered and guest members
* Secure invite links
* Shared expenses
* Multiple splitting methods
* Automatic balances
* Settlement suggestions
* Settlement tracking
* Trip budgets
* Location-based expenses
* Map visualization
* Analytics
* Receipt uploads
* WhatsApp sharing
* Future OCR and ML capabilities

The initial application should use a **modular monolith architecture**.

Do not introduce microservices unless there is a strong future requirement.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Browser        │
                         │                     │
                         │ React + TypeScript  │
                         │ Tailwind CSS        │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │      Backend        │
                         ├─────────────────────┤
                         │ API Layer           │
                         │ Service Layer       │
                         │ Domain Layer        │
                         │ Repository Layer    │
                         │ Security Layer      │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐            ┌──────────────────┐
          │   PostgreSQL     │            │ Object Storage   │
          │                  │            │                  │
          │ Users            │            │ Receipts         │
          │ Trips            │            │ Uploaded files   │
          │ Expenses         │            │                  │
          │ Settlements      │            └──────────────────┘
          │ Analytics data   │
          └──────────────────┘

                    External Services
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
       Map Provider     WhatsApp          OCR Service
       / OpenStreetMap  Share Links       Future
```

---

# 3. Architecture Style

The backend should follow a layered modular-monolith architecture.

```text
Client
  ↓
API Routes
  ↓
Service Layer
  ↓
Domain Layer
  ↓
Repository Layer
  ↓
PostgreSQL
```

Each layer has a specific responsibility.

---

# 4. Layer Responsibilities

## 4.1 Frontend Layer

Responsible for:

* UI.
* Routing.
* Forms.
* User interaction.
* Client-side validation.
* API communication.
* Charts.
* Maps.
* State management.
* Loading/error states.

The frontend must not be the final authority for financial calculations.

---

## 4.2 API Layer

Responsible for:

* HTTP endpoints.
* Authentication extraction.
* Request validation.
* Response serialization.
* Calling services.
* HTTP error handling.

API routes should remain thin.

Business logic should not be placed directly inside route handlers.

---

## 4.3 Service Layer

Responsible for application-level business operations.

Examples:

```text
TripService
ExpenseService
SettlementService
InviteService
FriendService
GroupService
AnalyticsService
```

Services coordinate:

* Validation.
* Domain calculations.
* Repositories.
* Transactions.
* Authorization.

---

## 4.4 Domain Layer

Contains core financial/business logic that should remain independent of HTTP and database implementation.

Examples:

```text
Money
Expense Splitting
Balance Calculation
Settlement Calculation
Budget Calculation
```

This layer should have strong automated test coverage.

---

## 4.5 Repository Layer

Responsible for database access.

Repositories should:

* Query PostgreSQL.
* Insert records.
* Update records.
* Delete records.
* Fetch relationships.

Business logic should not directly write SQL throughout service files.

---

## 4.6 Database Layer

PostgreSQL is the primary relational database.

It stores:

* Users.
* Friends.
* Groups.
* Trips.
* Members.
* Expenses.
* Splits.
* Settlements.
* Receipts metadata.
* Audit logs.

---

# 5. Technology Stack

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
React Router
TanStack Query
Recharts
React Leaflet
```

## Backend

```text
Python
FastAPI
SQLAlchemy
Pydantic
Alembic
```

## Database

```text
PostgreSQL
```

## File Storage

```text
S3-compatible object storage
```

## Maps

```text
Leaflet
OpenStreetMap-compatible provider
```

## OCR

Future:

```text
Tesseract / PaddleOCR / external OCR service
```

---

# 6. Repository Structure

The project should use a monorepo-style structure.

```text
trip-finance/
│
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── PHASES.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── frontend/
│
├── backend/
│
├── docs/
│
└── scripts/
```

---

# 7. Complete Folder Structure

```text
trip-finance/
│
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── PHASES.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── frontend/
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── index.html
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── images/
│   │
│   └── src/
│       │
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       │
│       ├── assets/
│       │   ├── images/
│       │   ├── icons/
│       │   └── fonts/
│       │
│       ├── components/
│       │   │
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Dialog.tsx
│       │   │   ├── Dropdown.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Avatar.tsx
│       │   │   ├── Spinner.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   └── Toast.tsx
│       │   │
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Navbar.tsx
│       │   │   ├── MobileNav.tsx
│       │   │   └── PageHeader.tsx
│       │   │
│       │   ├── forms/
│       │   │   ├── ExpenseForm.tsx
│       │   │   ├── TripForm.tsx
│       │   │   ├── SplitForm.tsx
│       │   │   ├── SettlementForm.tsx
│       │   │   └── InviteForm.tsx
│       │   │
│       │   ├── charts/
│       │   │   ├── SpendingChart.tsx
│       │   │   ├── CategoryChart.tsx
│       │   │   ├── MemberSpendingChart.tsx
│       │   │   ├── DailySpendingChart.tsx
│       │   │   └── BudgetChart.tsx
│       │   │
│       │   ├── map/
│       │   │   ├── TripMap.tsx
│       │   │   ├── ExpenseMarker.tsx
│       │   │   ├── LocationPicker.tsx
│       │   │   └── MapFilters.tsx
│       │   │
│       │   └── common/
│       │       ├── LoadingState.tsx
│       │       ├── ErrorState.tsx
│       │       ├── ConfirmDialog.tsx
│       │       └── ProtectedRoute.tsx
│       │
│       ├── features/
│       │   │
│       │   ├── auth/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   ├── types.ts
│       │   │   └── validation.ts
│       │   │
│       │   ├── users/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── friends/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── groups/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── trips/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   ├── types.ts
│       │   │   └── validation.ts
│       │   │
│       │   ├── members/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── invites/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── expenses/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   ├── types.ts
│       │   │   ├── splitUtils.ts
│       │   │   └── validation.ts
│       │   │
│       │   ├── settlements/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── analytics/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── receipts/
│       │   │   ├── api.ts
│       │   │   ├── hooks.ts
│       │   │   └── types.ts
│       │   │
│       │   └── notifications/
│       │       ├── api.ts
│       │       ├── hooks.ts
│       │       └── types.ts
│       │
│       ├── pages/
│       │   │
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   └── RegisterPage.tsx
│       │   │
│       │   ├── dashboard/
│       │   │   └── DashboardPage.tsx
│       │   │
│       │   ├── trips/
│       │   │   ├── TripsPage.tsx
│       │   │   ├── CreateTripPage.tsx
│       │   │   ├── TripOverviewPage.tsx
│       │   │   ├── TripExpensesPage.tsx
│       │   │   ├── TripBalancesPage.tsx
│       │   │   ├── TripSettlementsPage.tsx
│       │   │   ├── TripMapPage.tsx
│       │   │   ├── TripAnalyticsPage.tsx
│       │   │   ├── TripMembersPage.tsx
│       │   │   └── TripSettingsPage.tsx
│       │   │
│       │   ├── friends/
│       │   │   └── FriendsPage.tsx
│       │   │
│       │   ├── groups/
│       │   │   ├── GroupsPage.tsx
│       │   │   └── GroupDetailsPage.tsx
│       │   │
│       │   ├── invites/
│       │   │   └── JoinTripPage.tsx
│       │   │
│       │   ├── analytics/
│       │   │   └── AnalyticsPage.tsx
│       │   │
│       │   └── profile/
│       │       └── ProfilePage.tsx
│       │
│       ├── services/
│       │   ├── api.ts
│       │   ├── auth.ts
│       │   ├── whatsapp.ts
│       │   └── storage.ts
│       │
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useDebounce.ts
│       │   ├── useGeolocation.ts
│       │   └── usePagination.ts
│       │
│       ├── stores/
│       │   ├── authStore.ts
│       │   ├── tripStore.ts
│       │   └── uiStore.ts
│       │
│       ├── types/
│       │   ├── api.ts
│       │   ├── common.ts
│       │   └── user.ts
│       │
│       ├── utils/
│       │   ├── currency.ts
│       │   ├── dates.ts
│       │   ├── formatting.ts
│       │   ├── validation.ts
│       │   └── whatsapp.ts
│       │
│       └── lib/
│           ├── queryClient.ts
│           ├── router.tsx
│           └── constants.ts
│
│
├── backend/
│   │
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── requirements.txt
│   │
│   ├── app/
│   │   │
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── friend.py
│   │   │   ├── friend_request.py
│   │   │   ├── group.py
│   │   │   ├── group_member.py
│   │   │   ├── trip.py
│   │   │   ├── trip_member.py
│   │   │   ├── invite.py
│   │   │   ├── expense.py
│   │   │   ├── expense_split.py
│   │   │   ├── settlement.py
│   │   │   ├── receipt.py
│   │   │   ├── notification.py
│   │   │   └── audit_log.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── friend.py
│   │   │   ├── group.py
│   │   │   ├── trip.py
│   │   │   ├── member.py
│   │   │   ├── invite.py
│   │   │   ├── expense.py
│   │   │   ├── settlement.py
│   │   │   ├── receipt.py
│   │   │   ├── analytics.py
│   │   │   └── notification.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── friends.py
│   │   │   ├── groups.py
│   │   │   ├── trips.py
│   │   │   ├── members.py
│   │   │   ├── invites.py
│   │   │   ├── expenses.py
│   │   │   ├── settlements.py
│   │   │   ├── analytics.py
│   │   │   ├── receipts.py
│   │   │   ├── notifications.py
│   │   │   └── exports.py
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── friend_service.py
│   │   │   ├── group_service.py
│   │   │   ├── trip_service.py
│   │   │   ├── member_service.py
│   │   │   ├── invite_service.py
│   │   │   ├── expense_service.py
│   │   │   ├── settlement_service.py
│   │   │   ├── location_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── receipt_service.py
│   │   │   ├── notification_service.py
│   │   │   └── export_service.py
│   │   │
│   │   ├── domain/
│   │   │   │
│   │   │   ├── money/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── money.py
│   │   │   │   └── currency.py
│   │   │   │
│   │   │   ├── splitting/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── equal_split.py
│   │   │   │   ├── exact_split.py
│   │   │   │   ├── percentage_split.py
│   │   │   │   └── shares_split.py
│   │   │   │
│   │   │   ├── balances/
│   │   │   │   ├── __init__.py
│   │   │   │   └── balance_calculator.py
│   │   │   │
│   │   │   ├── settlements/
│   │   │   │   ├── __init__.py
│   │   │   │   └── settlement_calculator.py
│   │   │   │
│   │   │   └── budgets/
│   │   │       ├── __init__.py
│   │   │       └── budget_calculator.py
│   │   │
│   │   ├── repositories/
│   │   │   ├── user_repository.py
│   │   │   ├── friend_repository.py
│   │   │   ├── group_repository.py
│   │   │   ├── trip_repository.py
│   │   │   ├── member_repository.py
│   │   │   ├── invite_repository.py
│   │   │   ├── expense_repository.py
│   │   │   ├── settlement_repository.py
│   │   │   ├── receipt_repository.py
│   │   │   └── audit_repository.py
│   │   │
│   │   ├── security/
│   │   │   ├── password.py
│   │   │   ├── authentication.py
│   │   │   ├── authorization.py
│   │   │   ├── guest_auth.py
│   │   │   └── tokens.py
│   │   │
│   │   ├── workers/
│   │   │   ├── __init__.py
│   │   │   ├── ocr_worker.py
│   │   │   ├── notification_worker.py
│   │   │   └── export_worker.py
│   │   │
│   │   └── tests/
│   │       │
│   │       ├── unit/
│   │       │   ├── test_splitting.py
│   │       │   ├── test_balances.py
│   │       │   ├── test_settlements.py
│   │       │   └── test_budget.py
│   │       │
│   │       ├── integration/
│   │       │   ├── test_expenses.py
│   │       │   ├── test_trips.py
│   │       │   ├── test_invites.py
│   │       │   └── test_guest_conversion.py
│   │       │
│   │       └── api/
│   │           ├── test_auth_api.py
│   │           ├── test_trip_api.py
│   │           ├── test_expense_api.py
│   │           └── test_settlement_api.py
│   │
│   └── migrations/
│       │
│       ├── env.py
│       ├── script.py.mako
│       │
│       └── versions/
│           ├── 001_initial_schema.py
│           ├── 002_add_invites.py
│           ├── 003_add_expenses.py
│           └── ...
│
│
├── docs/
│   ├── api.md
│   ├── database.md
│   ├── deployment.md
│   ├── security.md
│   ├── testing.md
│   └── decisions.md
│
│
└── scripts/
    ├── setup.sh
    ├── setup.ps1
    ├── seed_database.py
    └── reset_database.py
```

---

# 8. Frontend Architecture

The frontend uses a feature-oriented architecture.

Each major business feature should have its own folder.

```text
features/
├── auth/
├── users/
├── friends/
├── groups/
├── trips/
├── members/
├── invites/
├── expenses/
├── settlements/
├── analytics/
├── receipts/
└── notifications/
```

A feature may contain:

```text
api.ts
hooks.ts
types.ts
validation.ts
components/
```

Feature-specific business UI should remain inside the feature where practical.

Reusable UI components belong in:

```text
components/ui/
```

---

# 9. Frontend Routing

The application should use React Router.

Suggested routes:

```text
/
├── /login
├── /register
├── /dashboard
│
├── /trips
├── /trips/new
│
├── /trips/:tripId
├── /trips/:tripId/expenses
├── /trips/:tripId/balances
├── /trips/:tripId/settlements
├── /trips/:tripId/map
├── /trips/:tripId/analytics
├── /trips/:tripId/members
└── /trips/:tripId/settings
│
├── /friends
├── /groups
├── /analytics
├── /profile
│
└── /join/:token
```

Protected routes must require appropriate authentication/membership.

---

# 10. Backend Architecture

The backend follows:

```text
API
 ↓
Services
 ↓
Domain
 ↓
Repositories
 ↓
Database
```

Example:

```text
POST /api/trips/{trip_id}/expenses
              ↓
        expenses.py
              ↓
       ExpenseService
              ↓
     Split Calculator
              ↓
      Balance Logic
              ↓
     ExpenseRepository
              ↓
        PostgreSQL
```

---

# 11. API Structure

All API endpoints should use:

```text
/api/
```

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Users

```text
GET   /api/users/me
PATCH /api/users/me
```

## Friends

```text
GET  /api/friends
POST /api/friends/requests
POST /api/friends/requests/{id}/accept
POST /api/friends/requests/{id}/decline
DELETE /api/friends/{id}
```

## Groups

```text
GET    /api/groups
POST   /api/groups
GET    /api/groups/{id}
PATCH  /api/groups/{id}
DELETE /api/groups/{id}

POST   /api/groups/{id}/members
DELETE /api/groups/{id}/members/{user_id}
```

## Trips

```text
GET    /api/trips
POST   /api/trips
GET    /api/trips/{id}
PATCH  /api/trips/{id}
DELETE /api/trips/{id}
```

## Members

```text
GET    /api/trips/{trip_id}/members
POST   /api/trips/{trip_id}/members
DELETE /api/trips/{trip_id}/members/{member_id}
```

## Invites

```text
POST /api/trips/{trip_id}/invites
GET  /api/invites/{token}
POST /api/invites/{token}/join

POST /api/trips/{trip_id}/invites/{id}/disable
POST /api/trips/{trip_id}/invites/{id}/regenerate
```

## Expenses

```text
GET    /api/trips/{trip_id}/expenses
POST   /api/trips/{trip_id}/expenses

GET    /api/trips/{trip_id}/expenses/{expense_id}
PATCH  /api/trips/{trip_id}/expenses/{expense_id}
DELETE /api/trips/{trip_id}/expenses/{expense_id}
```

## Balances

```text
GET /api/trips/{trip_id}/balances
GET /api/trips/{trip_id}/settlement-suggestions
```

## Settlements

```text
GET   /api/trips/{trip_id}/settlements
POST  /api/trips/{trip_id}/settlements
PATCH /api/trips/{trip_id}/settlements/{id}
```

## Analytics

```text
GET /api/trips/{trip_id}/analytics
GET /api/trips/{trip_id}/analytics/categories
GET /api/trips/{trip_id}/analytics/members
GET /api/trips/{trip_id}/analytics/locations
GET /api/users/me/analytics
```

## Receipts

```text
POST   /api/trips/{trip_id}/receipts
GET    /api/trips/{trip_id}/receipts/{id}
DELETE /api/trips/{trip_id}/receipts/{id}
```

## Exports

```text
GET /api/trips/{trip_id}/exports/csv
GET /api/trips/{trip_id}/exports/excel
GET /api/trips/{trip_id}/exports/pdf
```

---

# 12. Database Architecture

PostgreSQL is the source of persistent application data.

## Main Relationships

```text
User
 │
 ├── FriendRequest
 │
 ├── Group
 │     └── GroupMember
 │
 └── Trip
       │
       ├── TripMember
       │
       ├── Invite
       │
       ├── Expense
       │     └── ExpenseSplit
       │
       ├── Settlement
       │
       ├── Receipt
       │
       └── AuditLog
```

---

# 13. Database Entities

## User

```text
id
name
email
password_hash
profile_photo
created_at
updated_at
```

---

## FriendRequest

```text
id
sender_id
receiver_id
status
created_at
updated_at
```

Possible statuses:

```text
PENDING
ACCEPTED
DECLINED
```

---

## Group

```text
id
name
owner_id
created_at
updated_at
```

---

## GroupMember

```text
id
group_id
user_id
created_at
```

---

## Trip

```text
id
name
destination
description
start_date
end_date
budget
currency
trip_type
owner_id
status
created_at
updated_at
```

---

## TripMember

```text
id
trip_id
user_id
display_name
member_type
guest_token_hash
status
role
joined_at
created_at
updated_at
```

`user_id` is nullable for guests.

Possible member types:

```text
REGISTERED
GUEST
```

Possible roles:

```text
OWNER
MEMBER
```

---

## Invite

```text
id
trip_id
token_hash
expires_at
is_active
requires_approval
created_by
created_at
disabled_at
```

Never store the raw invite token if avoidable.

---

## Expense

```text
id
trip_id
title
amount
currency
category
paid_by_member_id

location_name
address
latitude
longitude
place_id

expense_date
notes

created_by
updated_by

created_at
updated_at
```

---

## ExpenseSplit

```text
id
expense_id
member_id
amount
percentage
shares
```

Depending on split type, only the appropriate allocation fields should be used.

---

## Settlement

```text
id
trip_id
from_member_id
to_member_id
amount
currency
status
created_at
paid_at
note
```

---

## Receipt

```text
id
expense_id
storage_key
original_filename
mime_type
ocr_status
ocr_data
created_at
```

---

## AuditLog

```text
id
actor_user_id
trip_id
entity_type
entity_id
action
old_data
new_data
created_at
```

---

# 14. Expense Processing Flow

```text
User opens Add Expense
          ↓
Enter expense details
          ↓
Select payer
          ↓
Select participants
          ↓
Select split method
          ↓
Calculate preview
          ↓
Select location
          ↓
Optional receipt
          ↓
Submit
          ↓
Frontend validation
          ↓
POST API
          ↓
Backend authentication
          ↓
Backend authorization
          ↓
Validate trip membership
          ↓
Validate payer
          ↓
Validate participants
          ↓
Validate split
          ↓
Begin DB transaction
          ↓
Create Expense
          ↓
Create ExpenseSplits
          ↓
Commit transaction
          ↓
Recalculate balances
          ↓
Return response
          ↓
Update dashboard
```

---

# 15. Balance Processing

Balance calculation:

```text
For every trip member:

Total Paid
     -
Total Share
     =
Net Balance
```

Example:

```text
Qadir

Paid = ₹5,000
Share = ₹3,500

Balance = +₹1,500
```

Positive:

```text
Should receive
```

Negative:

```text
Owes
```

The algorithm must guarantee:

```text
sum(all balances) = 0
```

---

# 16. Settlement Algorithm

The settlement service receives member balances.

Example:

```text
Qadir    +1500
Ahmed    -900
Sahil    -600
```

The settlement algorithm produces:

```text
Ahmed → Qadir ₹900
Sahil → Qadir ₹600
```

The algorithm should attempt to reduce the total number of transactions while maintaining exact amounts.

All monetary calculations must use decimal-safe values.

---

# 17. Guest Authentication Architecture

Guests do not need normal accounts.

When a guest joins:

```text
Invite Token
     ↓
Join Validation
     ↓
Guest Display Name
     ↓
Create TripMember
     ↓
Generate Guest Credential
     ↓
Create Guest Session
     ↓
Guest Trip Access
```

The guest credential should be securely generated and stored as a hash.

The guest must only be able to access the associated trip.

---

# 18. Guest Conversion Architecture

```text
Guest
  ↓
Create Account
  ↓
Verify Guest Credential
  ↓
Find TripMember
  ↓
Attach user_id
  ↓
Change member_type
  ↓
REGISTERED
  ↓
Preserve historical records
```

The following must remain unchanged:

* Expenses.
* Expense splits.
* Balances.
* Settlements.
* Audit history.

---

# 19. WhatsApp Architecture

WhatsApp is not an application backend dependency.

The application simply generates shareable content.

```text
Application
     ↓
Generate Message
     ↓
Generate Share URL
     ↓
Open WhatsApp
     ↓
User selects recipient/group
     ↓
User sends message
```

No WhatsApp API credentials are required for this functionality.

The application must not:

* Read WhatsApp.
* Import contacts.
* Import groups.
* Monitor messages.

---

# 20. Location Architecture

When adding an expense:

```text
Expense Form
     ↓
Location Option
     ↓
Current Location / Search / Map / Manual
     ↓
Location Data
     ↓
Expense API
     ↓
PostgreSQL
```

Stored information may include:

```text
location_name
address
latitude
longitude
place_id
city
area
```

The application should not continuously track user location.

---

# 21. Map Architecture

The frontend map receives expense location data from the backend.

```text
PostgreSQL
    ↓
Analytics / Expense API
    ↓
Frontend
    ↓
Leaflet Map
    ↓
Markers
```

For large datasets:

```text
Expense locations
       ↓
Marker clustering
       ↓
Map
```

---

# 22. Analytics Architecture

Analytics should be generated from validated expense data.

```text
PostgreSQL
     ↓
Analytics Service
     ↓
Aggregations
     ↓
API Response
     ↓
TanStack Query
     ↓
Charts / Tables
```

Analytics must not independently modify financial data.

---

# 23. Receipt Architecture

Receipt upload:

```text
User
 ↓
Frontend
 ↓
Backend
 ↓
File Validation
 ↓
Object Storage
 ↓
Receipt Metadata in PostgreSQL
```

Database stores metadata and storage references rather than large binary files.

---

# 24. OCR Architecture

Future OCR flow:

```text
Receipt Upload
      ↓
Object Storage
      ↓
OCR Worker
      ↓
Extract Information
      ↓
OCR Result
      ↓
User Review
      ↓
User Confirmation
      ↓
Expense Data
```

OCR should never automatically change confirmed financial information.

---

# 25. Authentication and Authorization

Authentication verifies:

```text
Who is the user?
```

Authorization verifies:

```text
What is the user allowed to access?
```

Example:

```text
Request
  ↓
Authentication
  ↓
User identity
  ↓
Trip membership check
  ↓
Role check
  ↓
Resource access
```

Every protected endpoint must perform appropriate authorization.

---

# 26. Role Permissions

## Trip Owner

Can:

* Edit trip.
* Delete trip.
* Manage members.
* Generate invites.
* Disable invites.
* View all trip data.
* Manage settlements.
* View analytics.
* Export trip data.

## Registered Member

Can:

* View trip.
* Add expenses.
* Edit permitted expenses.
* View balances.
* Create settlements.
* View analytics allowed to members.

## Guest

Can:

* View joined trip.
* Add expenses.
* Participate in expenses.
* View balances.
* View settlements.
* Use permitted trip features.

Guest access must remain restricted to the associated trip.

---

# 27. API Error Handling

Use consistent API error responses.

Example:

```json
{
  "error": {
    "code": "EXPENSE_SPLIT_INVALID",
    "message": "Expense split amounts must equal the total expense amount."
  }
}
```

Common error categories:

```text
AUTHENTICATION_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
INVALID_SPLIT
INVALID_MEMBER
INVALID_INVITE
DUPLICATE_RESOURCE
RESOURCE_CONFLICT
INTERNAL_ERROR
```

---

# 28. Database Transactions

Financial operations must use database transactions.

Example:

```text
Create Expense
    +
Create Expense Splits
    +
Audit Log
    ↓
Single Transaction
```

If any operation fails:

```text
ROLLBACK
```

No partial financial records should remain.

---

# 29. Database Indexes

Important indexes should include:

```text
Expense.trip_id
Expense.paid_by_member_id
Expense.expense_date

TripMember.trip_id
TripMember.user_id

Settlement.trip_id

Invite.token_hash

FriendRequest.sender_id
FriendRequest.receiver_id
```

Location indexes may be introduced later if required.

---

# 30. State Management

Frontend responsibilities should be divided between:

### Server State

Use TanStack Query for:

* Trips.
* Expenses.
* Members.
* Balances.
* Settlements.
* Analytics.
* Friends.
* Groups.

### Local UI State

Use lightweight state management for:

* Modal state.
* Selected trip.
* Filters.
* Temporary form state.
* UI preferences.

Avoid storing the entire server database in global client state.

---

# 31. Financial Calculation Rule

The frontend may calculate previews for user experience.

However:

```text
Frontend calculation
        ≠
Final financial calculation
```

The backend must recalculate and validate all important financial values.

This prevents manipulated client requests from corrupting financial data.

---

# 32. Security Architecture

Security-sensitive values must never be committed to Git.

Use:

```text
.env
```

and provide:

```text
.env.example
```

Secrets include:

* Database credentials.
* Authentication secrets.
* Object storage credentials.
* External API keys.

Never hard-code secrets in frontend source code.

---

# 33. Environment Structure

Example:

```text
Development
     ↓
.env
     ↓
Local PostgreSQL
     ↓
Local FastAPI
     ↓
Local React
```

Production:

```text
Production Environment
     ↓
Managed PostgreSQL
     ↓
FastAPI Server
     ↓
React Frontend
     ↓
Object Storage
```

---

# 34. Docker Architecture

Docker Compose should be used for local development where practical.

Example:

```text
docker-compose.yml

services:

frontend
backend
postgres
```

Optional future services:

```text
redis
worker
```

Do not add Redis or background workers until they are actually required.

---

# 35. Development Flow

```text
Developer
   ↓
Frontend
   ↓
API Request
   ↓
FastAPI
   ↓
Service
   ↓
Domain Logic
   ↓
Repository
   ↓
PostgreSQL
```

For development:

```text
Frontend → http://localhost:5173
Backend  → http://localhost:8000
API Docs → http://localhost:8000/docs
Database → PostgreSQL
```

The exact ports may be changed if necessary.

---

# 36. Testing Architecture

Testing should exist at multiple levels.

```text
Unit Tests
    ↓
Domain Logic

Integration Tests
    ↓
Services + Database

API Tests
    ↓
HTTP Endpoints

Frontend Tests
    ↓
Components + Features

E2E Tests
    ↓
Complete User Journey
```

Financial domain tests should have the highest priority.

---

# 37. Important Test Scenarios

The following must always be tested:

### Splitting

```text
Equal split
Exact split
Percentage split
Shares split
```

### Validation

```text
Incorrect split total
Negative amount
Negative allocation
Invalid participant
Invalid payer
```

### Balances

```text
Positive balance
Negative balance
Zero balance
Total balance equals zero
```

### Settlements

```text
Simple settlement
Multiple creditors
Multiple debtors
Settlement completion
Settlement cancellation
```

### Guests

```text
Guest join
Guest access
Guest isolation
Guest conversion
Historical data preservation
```

---

# 38. Application Flow

## New User

```text
Landing Page
     ↓
Register
     ↓
Login
     ↓
Dashboard
```

## Create Trip

```text
Dashboard
     ↓
Create Trip
     ↓
Trip Details
     ↓
Select Participants
     ↓
Create
     ↓
Trip Dashboard
```

## Join Trip

```text
WhatsApp
     ↓
Invite Link
     ↓
Join Page
     ↓
Login / Create Account
       OR
Join as Guest
     ↓
Trip Dashboard
```

## Add Expense

```text
Trip
 ↓
Add Expense
 ↓
Details
 ↓
Payer
 ↓
Participants
 ↓
Split
 ↓
Location
 ↓
Receipt
 ↓
Save
```

## Settlement

```text
Trip
 ↓
Balances
 ↓
Settlement Suggestions
 ↓
Create Settlement
 ↓
Mark Paid
```

---

# 39. Complete System Flow

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ React Frontend│
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  FastAPI API  │
                         └───────┬───────┘
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                     ▼                       ▼
              ┌─────────────┐        ┌─────────────┐
              │   Services  │        │   Security  │
              └──────┬──────┘        └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Domain    │
              │    Logic    │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │ Repositories│
              └──────┬──────┘
                     │
             ┌───────┴────────┐
             ▼                ▼
      ┌─────────────┐  ┌──────────────┐
      │ PostgreSQL  │  │Object Storage│
      └─────────────┘  └──────────────┘
```

---

# 40. Architectural Rules

The following rules must be followed during development.

### Rule 1

Do not place business logic directly inside frontend components.

### Rule 2

Do not place complex business logic directly inside FastAPI route handlers.

### Rule 3

Financial calculations belong in the backend domain/service layer.

### Rule 4

Use database transactions for financial operations.

### Rule 5

Never use floating-point arithmetic for final money calculations.

### Rule 6

Every protected API endpoint must perform authorization.

### Rule 7

Guest users must only access their associated trip.

### Rule 8

WhatsApp must only be used through normal sharing/deep-link mechanisms.

### Rule 9

Do not implement direct WhatsApp synchronization.

### Rule 10

Do not introduce microservices for the MVP.

### Rule 11

Do not implement future features before their designated development phase unless required as a dependency.

### Rule 12

Do not unnecessarily rewrite working modules when implementing a new feature.

### Rule 13

Every new feature must include appropriate validation and error handling.

### Rule 14

Financial logic must have automated tests.

### Rule 15

API contracts should remain consistent between frontend and backend.

---

# 41. Scalability Strategy

The initial architecture should be a modular monolith.

Future scaling can happen by:

```text
Optimize Database
       ↓
Add Caching
       ↓
Add Background Workers
       ↓
Separate Heavy Services
       ↓
Introduce Microservices Only If Necessary
```

Do not prematurely introduce distributed architecture.

---

# 42. Future Architecture Extensions

Potential future modules:

```text
ML Service
Notification Service
OCR Worker
Recommendation Engine
Offline Sync Engine
Payment Integration
Multi-Currency Engine
```

These should initially remain modular components inside the existing backend.

---

# 43. Architecture Priority

When making implementation decisions, prioritize:

```text
1. Financial correctness
2. Security
3. Data integrity
4. Authorization
5. Reliability
6. Maintainability
7. Performance
8. UI polish
9. Advanced intelligence
```

The application should first become a reliable expense and settlement system before advanced AI/ML functionality is introduced.

---

# 44. Final Architecture Principle

The project should remain a **clean, modular, secure, and financially accurate full-stack application**.

The most important architectural boundary is:

```text
Frontend
   ↓
User Experience

Backend
   ↓
Business Rules + Financial Truth

Database
   ↓
Persistent Source of Data
```

The frontend makes the application easy to use.

The backend guarantees correctness.

The database preserves the financial history.

All future features should respect this separation.
