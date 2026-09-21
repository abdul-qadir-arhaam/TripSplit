# Project Development Phases

# Trip Finance

This document defines the complete development roadmap for the Trip Finance application.

The project must be developed **one phase at a time**.

Each phase should be completed, tested, and verified before moving to the next phase.

Do not implement features from future phases early unless they are strictly required as a dependency for the current phase.

---

# 1. Development Strategy

The project is divided into the following stages:

```text
Phase 0   → Project Foundation
Phase 1   → Authentication
Phase 2   → Friends & Groups
Phase 3   → Trip Management
Phase 4   → Hybrid Membership
Phase 5   → Invite System
Phase 6   → WhatsApp Trip Sharing
Phase 7   → Expense Management
Phase 8   → Balance & Settlement Engine
Phase 9   → Settlement Management
Phase 10  → Budget & Trip Dashboard
Phase 11  → Location-Based Expenses
Phase 12  → Location Analytics
Phase 13  → WhatsApp Expense & Settlement Sharing
Phase 14  → Receipt Management
Phase 15  → Receipt OCR
Phase 16  → Advanced Analytics
Phase 17  → Data Science & AI
Phase 18  → Notifications
Phase 19  → Export System
Phase 20  → Offline Support
Phase 21  → Security & Production Hardening
Phase 22  → Testing & QA
Phase 23  → Deployment
```

---

# 2. Phase Completion Rule

A phase is considered complete only when:

* Required functionality is implemented.
* Backend API is working.
* Frontend UI is working.
* Database changes are implemented.
* Database migrations work.
* Authentication/authorization is implemented where required.
* Validation is implemented.
* Error handling is implemented.
* Required tests pass.
* Frontend builds successfully.
* Backend starts successfully.
* No major runtime errors remain.
* The feature works through the actual UI.
* Existing functionality has not been broken.

After completing a phase, provide:

```text
Phase completed
Features implemented
Files changed
Database changes
API changes
Tests performed
Build status
Known limitations
Next phase
```

---

# 3. Phase 0 — Project Foundation

## Objective

Create the basic full-stack project structure and development environment.

## Features

### Repository

Create:

```text
trip-finance/
├── frontend/
├── backend/
├── docs/
└── scripts/
```

Create:

```text
README.md
PRD.md
ARCHITECTURE.md
PHASES.md
.env.example
.gitignore
docker-compose.yml
```

### Frontend

Set up:

* React.
* TypeScript.
* Vite.
* Tailwind CSS.
* React Router.
* TanStack Query.
* Basic application layout.

### Backend

Set up:

* Python.
* FastAPI.
* SQLAlchemy.
* Pydantic.
* Alembic.
* Environment configuration.

### Database

Set up:

* PostgreSQL.
* Database connection.
* SQLAlchemy configuration.
* Alembic migrations.

### Basic Health Check

Create:

