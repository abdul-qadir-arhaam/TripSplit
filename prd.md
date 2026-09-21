# Product Requirements Document (PRD)

## 1. Product Overview

### Product Name

**Trip Finance**

### Product Type

Web application for managing shared expenses, balances, settlements, budgets, locations, and financial analytics for trips and group outings.

### Product Vision

Trip Finance is a shared financial workspace for friend groups that makes managing trip expenses simple, transparent, and organized.

The application allows a group to create a trip, invite participants, record expenses, split costs, track who owes whom, manage settlements, monitor budgets, visualize spending by location, and analyze spending patterns.

The application is designed to work naturally with how friend groups already communicate, especially through WhatsApp.

**WhatsApp remains the communication platform. Trip Finance becomes the financial management layer.**

The application must **not directly access, read, synchronize, or import WhatsApp groups, messages, members, or contacts**.

Instead, users can share secure trip invitation links, expense summaries, and settlement information through WhatsApp's normal sharing mechanism.

---

# 2. Problem Statement

When friends travel or go on group outings, expenses are usually paid by different people.

For example:

* Person A pays for the hotel.
* Person B pays for food.
* Person C pays for fuel.
* Person A pays for tickets.
* Several people participate in each expense.
* Some expenses are split equally.
* Others require custom amounts or percentages.

At the end of the trip, calculating the actual balances becomes difficult.

Common problems include:

* Forgetting who paid for something.
* Forgetting who participated in an expense.
* Manually calculating splits.
* Confusion about who owes whom.
* Multiple people paying for the same category.
* No centralized record of expenses.
* Difficulty tracking spending against a budget.
* Difficulty understanding where money was spent.
* Manually calculating settlements.
* Lack of useful spending analytics.
* Expense information being scattered across WhatsApp chats, notes, screenshots, and payment apps.

Trip Finance solves these problems through a centralized trip-based financial system.

---

# 3. Goals

## 3.1 Primary Goals

The application must allow users to:

1. Create and manage trips.
2. Add registered users and guests to trips.
3. Invite people using shareable links.
4. Record shared expenses.
5. Support multiple expense-splitting methods.
6. Track who paid each expense.
7. Calculate individual balances automatically.
8. Generate settlement suggestions.
9. Track settlement status.
10. Set and monitor trip budgets.
11. Associate expenses with locations.
12. Display expenses on a map.
13. Provide trip and personal spending analytics.
14. Share trip invitations through WhatsApp.
15. Share expenses and settlement summaries through WhatsApp.
16. Allow guests to participate without creating an account.
17. Allow guests to later create accounts and claim their previous trip data.

---

# 4. Non-Goals

The following features are explicitly outside the core product scope.

## 4.1 Direct WhatsApp Integration

The application must NOT:

* Read WhatsApp messages.
* Read WhatsApp group members.
* Import WhatsApp contacts.
* Automatically import WhatsApp groups.
* Synchronize WhatsApp conversations.
* Access WhatsApp credentials.
* Monitor WhatsApp messages.

Users may only use normal WhatsApp sharing functionality to send generated links or messages.

---

## 4.2 Natural Language Expense Entry

The application will NOT initially support commands such as:

> "Qadir paid ₹850 for dinner for me, Ahmed and Sahil."

Users must enter expenses through structured forms.

---

## 4.3 Trip Memories

The application will NOT include:

* Photo diaries.
* Video diaries.
* Travel journals.
* Memory timelines.
* Social-media-style trip posts.

Receipt images are allowed because they are financial records, not trip memories.

---

## 4.4 Full Payment Gateway

The application will not initially process payments directly.

The system will track:

* Who owes money.
* Who should receive money.
* Whether a settlement has been marked as paid.

Future versions may support UPI/payment links.

---

# 5. Target Users

## 5.1 Trip Owner

The person who creates and manages a trip.

Responsibilities:

* Create trip.
* Edit trip.
* Set budget.
* Manage members.
* Generate invite links.
* Disable invite links.
* View analytics.
* Manage settlements.
* Manage trip settings.

---

## 5.2 Registered User

A user with an account.

Capabilities:

