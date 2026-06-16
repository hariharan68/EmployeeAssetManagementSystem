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

### UC-01 — User Self-Registration (Pending Approval)
- **Actor**: New User (public)
- **Trigger**: POST `/api/auth/register`
- **Flow**: Submit username, email, password → system checks for duplicate email/username → hashes password with bcrypt → inserts into `Users` with `Role = 'User'`, `IsActive = 1`, `IsApproved = 0`
- **Outcome**: Registration submitted; account is **inactive until an Admin approves it**
- **Error**: 400 if email or username already exists
- **Note**: The `role` field in the payload is accepted but overridden to `'User'` — self-registrations can never self-assign Admin role

---

### UC-02 — User Login
- **Actor**: Any approved User or Admin
- **Trigger**: POST `/api/auth/login`
- **Flow**: Submit email + password → fetch user by email where `IsActive = 1` → check `IsApproved = 1` (reject with "pending approval" if not) → check `PasswordHash IS NOT NULL` (reject if employee hasn't set password yet) → verify bcrypt hash → generate JWT (8-hour expiry, HS256)
- **Outcome**: Returns `access_token`, `token_type`, `role`, `username`
- **Errors**:
  - 401 if credentials are invalid or user is inactive
  - 401 "Your account is pending admin approval" if `IsApproved = 0`
  - 401 "Password not set yet. Please set your password first." if `PasswordHash` is NULL

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
- **Admin view**:
  - Welcome banner with username and role indicator
  - 6 stat cards (clickable, navigate to relevant page): Total Employees, Total Assets, Available Assets, Assigned Assets, Total Assignments, Active Assignments
  - Recent assignments table (last 6 records) with a "View All →" link
  - Quick Actions sidebar: Add Employee, Add Asset, Assign Asset, View All Assets
- **User (non-Admin) view**:
  - Welcome banner with username and role indicator
  - Recent assignments table (last 6 records) only — no stat cards, no "View All" link, no Quick Actions sidebar
- **Note**: Stat cards and Quick Actions panel are hidden from regular Users in the frontend; data is still fetched but not rendered

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
- **Frontend UI by role**:
  - **Admin**: Sees full table including an **Actions** column with a "Return" button on each active assignment; also sees the "+ Assign Asset" button to open the assign form
  - **User**: Sees the same assignment table but the Actions column is hidden — no Return button, no Assign form button

---

### UC-11 — Admin: Approve or Reject Pending Registrations
- **Actor**: Admin
- **Trigger**: GET `/api/auth/pending` → then PUT `/api/auth/approve/{user_id}` or DELETE `/api/auth/reject/{user_id}`

| Action  | HTTP   | Endpoint                          | Body                      |
|---------|--------|-----------------------------------|---------------------------|
| List    | GET    | `/api/auth/pending`               | —                         |
| Approve | PUT    | `/api/auth/approve/{user_id}`     | `{ "EmployeeID": <int> }` |
| Reject  | DELETE | `/api/auth/reject/{user_id}`      | —                         |

- **Approve flow**: Sets `IsApproved = 1` and links `EmployeeID` on the `Users` row → user can now log in
- **Reject flow**: Sets `IsActive = 0` (soft delete) — user cannot log in or re-register with same email
- **Frontend**: `/approvals` → `PendingUsersPage` (Admin-only route); page header action button labelled "+ Add Admin" (creates a new Admin or User account directly)

---

### UC-12 — Admin: Create User or Admin Account Directly
- **Actor**: Admin
- **Trigger**: POST `/api/auth/admin/create-user`
- **Flow**: Admin provides username, email, password, role (`'Admin'` or `'User'`), optional `EmployeeID` → account created with `IsActive = 1`, `IsApproved = 1` (skips the approval queue)
- **Outcome**: Account is immediately active and can log in
- **Error**: 400 if role is not `'Admin'` or `'User'`, or if email/username already taken

---

### UC-13 — Admin: Generate Login for Existing Employee
- **Actor**: Admin
- **Trigger**: POST `/api/auth/generate-login/{employee_id}`  
  Also exposed as **"Generate Login"** button on each row in `EmployeePage`
- **Flow**:
  1. Look up employee in `Employees` table by `employee_id`
  2. Check no login already exists for that `EmployeeID` or their email
  3. Derive username from `EmployeeName` (lowercase, no spaces); append `employee_id` if taken
  4. Insert `Users` row with `PasswordHash = NULL`, `IsApproved = 1`, `IsActive = 1`
- **Outcome**: Login account created; employee must visit **Set Password** tab on `LoginPage` to activate it
- **Error**: 400 if employee not found or login already exists
- **Frontend indicator**: Button changes from "Generate Login" (green) to "Login Created" (red, non-action) after success

---

### UC-14 — Employee: Set Own Password (First Time)
- **Actor**: Employee whose login was generated by Admin (no password yet)
- **Trigger**: POST `/api/auth/set-password`
- **Flow**: Submit work email + new password → verify account exists and is active/approved → verify `PasswordHash IS NULL` (reject if password already set) → hash and save
- **Outcome**: `PasswordHash` updated; employee can now log in normally
- **Error**: 400 if email not found, account not approved, or password already set
- **Frontend**: "Set Password" tab on `LoginPage` (no authentication required)

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
9. Self-registered users start with `IsApproved = 0` and **cannot log in** until an Admin approves them.
10. Admin-created accounts and generate-login accounts are auto-approved (`IsApproved = 1`).
11. A **generate-login** account has `PasswordHash = NULL`; the employee must use **Set Password** before logging in.
12. An employee can only have **one login account** — blocked by `EmployeeID` and `Email` uniqueness checks.
13. The `/assets` route is **Admin-only** (`AdminRoute`); regular Users cannot navigate to it.

---

## Frontend Pages

| Route          | Page              | Auth Guard      | Purpose                                                  |
|----------------|-------------------|-----------------|----------------------------------------------------------|
| `/login`       | LoginPage         | Public          | Sign In tab + Set Password tab (first-time employees)    |
| `/dashboard`   | DashboardPage     | ProtectedRoute  | Welcome banner + recent assignments (all users); stat cards + Quick Actions panel (Admin only) |
| `/employees`   | EmployeePage      | ProtectedRoute  | Employee list; Admin can add, deactivate, generate login |
| `/assets`      | AdminRoute        | Admin only      | Asset list with status filter, create/edit/delete        |
| `/assignments` | AssignmentPage    | ProtectedRoute  | Assignment list (all users); Admin can assign assets and return them via Actions column |
| `/approvals`   | PendingUsersPage  | AdminRoute      | Approve or reject self-registered users                  |

- **ProtectedRoute** — redirects to `/login` if no valid token (any authenticated user).
- **AdminRoute** — redirects to `/login` if no valid token, and to `/dashboard` if `role !== 'Admin'`.

### Navbar visibility by role

| Nav Link    | User | Admin |
|-------------|------|-------|
| Dashboard   | ✓    | ✓     |
| Employees   | ✓    | ✓     |
| Assets      | —    | ✓     |
| Assignments | ✓    | ✓     |
| Approvals   | —    | ✓     |

### In-page action visibility by role

| Page        | Feature                              | User | Admin |
|-------------|--------------------------------------|------|-------|
| Dashboard   | Stat cards (6 metrics)               | —    | ✓     |
| Dashboard   | Quick Actions sidebar                | —    | ✓     |
| Dashboard   | "View All →" link in assignments     | —    | ✓     |
| Dashboard   | Recent assignments table             | ✓    | ✓     |
| Employees   | View Assets (side panel)             | ✓    | ✓     |
| Employees   | Add Employee form / button           | —    | ✓     |
| Employees   | Generate Login button (per row)      | —    | ✓     |
| Employees   | Download Report button (per row)     | —    | ✓     |
| Employees   | Deactivate button (per row)          | —    | ✓     |
| Employees   | Download All PDF button              | —    | ✓     |
| Assignments | Assignments table (read)             | ✓    | ✓     |
| Assignments | "+ Assign Asset" button + form       | —    | ✓     |
| Assignments | Actions column (Return button)       | —    | ✓     |