```text
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

## Testing

Verify:

* Frontend starts.
* Backend starts.
* Database connects.
* API health endpoint works.
* Frontend can communicate with backend.

## Deliverable

A clean full-stack project skeleton with working frontend, backend, and database connection.

---

# 4. Phase 1 — Authentication & User Profiles

## Objective

Implement registered user accounts.

## Features

### Registration

Users can:

* Enter name.
* Enter email.
* Enter password.
* Create account.

### Login

Users can:

* Enter email.
* Enter password.
* Login.

### Logout

Users can securely logout.

### Current User

Implement:

```text
GET /api/auth/me
```

### Profile

Users can:

* View profile.
* Update name.
* Update profile photo foundation.

## Security

Implement:

* Password hashing.
* Secure authentication.
* Session/token handling.
* Protected routes.

## Frontend

Create:

```text
Login
Register
Dashboard
Profile
```

## Testing

Test:

* Successful registration.
* Duplicate email.
* Incorrect password.
* Login.
* Logout.
* Protected routes.
* Current user endpoint.

## Deliverable

A working authentication system.

---

# 5. Phase 2 — Friends & Groups

## Objective

Allow registered users to organize people they frequently travel with.

---

## Friends

Implement:

* Search users.
* Send friend request.
* Accept request.
* Decline request.
* Remove friend.
* View friends.
* View pending requests.

### Friend Request States

```text
PENDING
ACCEPTED
DECLINED
```

---

## Groups

Implement:

* Create group.
* Rename group.
* Add members.
* Remove members.
* Delete group.
* View group members.

Example groups:

```text
.zip
College Friends
Cricket Friends
Nova Team
Family
```

Groups are convenience collections and do not automatically create trips.

## Testing

Test:

* Friend request.
* Accept.
* Decline.
* Remove friend.
* Group creation.
* Group membership.
* Authorization.

## Deliverable

Users can maintain friends and reusable groups.

---

# 6. Phase 3 — Trip Management

## Objective

Implement the basic trip system.

## Create Trip

Trip fields:

* Name.
* Destination.
* Description.
* Start date.
* End date.
* Budget.
* Currency.
* Trip type.

### Trip Types

```text
Vacation
Road Trip
College Outing
Weekend Trip
Event
Other
```

## Trip Features

Users can:

* Create trip.
* View trips.
* View trip.
* Edit trip.
* Delete trip.
* View trip dashboard foundation.

## Trip Ownership

The creator becomes:

```text
OWNER
```

## Member Selection

Allow the owner to select registered friends/groups when creating a trip.

## Testing

Test:

* Trip creation.
* Trip editing.
* Trip deletion.
* Trip ownership.
* Trip access.

## Deliverable

A working trip management system.

---

# 7. Phase 4 — Hybrid Membership

## Objective

Implement registered and guest trip members.

This is an important core feature.

## Member Types

```text
REGISTERED
GUEST
```

---

## Registered Members

Registered users can join trips and have:

```text
user_id
display_name
member_type
role
status
```

---

## Guest Members

Guests should be able to participate without creating an account.

Guest information:

```text
trip_id
display_name
guest credential
member_type
status
role
```

## Guest Access

Guests can:

* View their trip.
* View members.
* Add expenses.
* Participate in splits.
* View balances.
* View settlements.
* Use permitted trip functionality.

Guests cannot:

* Access other trips.
* Access friends.
* Access groups.
* Access private account features.

## Guest Security

Implement secure guest credentials/tokens.

Do not expose sensitive information in URLs.

## Guest-to-Account Conversion

Implement:

```text
Guest
 ↓
Create Account
 ↓
Verify Guest Identity
 ↓
Attach User ID
 ↓
Convert to Registered Member
```

Historical data must remain unchanged.

## Testing

Test:

* Guest creation.
* Guest access.
* Guest isolation.
* Guest expense participation.
* Guest conversion.
* Historical data preservation.

## Deliverable

A secure hybrid membership system.

---

# 8. Phase 5 — Invite System

## Objective

Allow trip owners to invite people using secure links.

## Features

Trip owner can:

* Generate invite.
* View invite.
* Share invite.
* Disable invite.
* Regenerate invite.
* Set optional expiry.
* Optionally require approval.

## Invite Flow

```text
Trip Owner
 ↓
Generate Invite
 ↓
Secure Token
 ↓
Share Link
 ↓
Friend Opens Link
 ↓
Join Page
```

## Join Options

```text
Login / Create Account
OR
Join as Guest
```

## Security

Invite tokens must:

* Be cryptographically random.
* Be non-guessable.
* Be revocable.
* Support expiration.
* Be securely stored.

## Testing

Test:

* Valid invite.
* Invalid invite.
* Expired invite.
* Disabled invite.
* Regenerated invite.
* Registered user joining.
* Guest joining.

## Deliverable

A complete secure trip invitation system.

---

# 9. Phase 6 — WhatsApp Trip Sharing

## Objective

Make trip invitations easy to share through WhatsApp.

## Important Restriction

Do NOT integrate directly with WhatsApp.

Do NOT:

* Read WhatsApp groups.
* Import members.
* Read messages.
* Import contacts.
* Synchronize conversations.

## Feature

Create:

```text
Share on WhatsApp
```

The application generates:

```text
Trip name
Destination
Dates
Invite link
```

Example:

```text
Join our Kerala Trip!