* Create trips.
* Join trips.
* Manage profile.
* Add friends.
* Create groups.
* Add expenses.
* View balances.
* Record settlements.
* View analytics.
* Participate in multiple trips.

---

## 5.3 Guest User

A person who joins a trip without creating an account.

Guests should be able to:

* Join through an invite link.
* Enter their display name.
* View the trip they joined.
* View trip members.
* Add expenses.
* Participate in expense splits.
* View balances.
* View settlements.
* Add locations.
* Upload receipts where permitted.

Guests must NOT have access to:

* Other trips.
* Personal analytics.
* Friends.
* Groups.
* Other users' private account information.

Guests may later create an account and claim their existing trip identity.

---

# 6. Core User Journey

## 6.1 Creating a Trip

User:

1. Logs into the application.
2. Opens dashboard.
3. Selects "Create Trip".
4. Enters:

   * Trip name.
   * Destination.
   * Start date.
   * End date.
   * Budget.
   * Currency.
   * Trip type.
   * Description.
5. Selects friends/group members if desired.
6. Creates the trip.
7. Opens the trip dashboard.
8. Generates an invite link.
9. Shares the link through WhatsApp.

---

# 7. Trip Management

Each trip should contain:

* Trip name.
* Destination.
* Description.
* Start date.
* End date.
* Budget.
* Currency.
* Trip type.
* Owner.
* Members.
* Expenses.
* Balances.
* Settlements.
* Locations.
* Analytics.
* Invite links.

### Supported Trip Types

* Vacation
* Road Trip
* College Outing
* Weekend Trip
* Event
* Other

---

# 8. Friends System

Registered users can maintain a friend list.

### Friend Features

Users can:

* Search users.
* Send friend requests.
* Accept requests.
* Decline requests.
* Remove friends.
* View friend profiles where permitted.

Friendship does not automatically make someone a member of a trip.

Friends are primarily used to simplify participant selection when creating trips and expenses.

---

# 9. Groups System

Users can create reusable groups.

Examples:

* `.zip`
* College Friends
* Cricket Friends
* Nova Team
* Family

Groups are a convenience feature for selecting people.

### Group Features

Users can:

* Create groups.
* Rename groups.
* Add members.
* Remove members.
* Delete groups.
* Use a group when creating a trip.

A group does not automatically create a trip.

---

# 10. Hybrid Trip Membership

Trip membership supports both registered users and guests.

Each trip member must have:

* Internal member ID.
* Display name.
* Member type.
* Optional user ID.
* Trip ID.
* Membership status.
* Role.

### Member Types

```text
REGISTERED
GUEST
```

A guest can later become a registered user without losing historical data.

---

# 11. Guest-to-Account Conversion

Guest users should be able to create an account later.

Example:

1. Guest joins as "Ahmed".
2. Ahmed adds expenses and participates in several splits.
3. Later Ahmed chooses "Create Account".
4. Ahmed creates an account.
5. The application verifies the guest identity.
6. The guest membership is linked to the new user account.
7. Historical expenses, balances, and settlements remain unchanged.

The system must never create duplicate trip membership when converting a guest.

---

# 12. Invite System

Trip owners can generate secure invitation links.

Example:

```text
https://app.example.com/join/<secure-token>
```

The token must be:

* Cryptographically random.
* Non-guessable.
* Stored securely.
* Revocable.
* Optionally expirable.

The URL must not contain sensitive information.

### Invite Options

The trip owner may:

* Generate invite.
* Share invite.
* Disable invite.
* Regenerate invite.
* Set expiration.
* Optionally require owner approval.

---

# 13. WhatsApp Sharing

The application should provide buttons such as:

* Share Trip Invite.
* Share Expense.
* Share Settlement.
* Share Final Trip Summary.

These actions should generate a readable message and open WhatsApp's normal sharing/deep-link mechanism.

The application must not access WhatsApp directly.

### Example Expense Message

```text
Trip: Kerala Trip

Expense: Dinner
Amount: ₹2,400
Paid by: Qadir

Participants:
Qadir - ₹600
Ahmed - ₹600
Sahil - ₹600
Rahul - ₹600

Location:
Kochi

View expense:
[App Link]
```

