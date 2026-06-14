# Employee Asset Management System — Use Case Report

## Project Overview

The **Employee Asset Management System** is a full-stack web application that allows organizations to track company-owned assets, manage employee records, and log asset assignments and returns. It uses role-based access to separate what regular users can view versus what Admins can modify.

---

## Tech Stack

| Layer     | Technology                                     |
|-----------|------------------------------------------------|
| Frontend  | React 18 + Vite, React Router v6, Axios        |
| Backend   | FastAPI (Python), SQLAlchemy (raw SQL via text) |
| Database  | Microsoft SQL Server (MSSQL via pyodbc)        |
| Auth      | JWT (HS256), bcrypt password hashing           |
| Hosting   | localhost:5173 (frontend), localhost:8000 (backend) |

---

## Roles

| Role  | Permissions                                                  |
|-------|--------------------------------------------------------------|
| Admin | Full CRUD on employees, assets, asset groups, assignments    |
| User  | Read-only access to all data, no create/update/delete access |

---

## Use Cases

### UC-01 — User Registration
- **Actor**: Admin / New User
- **Trigger**: POST `/api/auth/register`
- **Flow**: Submit username, email, password, role → system checks for duplicate email/username → hashes password with bcrypt → inserts into `Users` table
- **Outcome**: User account created with `IsActive = 1`
- **Error**: 400 if email or username already exists

---

### UC-02 — User Login
- **Actor**: Any User
- **Trigger**: POST `/api/auth/login`
- **Flow**: Submit email + password → system fetches user by email where `IsActive = 1` → verifies bcrypt hash → generates JWT token (8-hour expiry, HS256)
- **Outcome**: Returns `access_token`, `token_type`, `role`, `username`
- **Error**: 401 if credentials are invalid or user is inactive

---

### UC-03 — View My Profile
- **Actor**: Authenticated User
- **Trigger**: GET `/api/auth/me`
- **Flow**: Bearer token extracted → decoded → user fetched from DB
- **Outcome**: Returns `UserID`, `Username`, `Email`, `Role`

---

### UC-04 — View Dashboard
- **Actor**: Authenticated User (any role)
- **Trigger**: Navigate to `/dashboard`
- **Flow**: Frontend fetches employees, assets, and assignments in parallel → computes stats
- **Stats shown**:
  - Total Employees
  - Total Assets
  - Available Assets (Status = 'Available')
  - Assigned Assets (Status = 'Assigned')
  - Total Assignments
  - Active Assignments (IsReturned = 0)
- **Also shows**: Last 6 recent assignments table + Quick Action buttons

---

### UC-05 — Manage Employees (Admin Only)

| Action          | HTTP         | Endpoint                  | Auth     |
|-----------------|--------------|---------------------------|----------|
| List all active | GET          | `/api/employees/`         | User+    |
| Get by ID       | GET          | `/api/employees/{id}`     | User+    |
| Get asset summary | GET        | `/api/employees/{id}/assets` | User+ |
| Create          | POST         | `/api/employees/`         | Admin    |
| Update          | PUT          | `/api/employees/{id}`     | Admin    |
| Deactivate      | DELETE       | `/api/employees/{id}`     | Admin    |

- **Delete** is a **soft delete** — sets `IsActive = 0`, record is NOT removed.
- **Get asset summary** returns: TotalAssigned, CurrentlyHolding, TotalReturned per employee.

---

### UC-06 — Manage Asset Groups (Admin Only)

| Action          | HTTP  | Endpoint                          | Auth  |
|-----------------|-------|-----------------------------------|-------|
| List all groups | GET   | `/api/asset-groups/`              | User+ |
| Get by ID       | GET   | `/api/asset-groups/{id}`          | User+ |
| List assets in group | GET | `/api/asset-groups/{id}/assets` | User+ |
| Create          | POST  | `/api/asset-groups/`              | Admin |
| Update          | PUT   | `/api/asset-groups/{id}`          | Admin |
| Delete          | DELETE| `/api/asset-groups/{id}`          | Admin |

- **Delete** blocked if group still has assets linked to it.
- Group list shows **TotalAssets**, **AvailableCount**, **AssignedCount** per group.

---

### UC-07 — Manage Assets (Admin Only)

| Action         | HTTP   | Endpoint            | Auth  |
|----------------|--------|---------------------|-------|
| List all       | GET    | `/api/assets/`      | User+ |
| Filter by status | GET  | `/api/assets/?status=Available` | User+ |
| Get by ID      | GET    | `/api/assets/{id}`  | User+ |
| Create         | POST   | `/api/assets/`      | Admin |
| Update         | PUT    | `/api/assets/{id}`  | Admin |
| Delete         | DELETE | `/api/assets/{id}`  | Admin |

- Asset is always created with `Status = 'Available'`.
- `AssetCode` and `SerialNumber` must be unique (IntegrityError caught).
- Assets belong to an optional `AssetGroup` via `GroupID`.

---

### UC-08 — Assign Asset to Employee (Admin Only)
- **Actor**: Admin
- **Trigger**: POST `/api/assignments/assign`
- **Flow**:
  1. Check asset exists
  2. Verify `Status = 'Available'` — reject if not
  3. Insert record into `EmployeeAssets` with `IsReturned = 0`
  4. Update `Assets.Status = 'Assigned'`
- **Outcome**: Asset is now locked to that employee

---

### UC-09 — Return Asset (Admin Only)
- **Actor**: Admin
- **Trigger**: PUT `/api/assignments/return/{assignment_id}`
- **Flow**:
  1. Fetch assignment by ID
  2. Reject if already returned (`IsReturned = 1`)
  3. Set `IsReturned = 1`, `ReturnedDate`, update `Remarks`
  4. Update `Assets.Status = 'Available'`
- **Outcome**: Asset is now available for reassignment

---

### UC-10 — View Assignments
- **Actor**: Authenticated User (any role)
- **Trigger**: GET `/api/assignments/` or GET `/api/assignments/employee/{id}`
- **All assignments**: Returns joined data — Employee Name, Department, Asset Name, Asset Type, Assigned/Returned dates
- **By employee**: Filtered view with full asset details per assignment record

---

## Business Rules

1. An asset can only be assigned to **one employee at a time** (enforced by Available/Assigned status check).
2. An asset **cannot be assigned** if its status is not `'Available'`.
3. An asset **cannot be returned** more than once.
4. An employee is **soft-deleted** (never physically removed from DB).
5. An asset group **cannot be deleted** if it still contains assets.
6. Only **Admins** can create, update, or delete any record.
7. JWT tokens expire after **8 hours**.
8. Passwords are hashed with **bcrypt** before storage.

---

## Frontend Pages

| Route          | Page              | Purpose                                      |
|----------------|-------------------|----------------------------------------------|
| `/login`       | LoginPage         | Email/password login form                    |
| `/dashboard`   | DashboardPage     | Stats overview + recent assignments          |
| `/employees`   | EmployeePage      | Employee list, create/edit (Admin)           |
| `/assets`      | AssetPage         | Asset list with status filter, create/edit   |
| `/assignments` | AssignmentPage    | Assignment list, assign/return actions       |

All routes except `/login` are **ProtectedRoute** — redirect to `/login` if no valid token.