Dates: 20–23 September
Join the trip:
https://app.example.com/join/xxxxx
```

The user then selects the WhatsApp group/contact manually.

## Testing

Verify:

* Correct message generation.
* Correct invite URL.
* WhatsApp share link works.
* No WhatsApp data is accessed.

## Deliverable

One-click WhatsApp trip invitation sharing.

---

# 10. Phase 7 — Expense Management

## Objective

Implement the core expense system.

## Add Expense

Fields:

* Title.
* Amount.
* Currency.
* Category.
* Payer.
* Participants.
* Split method.
* Date/time.
* Location foundation.
* Notes.
* Receipt foundation.

## Categories

```text
Food
Transport
Fuel
Stay
Activities
Tickets
Shopping
Drinks
Emergency
Miscellaneous
```

## Split Methods

Implement:

### Equal

Divide equally.

### Exact

Specify exact amount for each person.

### Percentage

Specify percentage for each person.

### Shares

Specify relative shares.

---

## Expense Validation

Backend must validate:

```text
Total allocations = Expense amount
```

Also:

* No negative values.
* Payer belongs to trip.
* Participants belong to trip.
* Amount must be positive.
* Valid split method.

## Expense CRUD

Implement:

* Create.
* Read.
* Update.
* Delete.
* Search.
* Filter.
* Sort.

## Database

Implement:

```text
Expense
ExpenseSplit
```

## Financial Rule

Use decimal-safe money calculations.

Do not use floating-point values for final financial calculations.

## Testing

Test every split method and invalid split scenarios.

## Deliverable

Complete expense management system.

---

# 11. Phase 8 — Balance & Settlement Engine

## Objective

Automatically determine who owes whom.

## Balance Calculation

For every member:

```text
Net Balance =
Total Paid - Total Share
```

Positive:

```text
Receives money
```

Negative:

```text
Owes money
```

Zero:

```text
Settled
```

## Important Invariant

```text
Sum of all balances = 0
```

---

## Settlement Suggestions

Example:

```text
Qadir +₹1,500
Ahmed -₹900
Sahil -₹600
```

Generate:

```text
Ahmed → Qadir ₹900
Sahil → Qadir ₹600
```

The algorithm should attempt to minimize unnecessary transactions.

## Testing

Test:

* One payer.
* Multiple payers.
* Multiple debtors.
* Multiple creditors.
* Zero balances.
* Complex expense combinations.
* Rounding cases.

## Deliverable

A reliable financial balance and settlement calculation engine.

---

# 12. Phase 9 — Settlement Management

## Objective

Allow users to manage actual settlement records.

## Features

Users can:

* View settlement suggestions.
* Create settlement.
* View settlements.
* Mark settlement as paid.
* Cancel settlement.
* View settlement history.

## Status

```text
PENDING
PAID
CANCELLED
```

## Optional Data

* Payment date.
* Payment method.
* Note.

## Testing

Test:

* Create settlement.
* Mark paid.
* Cancel.
* Invalid amount.
* Invalid members.
* Unauthorized access.

## Deliverable

Complete settlement tracking.

---

# 13. Phase 10 — Budget & Trip Dashboard

## Objective

Create a useful central trip dashboard.

## Budget

Show:

```text
Total Budget
Total Spent
Remaining
Percentage Used
```

Also calculate:

```text
Average Daily Spending
Remaining Daily Budget
```

## Dashboard Sections

### Financial Overview

* Budget.
* Spent.
* Remaining.

### Member Spending

* Total paid.
* Total share.
* Net balance.

### Expenses

* Recent expenses.
* Largest expenses.

### Categories

* Category distribution.

### Settlements

* Pending.
* Completed.

### Trip Summary

* Dates.
* Destination.
* Number of members.

## Testing

Verify dashboard values against database calculations.

## Deliverable

A complete trip overview dashboard.

---

# 14. Phase 11 — Location-Based Expenses

## Objective

Add location intelligence to expenses.

This is one of the main differentiating features of the application.

## Expense Location

Allow users to select:

* Current location.
* Search location.
* Map location.
* Manual location.

Store:

```text
location_name
address
latitude
longitude
place_id
city
area
```

## Location Permission

Request location permission only when the user chooses to use current location.

Do not implement background tracking.

---

## Trip Map

Implement:

* Interactive map.
* Expense markers.
* Marker clustering.
* Category filters.
* Location search.

Clicking a marker shows:

```text
Expense
Amount
Category
Payer
Date
Location
View Expense
```

## Testing

Test:

* Adding location.
* Map display.
* Marker click.
* Filtering.
* Invalid coordinates.
* Expenses without location.

## Deliverable

Location-aware expense management and trip map.

---

# 15. Phase 12 — Location Analytics

## Objective

Analyze spending geographically.

## Features

Show:

* Spending by city.
* Spending by area.
* Spending by location.
* Category by location.

Example:

```text
Kochi
₹8,400