---

# 14. Expense Management

Expenses are the core feature of the application.

Users can:

* Add expense.
* Edit expense.
* Delete expense.
* View expense.
* Search expenses.
* Filter expenses.
* Sort expenses.

---

# 15. Expense Data

Each expense should contain:

* Expense ID.
* Trip ID.
* Title.
* Amount.
* Currency.
* Category.
* Paid by.
* Participants.
* Split method.
* Individual allocations.
* Date/time.
* Location.
* Notes.
* Receipt.
* Created by.
* Updated by.
* Created timestamp.
* Updated timestamp.

---

# 16. Expense Categories

Default categories:

* Food
* Transport
* Fuel
* Stay
* Activities
* Tickets
* Shopping
* Drinks
* Emergency
* Miscellaneous

The architecture should allow categories to be extended later.

---

# 17. Expense Splitting

The application must support:

### Equal Split

Amount is divided equally among selected participants.

Example:

₹1,000 / 4 people = ₹250 each.

---

### Exact Amount

Users manually enter each participant's amount.

Example:

```text
Qadir: ₹500
Ahmed: ₹300
Sahil: ₹200
```

Total must equal the expense amount.

---

### Percentage

Users enter percentages.

Example:

```text
Qadir: 50%
Ahmed: 30%
Sahil: 20%
```

Total must equal 100%.

---

### Shares

Users specify relative shares.

Example:

```text
Qadir: 2
Ahmed: 1
Sahil: 1
```

Total shares = 4.

Qadir pays 50%, while Ahmed and Sahil pay 25% each.

---

# 18. Financial Validation

The backend is the final authority for financial calculations.

The system must ensure:

```text
sum(all expense splits) = expense amount
```

No negative allocations are allowed.

All participants must belong to the trip.

The payer must belong to the trip.

Money calculations must use decimal-safe arithmetic.

Do NOT use floating-point arithmetic for final financial calculations.

Recommended database type:

```text
NUMERIC(12,2)
```

---

# 19. Balance Calculation

For each trip member:

```text
Net Balance = Total Paid - Total Share
```

Interpretation:

```text
Positive balance → Member should receive money.

Negative balance → Member owes money.

Zero balance → Member is settled.
```

Example:

```text
Qadir: +₹1,000
Ahmed: -₹600
Sahil: -₹400
```

The total balance must always equal:

```text
₹0
```

---

# 20. Settlement System

The application should calculate suggested settlements based on member balances.

Example:

```text
Ahmed owes Qadir ₹600
Sahil owes Qadir ₹400
```

The system should attempt to minimize the number of transactions where practical.

Users can:

* View settlement suggestions.
* Record settlement.
* Mark settlement as paid.
* Cancel settlement.
* View settlement history.

### Settlement Status

```text
PENDING
PAID
CANCELLED
```

Optional fields:

* Payment date.
* Payment method.
* Note.

---

# 21. Trip Budget

Each trip may have a budget.

Dashboard should show:

* Total budget.
* Total spent.
* Remaining budget.
* Percentage used.
* Average daily spending.
* Remaining daily budget.

Example:

```text
Budget: ₹30,000
Spent: ₹18,500
Remaining: ₹11,500
Used: 61.67%
```

Future notifications may be triggered at:

```text
50%
75%
90%
100%
```

---

# 22. Trip Dashboard

The trip dashboard should provide a centralized overview.

It should display:

### Financial Summary

* Total spent.
* Budget.
* Remaining budget.
* Average spend per person.

### Member Summary

* Amount paid by each member.
* Amount owed by each member.
* Amount receivable by each member.

### Expense Summary

* Recent expenses.
* Largest expenses.
* Category distribution.
* Daily spending.

### Settlement Summary

* Pending settlements.
* Completed settlements.

### Location Summary

* Map preview.
* Number of expense locations.
* Spending by location.

---

# 23. Trip Timeline

The application should provide a chronological expense timeline.

Example:

```text
Day 1

09:30 AM
Breakfast — ₹800

12:45 PM
Fuel — ₹1,500

07:30 PM
Dinner — ₹2,400


Day 2

10:00 AM
Tickets — ₹1,200
```

Expenses should be grouped by date.

---

# 24. Location-Based Expenses

Location-based expense tracking is a major product feature.

Each expense may optionally contain:

* Location name.
* Address.
* Latitude.
* Longitude.
* Place ID.
* City/area.

Users can select a location through:

1. Current location.
2. Location search.
3. Map selection.
4. Manual entry.

Location permission must only be requested when needed.

The application must NOT perform continuous/background location tracking.

---

# 25. Trip Map

The trip map displays expenses geographically.

Map features:

* Expense markers.
* Marker clustering.
* Category filtering.
* Location search.
* Expense details.
* Spending by location.

Clicking a marker should show:

* Expense title.
* Amount.
* Category.
* Payer.
* Date.
* Location.
* View Expense action.

---

# 26. Location Analytics

Users should be able to understand where money was spent.

Examples:

```text
Kochi
Total: ₹8,400

Munnar
Total: ₹12,500

Alleppey
Total: ₹6,200
```

The application should support:

* Spending by city.
* Spending by area.
* Spending by location.
* Category by location.

---

# 27. Receipt Management

Users may upload receipts to expenses.

Supported functionality:

* Upload receipt.
* View receipt.
* Replace receipt.
* Delete receipt.

Receipts should be stored in object storage rather than directly inside the database.

The system should validate:

* File type.
* File size.
* Upload authorization.

---

# 28. Receipt OCR

OCR is an advanced feature and should not be required for the MVP.

When enabled, OCR may extract:

* Merchant.
* Date.
* Total.
* Line items.
* Potential category.

The extracted information must be shown to the user for confirmation.

OCR must NEVER silently modify a financial record.

Final financial data must always be confirmed by the user.

---

# 29. Analytics

The application should provide analytics at multiple levels.

## Trip Analytics

* Total spending.
* Average spending per person.
* Category breakdown.
* Member spending.
* Daily spending.
* Budget usage.
* Largest expenses.
* Location spending.

---

## Personal Analytics

Registered users can see:

* Total trips.
* Total personal spending.
* Average trip cost.
* Spending by category.
* Spending trends.

---

## Group Analytics

For reusable groups:

* Total group spending.
* Number of trips.
* Average trip cost.
* Category trends.

Analytics must only use data the user is authorized to access.

---

# 30. Future Data Science Features

The architecture should allow future machine-learning features.

Potential features include:

### Automatic Category Prediction

Predict expense category based on historical expense data.

### Spending Insights

Identify unusual or notable spending patterns.

### Duplicate Expense Detection

Detect potentially duplicated expenses.

### Spending Prediction

Estimate expected final trip spending.

### Budget Prediction

Predict whether the current spending pattern may exceed the budget.

These features must be advisory only.

AI/ML systems must never silently modify financial records.

---

# 31. Notifications

The application may notify users when:

* An expense is added.
* An expense is edited.
* Someone owes them money.
* They owe someone money.
* A settlement is completed.
* Budget threshold is reached.
* A member joins a trip.
* An invite is accepted.
* A trip is approaching.

Notifications should be configurable in future versions.

---

# 32. Audit Logging

Important financial actions should be auditable.

The system should record:

* Actor.
* Entity.
* Entity ID.
* Action.
* Previous value.
* New value.
* Timestamp.

Examples:

```text
Expense Created
Expense Updated
Expense Deleted
Settlement Created
Settlement Marked Paid
Member Added
Member Removed
```

---

# 33. Export

Users should eventually be able to export trip information.

Supported formats:

* CSV
* Excel
* PDF

Exports may contain:

* Trip information.
* Participants.
* Expenses.
* Category summary.
* Member summary.
* Budget summary.
* Settlements.
* Location summary.

Only authorized users may export trip information.

---

# 34. Future Multi-Currency Support

The initial version may use one currency per trip.

The architecture should allow future support for multiple currencies.

Future expense records may contain:

* Original amount.
* Original currency.
* Exchange rate.
* Converted amount.
* Trip base currency.

