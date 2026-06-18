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
| Theme     | Custom ThemeContext — 3 themes (Classic Blue / Warm Cream / Dark) |
| Reports   | Server-side PDF generation (StreamingResponse) |
| Hosting   | localhost:5173 (frontend), localhost:8000 (backend) |

---

## Roles

| Role  | Permissions                                                              |
|-------|--------------------------------------------------------------------------|
| Admin | Full CRUD on employees, assets, asset groups, assignments; manage return requests; generate PDF reports |
| User  | Read-only access; view own assignments only; submit return requests      |

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

### UC-02 — User Login (Multi-Step Flow)
- **Actor**: Any approved User or Admin
- **Step 1 — Email Check**: POST `/api/auth/check-email`
  - Submit email → returns `{ exists, role, has_password }`
  - If `exists = false` → show "not found" screen
  - If Admin or `has_password = true` → proceed to password entry
  - If `has_password = false` → redirect to Set Password step
- **Step 2 — Password Login**: POST `/api/auth/login`
  - Submit email + password → fetch user by email → check `IsApproved = 1` → check `PasswordHash IS NOT NULL` → verify bcrypt hash → generate JWT (8-hour expiry, HS256)
  - Returns `access_token`, `token_type`, `role`, `username`
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
  - Recent assignments table (last 6 records) only — no stat cards, no Quick Actions sidebar
- **Note**: Dashboard fetches assignments via `GET /api/assignments/` which is role-scoped — Users automatically receive only their own assignments

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
- Admin can download a per-employee **PDF report** via the Download Report button on each row.
- Admin can download a **bulk PDF** of all employees via the Download All PDF button.

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
- Admin can download a per-asset **PDF report** from the Asset page.

---

### UC-08 — Assign Asset to Employee (Admin Only, Multi-Asset)
- **Actor**: Admin
- **Trigger**: POST `/api/assignments/assign` (called once per selected asset)
- **Flow**:
  1. Admin selects employee + one or more available assets via checkboxes + date + remarks
  2. Frontend loops over selected assets, calling assign endpoint for each
  3. Each call: check asset exists → verify `Status = 'Available'` → insert `EmployeeAssets` with `IsReturned = 0` → update `Assets.Status = 'Assigned'`
- **Outcome**: All selected assets are locked to that employee in a single form submit

---

### UC-09 — Return Asset (Admin-Direct)
- **Actor**: Admin
- **Trigger**: PUT `/api/assignments/return/{assignment_id}`
- **Flow**:
  1. Fetch assignment by ID
  2. Reject if already returned (`IsReturned = 1`)
  3. Set `IsReturned = 1`, `ReturnedDate`, update `Remarks`
  4. Update `Assets.Status = 'Available'`
- **Outcome**: Asset is now available for reassignment

---

### UC-10 — View Assignments (Role-Scoped)
- **Actor**: Authenticated User (any role)
- **Trigger**: GET `/api/assignments/`

| Role  | What is returned                                                   |
|-------|--------------------------------------------------------------------|
| Admin | All assignments across all employees (joined view)                 |
| User  | Only assignments where `EmployeeID` matches the logged-in employee |

- **Filter tabs** (frontend): All / Active / Returned
- **All assignments view**: Employee Name, Department, Asset Name, Asset Type, Assigned/Returned dates, Status, Remarks
- **Frontend UI by role**:
  - **Admin**: Full table + Actions column with "Return" button on active rows + "+ Assign Asset" form button
  - **User**: Same table layout but Actions column hidden — no Return button, no Assign form

---

### UC-11 — User: Submit Return Request
- **Actor**: Authenticated User (linked to an employee)
- **Trigger**: POST `/api/assignments/return-request/{assignment_id}`
- **Flow**:
  1. User sees their active assignments
  2. Clicks "Request Return" on an assignment → optionally enters a reason
  3. System checks no pending request already exists for that assignment
  4. Inserts `ReturnRequests` row with `Status = 'Pending'`
- **Outcome**: Admin is notified via the Approvals page; asset remains assigned until Admin approves
- **Error**: 400 if a pending request already exists; 403 if user has no linked EmployeeID
- **Status check**: User can call `GET /api/assignments/my-return-requests` to see pending/approved/ignored status

---

### UC-12 — Admin: Manage Return Requests
- **Actor**: Admin
- **Trigger**: GET `/api/assignments/return-requests` (visible on `PendingUsersPage` / Approvals)
- **Listed fields**: Employee Name, Employee Code, Asset Name, Asset Type, Brand, Request Date, Status, Reason

| Action  | HTTP | Endpoint                                        | Effect                                        |
|---------|------|-------------------------------------------------|-----------------------------------------------|
| Approve | PUT  | `/api/assignments/return-request/approve/{id}`  | Mark assignment returned; free asset; Status → Approved |
| Ignore  | PUT  | `/api/assignments/return-request/ignore/{id}`   | Status → Ignored; asset stays assigned        |

---

### UC-13 — Admin: Approve or Reject Pending Registrations
- **Actor**: Admin
- **Trigger**: GET `/api/auth/pending` → then PUT `/api/auth/approve/{user_id}` or DELETE `/api/auth/reject/{user_id}`