Munnar
₹12,500

Alleppey
₹6,200
```

## Map Analytics

Allow filtering by:

* Category.
* Date.
* Member.
* Location.

## Deliverable

Location-based spending analytics.

---

# 16. Phase 13 — WhatsApp Expense & Settlement Sharing

## Objective

Allow users to share financial information through WhatsApp.

## Expense Sharing

Generate a message containing:

* Trip.
* Expense.
* Amount.
* Payer.
* Participants.
* Individual shares.
* Location.
* App link.

## Settlement Sharing

Generate:

```text
Trip Settlement

Ahmed → Qadir: ₹600
Sahil → Qadir: ₹400
```

## Final Trip Summary

Generate:

* Total spent.
* Budget.
* Number of members.
* Average per person.
* Pending settlements.
* Completed settlements.
* App link.

## Restriction

No direct WhatsApp integration.

## Deliverable

WhatsApp sharing for expenses, settlements, and trip summaries.

---

# 17. Phase 14 — Receipt Management

## Objective

Allow users to attach receipts to expenses.

## Features

* Upload receipt.
* View receipt.
* Replace receipt.
* Delete receipt.

## Supported Types

Initially support common:

```text
JPG
JPEG
PNG
PDF
```

## Storage

Use object storage.

Database stores:

```text
storage_key
filename
mime_type
expense_id
```

## Security

Validate:

* File size.
* MIME type.
* File extension.
* User authorization.

## Deliverable

Working receipt attachment system.

---

# 18. Phase 15 — Receipt OCR

## Objective

Automatically extract useful information from uploaded receipts.

## OCR Fields

Attempt to extract:

* Merchant.
* Date.
* Total.
* Line items.
* Category.

## Flow

```text
Upload Receipt
 ↓
OCR
 ↓
Extract Data
 ↓
Show Suggestions
 ↓
User Reviews
 ↓
User Confirms
 ↓