---

# 35. Future Offline Support

A future version may support offline-first functionality.

Potential functionality:

* Cache current trip.
* Add expenses offline.
* Queue changes locally.
* Synchronize when connection returns.
* Handle duplicate requests.
* Handle conflicts.

This is not required for the initial MVP.

---

# 36. Authentication

Registered users should be able to:

* Register.
* Login.
* Logout.
* View current profile.

Passwords must never be stored in plain text.

Authentication/session implementation must use secure mechanisms.

---

# 37. Authorization

Every protected request must verify authorization.

Users may only access:

* Their own account data.
* Trips they are members of.
* Resources belonging to those trips.

Trip owners receive additional management permissions.

Guest users must be restricted to their specific trip.

---

# 38. Security Requirements

The application must:

* Hash passwords securely.
* Use secure authentication/session tokens.
* Validate all input.
* Authorize every protected resource.
* Protect invite tokens.
* Protect guest credentials.
* Rate-limit invite-related endpoints.
* Validate uploaded files.
* Store secrets in environment variables.
* Never expose database credentials.
* Use HTTPS in production.
* Prevent unauthorized trip access.
* Prevent guest access to other trips.
* Avoid sensitive information in URLs.

---

# 39. Performance Requirements

The system should:

* Paginate large expense lists.
* Use database indexes.
* Lazy-load large datasets.
* Use map marker clustering.
* Avoid unnecessary API requests.
* Cache analytics where appropriate.
* Keep financial calculations on the backend.
* Support reasonable group sizes without noticeable UI slowdown.

---

# 40. Data Integrity Requirements

The financial system must prioritize correctness.

Critical invariants:

### Expense Split

```text
sum(splits) == expense amount
```

### Trip Balance

```text
sum(all member net balances) == 0
```

### Settlement

Settlement amount must be:

```text
> 0
```

### Membership

Expense participants must belong to the trip.

### Payer

Expense payer must belong to the trip.

### Currency

All calculations must respect the trip's supported currency rules.

---

# 41. UI/UX Requirements

The interface should be:

* Modern.
* Clean.
* Responsive.
* Mobile-friendly.
* Desktop-friendly.
* Easy to understand.
* Financially transparent.

The primary user should be able to answer these questions quickly:

1. How much have we spent?
2. How much budget is left?
3. Who paid?
4. Who owes money?
5. Who should receive money?
6. What expenses were recorded?
7. Where did we spend money?
8. What settlements are pending?

---

# 42. Main Application Navigation

Suggested navigation:

```text
Dashboard
Trips
Friends
Groups
Analytics
Profile
```

Inside a trip:

```text
Overview
Expenses
Balances
Settlements
Map
Analytics
Members
Settings
```

---

# 43. Responsive Design

The application must work on:

* Desktop.
* Laptop.
* Tablet.
* Mobile browser.

Expense entry should be especially optimized for mobile because users may record expenses while travelling.

---

# 44. Technology Direction

Recommended initial technology stack:

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* Recharts
* React Leaflet

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* Alembic

### Database

* PostgreSQL

### Storage

* S3-compatible object storage

### Maps

* Leaflet
* OpenStreetMap-compatible provider

### OCR

* Tesseract or PaddleOCR initially

The application should use a **modular monolith architecture** rather than microservices for the initial version.

---

# 45. Core Database Entities

The initial database should contain entities similar to:

```text
User
FriendRequest
Group
GroupMember
Trip
TripMember
Invite
Expense
ExpenseSplit
Settlement
Receipt
AuditLog
```

The exact schema is defined in `ARCHITECTURE.md`.

---

# 46. MVP Scope

The MVP should include:

### Foundation

* Project setup.
* Frontend.
* Backend.
* PostgreSQL.
* Database migrations.

### Authentication

* Registration.
* Login.
* Logout.
* Profile.

### Friends

* Friend requests.
* Accept/decline.
* Friend list.

### Groups

* Create groups.
* Manage group members.

### Trips

* Create trip.
* Edit trip.
* Delete trip.
* Trip dashboard.
* Trip members.

### Hybrid Membership