| Action  | HTTP   | Endpoint                          | Body                      |
|---------|--------|-----------------------------------|---------------------------|
| List    | GET    | `/api/auth/pending`               | —                         |
| Approve | PUT    | `/api/auth/approve/{user_id}`     | `{ "EmployeeID": <int> }` |
| Reject  | DELETE | `/api/auth/reject/{user_id}`      | —                         |

- **Approve flow**: Sets `IsApproved = 1` and links `EmployeeID` on the `Users` row → user can now log in
- **Reject flow**: Sets `IsActive = 0` (soft delete)
- **Frontend**: `/approvals` → `PendingUsersPage` — this page also shows the Return Requests panel

---

### UC-14 — Admin: Create Admin Account (Admin Portal)
- **Actor**: Admin
- **Trigger**: POST `/api/auth/admin/create-user` (via `/admin-portal` page)
- **Flow**: Admin provides username, email, password with role forced to `'Admin'` → account created with `IsActive = 1`, `IsApproved = 1` (skips the approval queue)
- **Outcome**: Admin account is immediately active and can log in
- **Error**: 400 if email/username already taken, or if the active-admin count is already at the cap of **5** (`ADMIN_LIMIT`)
- **Frontend**: `/admin-portal` → `AdminPortalPage` — dedicated page for admin account management

---

### UC-15 — Admin: Create User Account Directly
- **Actor**: Admin
- **Trigger**: POST `/api/auth/admin/create-user`
- **Flow**: Admin provides username, email, password, role (`'Admin'` or `'User'`), optional `EmployeeID` → account created with `IsActive = 1`, `IsApproved = 1`
- **Outcome**: Account is immediately active and can log in
- **Error**: 400 if role is not `'Admin'` or `'User'`, or if email/username already taken

---

### UC-16 — Admin: Generate Login for Existing Employee
- **Actor**: Admin
- **Trigger**: POST `/api/auth/generate-login/{employee_id}`
  Also exposed as **"Generate Login"** button on each row in `EmployeePage`
- **Flow**:
  1. Look up employee in `Employees` table by `employee_id`
  2. Check no login already exists for that `EmployeeID` or their email
  3. Derive username from `EmployeeName` (lowercase, no spaces); append `employee_id` if taken
  4. Insert `Users` row with `PasswordHash = NULL`, `IsApproved = 1`, `IsActive = 1`
- **Outcome**: Login account created; employee must use **Set Password** step at login to activate it
- **Error**: 400 if employee not found or login already exists
- **Frontend indicator**: Button changes from "Generate Login" (green) to "Login Created" (red, non-action) after success

---

### UC-17 — Employee: Set Own Password (First Time)
- **Actor**: Employee whose login was generated by Admin (no password yet)
- **Trigger**: POST `/api/auth/set-password` (redirected here automatically by Login multi-step flow when `has_password = false`)
- **Flow**: Submit work email + new password → verify account exists and is active/approved → verify `PasswordHash IS NULL` (reject if password already set) → hash and save
- **Outcome**: `PasswordHash` updated; employee can now log in normally
- **Error**: 400 if email not found, account not approved, or password already set

---

### UC-18 — Admin: Generate PDF Reports
- **Actor**: Admin
- **Trigger**: Buttons on EmployeePage or AssetPage

| Report             | Method | Endpoint                    | Output                        |
|--------------------|--------|-----------------------------|-------------------------------|
| Single employee    | GET    | `/api/reports/employee/{id}` | PDF with employee + asset history |
| All employees      | GET    | `/api/reports/employees`    | PDF list of all employees     |
| Single asset       | GET    | `/api/reports/asset/{id}`   | PDF with asset + assignment history |
| All assets         | GET    | `/api/reports/assets`       | PDF list of all assets        |

- All reports are generated server-side and returned as `application/pdf` with `Content-Disposition: attachment`.

---

### UC-19 — Admin: Manage Users (User Portal)
- **Actor**: Admin
- **Trigger**: `/user-portal` → `UserPortalPage`
- **Flow**:
  1. List every account via GET `/api/auth/users` (returns UserID, Username, Email, Role, IsActive, IsApproved, CreatedDate, EmployeeID)
  2. Client-side **search** (username/email) and **filters** by role, status, and approval
  3. **Create** a user via POST `/api/auth/admin/create-user`
  4. **Edit** a user via PUT `/api/auth/users/{id}` (partial update of username/email/role/IsActive/IsApproved/EmployeeID)
  5. **Reset password** via PUT `/api/auth/users/{id}/reset-password` — clears `PasswordHash` so the user re-sets it on next login
  6. **Delete** via DELETE `/api/auth/users/{id}`

| Action | Method | Endpoint                                   |
|--------|--------|--------------------------------------------|
| List   | GET    | `/api/auth/users`                          |
| Update | PUT    | `/api/auth/users/{id}`                     |
| Reset  | PUT    | `/api/auth/users/{id}/reset-password`      |
| Delete | DELETE | `/api/auth/users/{id}`                     |

- **Error**: 400 if promoting to Admin would exceed the 5-admin cap; 400 "Cannot delete yourself" when deleting your own account