Save
```

OCR must never silently modify confirmed financial records.

## Error Handling

If OCR fails:

```text
Receipt remains available
Expense remains unchanged
User can manually enter data
```

## Deliverable

Human-confirmed receipt OCR.

---

# 19. Phase 16 — Advanced Analytics

## Objective

Create a comprehensive analytics dashboard.

## Trip Analytics

Implement:

* Total spending.
* Average/person.
* Category distribution.
* Member spending.
* Daily spending.
* Budget usage.
* Largest expenses.
* Settlement statistics.
* Location spending.

## Personal Analytics

For registered users:

* Total trips.
* Total spending.
* Average trip cost.
* Category trends.
* Spending trends.

## Group Analytics

For groups:

* Total group spending.
* Number of trips.
* Average trip cost.
* Category trends.

## Charts

Use appropriate visualizations:

* Pie/donut charts.
* Bar charts.
* Line charts.
* Area charts.
* Tables.
* KPI cards.

## Deliverable

Complete analytics system.

---

# 20. Phase 17 — Data Science & AI Features

## Objective

Add intelligent features using historical expense data.

These features are optional and should only be implemented after the core financial system is reliable.

---

## Automatic Category Prediction

Predict:

```text
Food
Transport
Fuel
Stay
Activities
etc.
```

based on historical data.

The user must be able to override predictions.

---

## Spending Insights

Examples:

```text
Food represents 38% of your trip spending.

Transport spending increased significantly on Day 2.

This is your largest expense so far.
```

Insights must be based on actual stored data.

---

## Duplicate Expense Detection

Detect potentially duplicated:

* Amount.
* Date.
* Merchant/location.
* Payer.
* Similar title.

Show a warning rather than automatically deleting or modifying records.

---

## Spending Prediction

Estimate potential final trip cost using:

* Current spending.
* Days elapsed.
* Days remaining.
* Historical spending patterns.

---

## Budget Prediction

Estimate whether the current spending pattern may exceed the budget.

AI/ML must remain advisory.

It must never silently modify:

* Expenses.
* Splits.
* Balances.
* Settlements.

## Deliverable

Initial data science/AI layer.

---

# 21. Phase 18 — Notifications

## Objective

Keep users informed about important trip events.

## Notification Types

Implement notifications for:

* Expense added.
* Expense edited.
* Someone owes money.
* User owes money.
* Settlement completed.
* Budget threshold.
* Member joined.
* Invite accepted.
* Trip approaching.

## Notification Preferences

Future settings may allow users to enable/disable categories.

## Deliverable

Functional notification system.

---

# 22. Phase 19 — Export System

## Objective

Allow users to export trip financial information.

## Formats

Implement:

```text
CSV
Excel
PDF
```

## Export Contents

Include:

* Trip information.
* Participants.
* Expenses.
* Categories.
* Member spending.
* Budget.
* Balances.
* Settlements.
* Location summary.

## Security

Only authorized trip members should be able to export permitted data.

## Deliverable

Trip financial export system.

---

# 23. Phase 20 — Offline Support

## Objective

Allow basic expense management when internet connectivity is unreliable.

This phase should only be implemented after the online system is stable.

## Features

Potential functionality:

* Cache current trip.
* View cached expenses.
* Add expense offline.
* Queue expense requests.
* Sync when online.
* Retry failed requests.
* Handle duplicate requests.
* Handle conflicts.

## Idempotency

Expense creation should use an idempotency mechanism to prevent duplicate expenses when a request is retried.

## Deliverable

Basic offline-first trip expense functionality.

---

# 24. Phase 21 — Security & Production Hardening

## Objective

Perform a complete security and reliability review.

## Security

Verify:

* Password hashing.
* Authentication.
* Authorization.
* Guest isolation.
* Invite security.
* Input validation.
* File upload security.
* Rate limiting.
* CORS.
* HTTPS configuration.
* Environment secrets.
* SQL injection protection.
* XSS protection.
* CSRF protection where applicable.

## Guest Security

Verify:

* Guest cannot access other trips.
* Guest token cannot be reused incorrectly.
* Guest cannot escalate privileges.
* Guest conversion is secure.

## Invite Security

Verify:

* Random tokens.
* Token expiration.
* Token revocation.
* Rate limiting.
* No sensitive information in URLs.

## Deliverable

Production-ready security baseline.

---

# 25. Phase 22 — Testing & QA

## Objective

Perform complete system testing.

---

## Backend Unit Tests

Test:

* Money calculations.
* Equal split.
* Exact split.
* Percentage split.
* Shares.
* Balance calculation.
* Settlement algorithm.
* Budget calculations.

---

## Integration Tests

Test:

* Database.
* Authentication.
* Trips.
* Members.
* Guests.
* Expenses.
* Settlements.
* Invites.

---

## API Tests

Test every important API endpoint.

---

## Frontend Tests

Test:

* Login.
* Register.
* Trip creation.
* Expense form.
* Split UI.
* Balance UI.
* Settlement UI.
* Guest flow.
* Map.
* Analytics.

---

## End-to-End Test

Run the complete journey:

```text
Register
 ↓