* Registered members.
* Guest members.
* Guest sessions.
* Guest-to-account conversion.

### Invites

* Secure invite links.
* Guest joining.
* Registered user joining.
* Invite management.

### Expenses

* Add/edit/delete/view.
* Equal split.
* Exact split.
* Percentage split.
* Shares split.
* Expense categories.
* Receipt upload foundation.
* Location.

### Balances

* Automatic balance calculation.
* Settlement suggestions.

### Settlements

* Record settlement.
* Mark paid.
* Settlement history.

### Budget

* Trip budget.
* Spending.
* Remaining budget.
* Budget percentage.

### Location

* Expense locations.
* Trip map.
* Location-based spending.

### WhatsApp

* Share trip invite.
* Share expense.
* Share settlement.

---

# 47. Advanced Features

After the MVP:

* Location analytics.
* Receipt OCR.
* Advanced analytics.
* Personal analytics.
* Group analytics.
* Spending insights.
* Duplicate detection.
* Spending prediction.
* Budget prediction.
* Notifications.
* PDF/Excel/CSV exports.
* Multi-currency.
* Offline support.

---

# 48. Testing Requirements

The project must include tests for:

### Financial Logic

* Equal splitting.
* Exact splitting.
* Percentage splitting.
* Shares splitting.
* Invalid split totals.
* Balance calculation.
* Settlement calculation.

### Authorization

* Trip owner access.
* Member access.
* Guest access.
* Unauthorized trip access.

### Guest Conversion

* Guest identity preservation.
* Historical expense preservation.
* Historical settlement preservation.
* Duplicate membership prevention.

### API

* Authentication.
* Trips.
* Expenses.
* Balances.
* Settlements.
* Invites.

### Frontend

* Expense form.
* Split calculator.
* Dashboard.
* Balance display.
* Guest flow.

---

# 49. Acceptance Criteria

The application is considered functionally ready for MVP when a complete user journey works:

```text
User registers
        ↓
Creates trip
        ↓
Sets budget
        ↓
Generates invite
        ↓
Shares invite through WhatsApp
        ↓
Friend opens invite
        ↓
Friend joins as guest
        ↓
Guest adds expense
        ↓
Registered user adds another expense
        ↓
Expenses are split
        ↓
Balances are calculated
        ↓
Settlement suggestions are generated
        ↓
Members record settlements
        ↓
Trip budget updates
        ↓
Expenses appear on map
        ↓
User can share expense/settlement through WhatsApp
```

All financial calculations must be correct.

Unauthorized users must not access protected trip data.

Guest users must be able to participate without registration.

Guest-to-account conversion must preserve historical data.

---

# 50. Product Principles

The following principles should guide development.

### 1. Financial Accuracy First

Correct calculations are more important than visual features.

### 2. Backend Is the Source of Truth

The backend must validate and calculate financial data.

### 3. Simple Group Participation

Users should not be forced to create accounts just to participate in a trip.

### 4. WhatsApp-Friendly, Not WhatsApp-Dependent

The application should work naturally alongside WhatsApp without attempting to integrate with or access WhatsApp data.

### 5. Location-Aware

Expenses should optionally retain useful location information.

### 6. Privacy by Default

Users should only access data they are authorized to access.

### 7. Explainable Analytics

Financial analytics should clearly show how values were calculated.

### 8. AI Assists, Humans Confirm

Future AI features may provide suggestions and predictions but must never silently modify financial records.

### 9. Modular Development

Features should be implemented in independent modules so the project can evolve without unnecessary rewrites.

### 10. Build for Real Usage

The application should be useful for an actual group trip, not just function as a demonstration CRUD project.

---

# 51. Future Vision

The long-term goal is to evolve Trip Finance from a simple expense splitter into a complete **group travel financial intelligence platform**.

Future versions may combine:

```text
Trip Management
        +
Expense Management
        +
Location Intelligence
        +
Settlement Management
        +
Financial Analytics
        +
Machine Learning
        +
Offline Support
```

The application should remain focused on one core problem:

> **Making shared group-trip finances transparent, accurate, and easy to manage.**