---

### UC-20 — Any User: Change Theme (Settings)
- **Actor**: Any authenticated user
- **Trigger**: `/settings` → `SettingsPage`, or the Navbar gear / theme-toggle icons
- **Flow**: Select one of three themes — **Classic Blue**, **Warm Cream**, **Dark Mode** — each shown with a live mini-preview card
- **Outcome**: `ThemeContext` applies the palette app-wide and persists the choice in `localStorage` (`theme`, plus `prevTheme` for the Navbar Dark toggle). No backend call involved.

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
11. A **generate-login** account has `PasswordHash = NULL`; the employee must use **Set Password** before logging in. The Login page detects this automatically via the `check-email` step.
12. An employee can only have **one login account** — blocked by `EmployeeID` and `Email` uniqueness checks.
13. The `/assets` route is **Admin-only** (`AdminRoute`); regular Users cannot navigate to it.
14. `GET /api/assignments/` is **role-scoped**: Admins see all; Users see only their own assignments (filtered by `EmployeeID` from JWT session).
15. A User can only submit **one pending** return request per assignment at a time.
16. The system allows at most **5 active admins** (`ADMIN_LIMIT`) — enforced when creating an admin or promoting a user to Admin.
17. An admin **cannot delete their own account** via the User Portal.
18. Resetting a user's password clears `PasswordHash` to `NULL`; the user must use the **Set Password** flow on their next login.
19. Theme selection is a **client-only** preference stored in `localStorage` — there is no backend persistence or user-profile field for it.
16. Approving a return request immediately performs the full return (marks `IsReturned = 1`, sets asset `Status = 'Available'`).
17. Ignoring a return request leaves the asset assigned — Admin must confirm separately.

---

## Frontend Pages

| Route           | Page              | Auth Guard      | Purpose                                                             |
|-----------------|-------------------|-----------------|---------------------------------------------------------------------|
| `/login`        | LoginPage         | Public          | Multi-step: email check → password login or set-password flow       |
| `/dashboard`    | DashboardPage     | ProtectedRoute  | Welcome banner + recent assignments (all users); stat cards + Quick Actions (Admin only) |
| `/employees`    | EmployeePage      | ProtectedRoute  | Employee list; Admin can add, deactivate, generate login, download report |
| `/assets`       | AssetPage         | AdminRoute      | Asset list with status filter, create/edit/delete, download report  |
| `/assignments`  | AssignmentPage    | ProtectedRoute  | Assignment list (role-scoped); Admin can assign and return; Users can submit return requests |
| `/approvals`    | PendingUsersPage  | AdminRoute      | Approve/reject self-registered users + manage employee return requests |
| `/user-portal`  | UserPortalPage    | AdminRoute      | Full user CRUD — search/filter by role, status & approval; create, edit, reset password, delete |
| `/admin-portal` | AdminPortalPage   | AdminRoute      | Create Admin accounts directly (max 5 active admins)                |
| `/settings`     | SettingsPage      | ProtectedRoute  | Appearance — pick theme (Classic Blue / Warm Cream / Dark Mode)     |

- **ProtectedRoute** — redirects to `/login` if no valid token (any authenticated user).
- **AdminRoute** — redirects to `/login` if no valid token, and to `/dashboard` if `role !== 'Admin'`.

### Navbar visibility by role

| Nav Link      | User | Admin |
|---------------|------|-------|
| Dashboard     | ✓    | ✓     |
| Employees     | ✓    | ✓     |
| Assets        | —    | ✓     |
| Assignments   | ✓    | ✓     |
| Approvals     | —    | ✓     |
| User Portal   | —    | ✓     |
| Admin Portal  | —    | ✓     |

### In-page action visibility by role

| Page          | Feature                              | User | Admin |
|---------------|--------------------------------------|------|-------|
| Dashboard     | Stat cards (6 metrics)               | —    | ✓     |
| Dashboard     | Quick Actions sidebar                | —    | ✓     |
| Dashboard     | "View All →" link in assignments     | —    | ✓     |
| Dashboard     | Recent assignments table             | ✓    | ✓     |
| Employees     | View Assets (side panel)             | ✓    | ✓     |
| Employees     | Add Employee form / button           | —    | ✓     |
| Employees     | Generate Login button (per row)      | —    | ✓     |
| Employees     | Download Report button (per row)     | —    | ✓     |
| Employees     | Deactivate button (per row)          | —    | ✓     |
| Employees     | Download All PDF button              | —    | ✓     |
| Assignments   | Assignments table (own records only) | ✓    | ✓ (all) |
| Assignments   | Filter tabs (All / Active / Returned)| ✓    | ✓     |
| Assignments   | "+ Assign Asset" multi-select form   | —    | ✓     |
| Assignments   | Actions column (Return button)       | —    | ✓     |
| Assignments   | Request Return button (per row)      | ✓    | —     |
| Approvals     | Pending user approval / rejection    | —    | ✓     |
| Approvals     | Return Requests panel (approve/ignore)| —   | ✓     |
| Admin Portal  | Create Admin account form            | —    | ✓     |