Create Trip
 ↓
Generate Invite
 ↓
Join as Guest
 ↓
Add Expenses
 ↓
Calculate Balances
 ↓
Create Settlement
 ↓
Mark Settlement Paid
 ↓
View Dashboard
 ↓
View Map
 ↓
Share Summary
```

---

## Regression Testing

Verify that new features have not broken:

* Authentication.
* Trips.
* Expenses.
* Balances.
* Settlements.
* Guests.

## Deliverable

A fully tested application with no known critical bugs.

---

# 26. Phase 23 — Deployment

## Objective

Deploy the application for real usage.

## Frontend Deployment

Deploy the React frontend to a suitable hosting platform.

## Backend Deployment

Deploy FastAPI backend to a suitable server/container platform.

## Database

Use managed PostgreSQL for production.

## Storage

Use production object storage for receipts.

## Environment Variables

Configure:

```text
DATABASE_URL
AUTH_SECRET
STORAGE credentials
MAP configuration
OCR configuration
CORS configuration
```

Never commit production secrets.

---

# 27. Production Checklist

Before deployment verify:

```text
[ ] Frontend production build works
[ ] Backend production build works
[ ] Database migrations work
[ ] Environment variables configured
[ ] HTTPS enabled
[ ] Authentication works
[ ] Authorization works
[ ] Guest access works
[ ] Guest conversion works
[ ] Invite links work
[ ] Expenses work
[ ] Split calculations work
[ ] Balance calculations work
[ ] Settlement calculations work
[ ] Budget calculations work
[ ] Map works
[ ] WhatsApp sharing works
[ ] Receipt upload works
[ ] Analytics work
[ ] Error handling works
[ ] Database backups configured
[ ] Logging configured
[ ] Security checks completed
```

---

# 28. MVP Definition

The first usable MVP should contain:

```text
Phase 0  Foundation
Phase 1  Authentication
Phase 2  Friends & Groups
Phase 3  Trip Management
Phase 4  Hybrid Membership
Phase 5  Invite System
Phase 6  WhatsApp Trip Sharing
Phase 7  Expense Management
Phase 8  Balance & Settlement Engine
Phase 9  Settlement Management
Phase 10 Budget & Trip Dashboard
Phase 11 Location-Based Expenses
Phase 13 WhatsApp Expense & Settlement Sharing
```

At this point, the application should already be usable for a real group trip.

---

# 29. Advanced Feature Milestone

After MVP:

```text
Phase 12  Location Analytics
Phase 14  Receipt Management
Phase 15  Receipt OCR
Phase 16  Advanced Analytics
Phase 17  Data Science & AI
```

This milestone transforms the application from an expense manager into a financial analytics platform.

---

# 30. Production Milestone

Final production preparation:

```text
Phase 18  Notifications
Phase 19  Export
Phase 20  Offline Support
Phase 21  Security Hardening
Phase 22  Testing & QA
Phase 23  Deployment
```

---

# 31. Recommended Implementation Order

The implementation order must remain:

```text
0
↓
1
↓
2
↓
3
↓
4
↓
5
↓
6
↓
7
↓
8
↓
9
↓
10
↓
11
↓
12
↓
13
↓
14
↓
15
↓
16
↓
17
↓
18
↓
19
↓
20
↓
21
↓
22
↓
23
```

Do not skip core financial phases.

---

# 32. Phase Dependency Map

```text
Phase 0
   │
   ▼
Phase 1
   │
   ├──────────────► Phase 2
   │                    │
   │                    ▼
   └──────────────► Phase 3
                        │
                        ▼
                     Phase 4
                        │
                        ▼
                     Phase 5
                        │
                        ▼
                     Phase 6
                        │
                        ▼
                     Phase 7
                        │
                        ▼
                     Phase 8
                        │
                        ▼
                     Phase 9
                        │
                        ▼
                    Phase 10
                        │
                        ▼
                    Phase 11
                        │
               ┌────────┴────────┐
               ▼                 ▼
           Phase 12          Phase 13
               │                 │
               └────────┬────────┘
                        ▼
                    Phase 14
                        │
                        ▼
                    Phase 15
                        │
                        ▼
                    Phase 16
                        │
                        ▼
                    Phase 17
                        │
                        ▼
                    Phase 18
                        │
                        ▼
                    Phase 19
                        │
                        ▼
                    Phase 20
                        │
                        ▼
                    Phase 21
                        │
                        ▼
                    Phase 22
                        │
                        ▼
                    Phase 23
```

---

# 33. Development Rules for Antigravity

When implementing this project, the coding agent must follow these rules.

## Rule 1 — Read the Documentation

Before implementing anything, read:

```text
PRD.md
ARCHITECTURE.md
PHASES.md
```

These files are the primary project specification.

---

## Rule 2 — Inspect Existing Code

Before modifying code:

* Inspect the repository.
* Identify implemented features.
* Identify incomplete features.
* Identify existing database migrations.
* Identify existing API endpoints.
* Identify existing frontend routes.

Do not assume the repository is empty.

---

## Rule 3 — Implement One Phase at a Time

Determine the current phase.

Implement only that phase.

Do not automatically implement future phases.

---

## Rule 4 — Preserve Existing Functionality

Do not rewrite working modules unnecessarily.

When adding functionality:

* Reuse existing components.
* Reuse existing services.
* Reuse existing database models where appropriate.
* Avoid duplicate implementations.

---

## Rule 5 — Backend Financial Authority

For all financial operations:

```text
Frontend Preview
        ↓
Backend Validation
        ↓
Backend Calculation
        ↓
Database Transaction
```

The frontend must never be considered the final source of financial truth.

---

## Rule 6 — Test Before Completion

A phase is not complete simply because the code compiles.

Verify the feature through:

* API.
* Database.
* Frontend.
* Actual user flow.

---

## Rule 7 — Fix Errors Before Moving Forward

If the current phase introduces errors:

1. Identify the cause.
2. Fix it.
3. Run tests.
4. Verify existing functionality.
5. Only then mark the phase complete.

---

## Rule 8 — No Premature Complexity

Do not introduce:

* Microservices.
* Kubernetes.
* Complex distributed systems.
* Unnecessary message queues.
* Unnecessary caching.

unless explicitly required by a later phase.

---

# 34. Final Project Milestone

The project is considered complete when the following complete flow works reliably:

```text
User Registration
        ↓
Create Friends
        ↓
Create Group
        ↓
Create Trip
        ↓
Set Budget
        ↓
Generate Invite
        ↓
Share Invite Through WhatsApp
        ↓
Friend Joins
        ↓
Friend Can Join as Guest
        ↓
Members Add Expenses
        ↓
Expenses Can Be Split
        ↓
Locations Can Be Added
        ↓
Trip Map Shows Expenses
        ↓
Balances Are Calculated
        ↓
Settlement Suggestions Generated
        ↓
Members Record Settlements
        ↓
Budget Updates
        ↓
Analytics Update
        ↓
Expense/Settlement Can Be Shared
        ↓
Receipts Can Be Attached
        ↓
Advanced Analytics
        ↓
AI/ML Insights
        ↓
Notifications
        ↓
Export
        ↓
Security Testing
        ↓
Deployment
```

The final product should be a reliable, secure, location-aware, analytics-driven group trip finance platform.
