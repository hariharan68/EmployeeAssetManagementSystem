# Employee Asset Management System — Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                            │
│                     React + Vite  :5173                             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │LoginPage │  │Dashboard │  │Employees │  │Assets/Assignments│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
│  ┌──────────┐  ┌────────────────┐  ┌────────────┐  ┌──────────┐    │
│  │Approvals │  │  AdminPortal   │  │ UserPortal │  │ Settings │    │
│  │(Pending) │  │(create admins) │  │(user CRUD) │  │ (themes) │    │
│  └──────────┘  └────────────────┘  └────────────┘  └──────────┘    │
│                                                                     │
│                    ┌─────────▼──────────┐                           │
│                    │   AuthContext.jsx   │ ← token, role, username  │
│                    │  (React Context)    │   persisted in           │
│                    │                    │   localStorage            │
│                    └─────────┬──────────┘                           │
│                    ┌─────────▼──────────┐                           │
│                    │  ThemeContext.jsx   │ ← theme string           │
│                    │                    │   (light/warm/dark)       │
│                    │                    │   + getTheme() palette    │
│                    └─────────┬──────────┘                           │
│                    ┌─────────▼──────────┐                           │
│                    │  axiosInstance.js   │ ← attaches Bearer token  │
│                    │  (Axios + intercept)│   to every request       │
│                    └─────────┬──────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP/REST  (JSON)
                               │ CORS: allow_origin_regex
                               │   r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend  :8000                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        main.py                               │   │
│  │   CORSMiddleware (regex) → Router registration               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐    │
│  │  auth/      │  │  routes/     │  │  auth/dependencies.py    │    │
│  │  router.py  │  │  employees   │  │                          │    │
│  │  /api/auth  │  │  assets      │  │  get_current_user()      │    │
│  │             │  │  emp_assets  │  │  ↑ verifies JWT          │    │
│  │  register   │  │  asset_groups│  │  ↑ fetches user+EmpID    │    │
│  │  login      │  │  reports     │  │    from DB               │    │
│  │  check-email│  └──────┬───────┘  │                          │    │
│  │  /me        │         │          │  require_admin()         │    │
│  │  pending    │         │          │  ↑ checks Role = 'Admin' │    │
│  │  approve    │         │          └──────────────────────────┘    │
│  │  reject     │         │                                          │
│  │  admin/     │         │                                          │
│  │  create-user│         │                                          │
│  │  gen-login  │         │                                          │
│  │  set-passwd │         │                                          │
│  │  users (CRUD│         │                                          │
│  │   + reset-  │         │                                          │
│  │   password) │         │                                          │
│  └──────┬──────┘         │                                          │
│         │                │                                          │
│  ┌──────▼────────────────▼─────────────────────────────────────┐    │
│  │                      services/                              │    │
│  │   auth/service.py         employee_service.py               │    │
│  │   asset_service.py        emp_asset_service.py              │    │
│  │   asset_group_service.py  report_service.py                 │    │
│  │                                                             │    │
│  │   All use raw SQL via SQLAlchemy text()                     │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                     database.py                             │    │
│  │   create_engine(mssql+pyodbc)  →  SessionLocal              │    │
│  │   get_db() dependency → yields Session per request          │    │
│  │   create_tables() → ensures ReturnRequests table exists     │    │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────────────--┘
                              │ ODBC Driver 17
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Microsoft SQL Server (MSSQL)                          │
│                                                                     │
│   ┌───────────┐    ┌───────────┐    ┌─────────────┐                 │
│   │   Users   │    │ Employees │    │ AssetGroups │                 │
│   └───────────┘    └─────┬─────┘    └──────┬──────┘                 │
│                          │                 │                        │
│                          │          ┌──────▼──────┐                 │
│                          │          │    Assets   │                 │
│                          │          └──────┬──────┘                 │
│                          │                 │                        │
│                          └──────┬──────────┘                        │
│                                 │                                   │
│                        ┌────────▼────────┐                          │
│                        │ EmployeeAssets  │  (Assignment table)      │
│                        └────────┬────────┘                          │
│                                 │                                   │
│                        ┌────────▼────────┐                          │
│                        │ ReturnRequests  │  (User-initiated return) │
│                        └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
Client                         FastAPI                          MSSQL
  │                               │                               │
  │── POST /api/auth/check-email ►│                               │
  │   { email }                   │── SELECT Role,PasswordHash ──►│
  │◄── { exists, role,            │◄─ row ────────────────────────│
  │     has_password }            │                               │
  │                               │                               │
  │  (if has_password or Admin)   │                               │
  │── POST /api/auth/login ──────►│                               │
  │   { email, password }         │── SELECT user WHERE email ──► │
  │                               │◄─ user row ───────────────────│
  │                               │   check IsApproved = 1        │
  │                               │   check PasswordHash NOT NULL │
  │                               │   verify bcrypt hash          │
  │                               │   create JWT (8h, HS256)      │
  │◄── { access_token, role } ────│                               │
  │                               │                               │
  │── GET /api/employees/         │                               │
  │   Authorization: Bearer <JWT> │                               │
  │                               │  HTTPBearer extracts token    │
  │                               │  decode_token(JWT)            │
  │                               │── SELECT UserID,Role,         │
  │                               │   EmployeeID WHERE UserID ───►│
  │                               │◄─ user dict ──────────────────│
  │                               │  inject as current_user       │
  │◄── employee list ─────────────│                               │
```

---

## Request Lifecycle (Admin Write Operation)

```
Browser
  │
  ├─ axiosInstance.js adds header: Authorization: Bearer <token>
  │
  ▼
FastAPI Router (e.g. POST /api/assets/)
  │
  ├─ Depends(require_admin)
  │     └─ Depends(get_current_user)
  │           └─ decode JWT → fetch user+EmployeeID from DB → check IsActive
  │     └─ check Role == 'Admin' → 403 if not
  │
  ├─ Validate request body with Pydantic model (AssetCreate)
  │
  ├─ Call asset_service.create_asset(db, data)
  │     └─ db.execute(text("INSERT INTO Assets ..."))
  │     └─ db.commit()
  │
  └─ Return { "message": "Asset created successfully" }
```

---

## Data Flow: Asset Assignment (Multi-Asset)

```
Admin User
  │
  │  POST /api/assignments/assign  (called once per selected asset)
  │  { EmployeeID, AssetID, AssignedDate, Remarks }
  │
  ▼
emp_asset_service.assign_asset()
  │
  ├─ SELECT Status FROM Assets WHERE AssetID = ?
  │     └─ 404 if not found
  │     └─ 400 "Asset is not available" if Status != 'Available'
  │
  ├─ INSERT INTO EmployeeAssets
  │     (EmployeeID, AssetID, AssignedDate, IsReturned=0, Remarks)
  │
  └─ UPDATE Assets SET Status = 'Assigned' WHERE AssetID = ?
        └─ db.commit()

Note: The frontend loops over selected assets and calls this endpoint
      once per asset, enabling bulk assignment in a single form submit.
```

---

## Data Flow: Asset Return (Admin-Direct)

```
Admin User
  │
  │  PUT /api/assignments/return/{assignment_id}
  │  { ReturnedDate, Remarks }
  │
  ▼
emp_asset_service.return_asset()
  │
  ├─ SELECT * FROM EmployeeAssets WHERE AssignmentID = ?
  │     └─ 404 if not found
  │     └─ 400 "Asset already returned" if IsReturned = 1
  │
  ├─ UPDATE EmployeeAssets
  │     SET IsReturned=1, ReturnedDate=?, Remarks=?
  │
  └─ UPDATE Assets SET Status = 'Available' WHERE AssetID = ?
        └─ db.commit()
```

---

## Data Flow: Return Request (User-Initiated)

```
Employee (User role)
  │
  │  POST /api/assignments/return-request/{assignment_id}
  │  { reason }
  │
  ▼
emp_assets router
  │
  ├─ Verify current_user has an EmployeeID → 403 if not
  ├─ Check no Pending request already exists for this assignment → 400
  ├─ INSERT INTO ReturnRequests (AssignmentID, EmployeeID, 'Pending', reason)
  └─ db.commit()

Admin User
  │
  │  GET /api/assignments/return-requests
  │  ← joined list: employee name, asset name, reason, status
  │
  │  PUT /api/assignments/return-request/approve/{request_id}
  │    → UPDATE EmployeeAssets SET IsReturned=1, ReturnedDate=today
  │    → UPDATE Assets SET Status='Available'
  │    → UPDATE ReturnRequests SET Status='Approved'
  │
  │  PUT /api/assignments/return-request/ignore/{request_id}
  │    → UPDATE ReturnRequests SET Status='Ignored'
```

---

## Data Flow: PDF Report Generation

```
Admin User
  │
  │  GET /api/reports/employee/{id}   ← single employee PDF
  │  GET /api/reports/employees       ← all employees PDF
  │  GET /api/reports/asset/{id}      ← single asset PDF
  │  GET /api/reports/assets          ← all assets PDF
  │
  ▼
report_service.py
  │
  ├─ Query DB for relevant data
  ├─ Build PDF using reportlab / fpdf (in-memory BytesIO)
  └─ Return StreamingResponse(buffer, media_type="application/pdf")
        Content-Disposition: attachment; filename="..."
```

---

## Data Flow: User Management (Admin User Portal)

```
Admin User  (/user-portal)
  │
  │  GET /api/auth/users  ← list every account
  │     (UserID, Username, Email, Role, IsActive, IsApproved,
  │      CreatedDate, EmployeeID)
  │
  │  Client-side search + filters (role / status / approval)
  │
  ├─ Create:  POST /api/auth/admin/create-user
  │             └─ blocked with 400 if Role=Admin and active admins ≥ 5
  │
  ├─ Edit:    PUT /api/auth/users/{id}
  │             └─ partial update; promoting to Admin re-checks the 5-admin cap
  │
  ├─ Reset:   PUT /api/auth/users/{id}/reset-password
  │             └─ sets PasswordHash = NULL → user re-sets it on next login
  │
  └─ Delete:  DELETE /api/auth/users/{id}
                └─ 400 "Cannot delete yourself" guard
```

---

## UI: Theme System

```
ThemeContext.jsx
  │  theme string in localStorage:  "light" | "warm" | "dark"
  │  prevTheme in localStorage: last non-dark theme (for toggle restore)
  │
  ├─ setTheme(t)      ← Settings page selects any of the 3 themes
  ├─ toggleTheme()    ← Navbar gear's neighbour flips Dark on/off,
  │                      restoring prevTheme when turning Dark off
  └─ getTheme(theme)  ← returns the full palette object
                         (pageBg, surface, border, textPrimary, accent,
                          navBg, badge colours, …) consumed by every page

Themes:  Classic Blue (light)  ·  Warm Cream (warm)  ·  Dark Mode (dark)

Settings page (/settings, all logged-in users) renders a live mini-preview
card per theme and marks the active one.
```

---

## Folder Structure

```
Empassetmanagement/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app, CORS (regex), router registration
│   │   ├── database.py          ← MSSQL engine, SessionLocal, get_db(),
│   │   │                           create_tables() (ReturnRequests auto-create)
│   │   ├── auth/
│   │   │   ├── router.py        ← /api/auth endpoints (incl. check-email)
│   │   │   ├── service.py       ← register_user, login_user, set_own_password
│   │   │   ├── jwt_handler.py   ← create_token, decode_token
│   │   │   └── dependencies.py  ← get_current_user (returns EmployeeID),
│   │   │                           require_admin
│   │   ├── models/              ← Pydantic request/response schemas
│   │   │   ├── user.py
│   │   │   ├── employee.py
│   │   │   ├── asset.py
│   │   │   ├── asset_group.py
│   │   │   └── emp_asset.py
│   │   ├── routes/              ← FastAPI routers (HTTP endpoints)
│   │   │   ├── employees.py
│   │   │   ├── assets.py
│   │   │   ├── emp_assets.py    ← assignments + return-request endpoints
│   │   │   ├── asset_groups.py
│   │   │   └── reports.py       ← PDF report endpoints
│   │   └── services/            ← Business logic + raw SQL queries
│   │       ├── employee_service.py
│   │       ├── asset_service.py
│   │       ├── emp_asset_service.py
│   │       ├── asset_group_service.py
│   │       └── report_service.py
│   ├── .env                     ← DB_SERVER, DB_DATABASE, SECRET_KEY
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── App.jsx              ← Router setup, protected routes
        ├── main.jsx
        ├── context/
        │   ├── AuthContext.jsx  ← token, role, username state (localStorage)
        │   └── ThemeContext.jsx ← theme string (light/warm/dark), setTheme,
        │                           toggleTheme, getTheme() palette factory
        ├── api/
        │   ├── axiosInstance.js ← base URL + auth header injection
        │   ├── authApi.js       ← login, register, checkEmail, setOwnPassword, etc.
        │   ├── employeeApi.js
        │   ├── assetApi.js
        │   ├── assignmentApi.js ← assign, return, return-request CRUD
        │   ├── assetGroupApi.js
        │   └── reportApi.js
        ├── components/
        │   ├── Navbar.jsx       ← role-aware nav links + Settings & theme toggle
        │   ├── ProtectedRoute.jsx
        │   └── AdminRoute.jsx
        └── pages/
            ├── LoginPage.jsx        ← Multi-step: email → password / set-password
            ├── DashboardPage.jsx    ← Stats cards + quick actions (Admin);
            │                           recent assignments (all users)
            ├── EmployeePage.jsx     ← includes Generate Login + Download Report (Admin)
            ├── AssetPage.jsx        ← Admin only
            ├── AssignmentPage.jsx   ← filter tabs; multi-asset assign form (Admin);
            │                           Users see own assignments only
            ├── PendingUsersPage.jsx ← Approve/reject registrations +
            │                           Manage return requests (Admin)
            ├── AdminPortalPage.jsx  ← Create Admin accounts (Admin only, max 5)
            ├── UserPortalPage.jsx   ← Full user CRUD: search/filter, create,
            │                           edit, reset-password, delete (Admin only)
            └── SettingsPage.jsx     ← Theme picker (light/warm/dark, all users)
```

---

## API Endpoint Summary

| Module         | Method | Endpoint                                      | Auth Required |
|----------------|--------|-----------------------------------------------|---------------|
| Auth           | POST   | /api/auth/register                            | None          |
| Auth           | POST   | /api/auth/login                               | None          |
| Auth           | POST   | /api/auth/check-email                         | None          |
| Auth           | POST   | /api/auth/set-password                        | None          |
| Auth           | GET    | /api/auth/me                                  | User          |
| Auth           | GET    | /api/auth/pending                             | Admin         |
| Auth           | PUT    | /api/auth/approve/{user_id}                   | Admin         |
| Auth           | DELETE | /api/auth/reject/{user_id}                    | Admin         |
| Auth           | POST   | /api/auth/admin/create-user                   | Admin         |
| Auth           | POST   | /api/auth/generate-login/{emp_id}             | Admin         |
| Auth           | GET    | /api/auth/employees-with-logins               | Admin         |
| Auth           | GET    | /api/auth/users                               | Admin         |
| Auth           | PUT    | /api/auth/users/{id}                          | Admin         |
| Auth           | PUT    | /api/auth/users/{id}/reset-password           | Admin         |
| Auth           | DELETE | /api/auth/users/{id}                          | Admin         |
| Employees      | GET    | /api/employees/                               | User          |
| Employees      | GET    | /api/employees/{id}                           | User          |
| Employees      | GET    | /api/employees/{id}/assets                    | User          |
| Employees      | POST   | /api/employees/                               | Admin         |
| Employees      | PUT    | /api/employees/{id}                           | Admin         |
| Employees      | DELETE | /api/employees/{id}                           | Admin         |
| Assets         | GET    | /api/assets/                                  | User          |
| Assets         | GET    | /api/assets/?status={status}                  | User          |
| Assets         | GET    | /api/assets/{id}                              | User          |
| Assets         | POST   | /api/assets/                                  | Admin         |
| Assets         | PUT    | /api/assets/{id}                              | Admin         |
| Assets         | DELETE | /api/assets/{id}                              | Admin         |
| Asset Groups   | GET    | /api/asset-groups/                            | User          |
| Asset Groups   | GET    | /api/asset-groups/{id}                        | User          |
| Asset Groups   | GET    | /api/asset-groups/{id}/assets                 | User          |
| Asset Groups   | POST   | /api/asset-groups/                            | Admin         |
| Asset Groups   | PUT    | /api/asset-groups/{id}                        | Admin         |
| Asset Groups   | DELETE | /api/asset-groups/{id}                        | Admin         |
| Assignments    | GET    | /api/assignments/                             | User*         |
| Assignments    | GET    | /api/assignments/employee/{id}                | User*         |
| Assignments    | POST   | /api/assignments/assign                       | Admin         |
| Assignments    | PUT    | /api/assignments/return/{id}                  | Admin         |
| Assignments    | POST   | /api/assignments/return-request/{id}          | User          |
| Assignments    | GET    | /api/assignments/return-requests              | Admin         |
| Assignments    | PUT    | /api/assignments/return-request/approve/{id}  | Admin         |
| Assignments    | PUT    | /api/assignments/return-request/ignore/{id}   | Admin         |
| Assignments    | GET    | /api/assignments/my-return-requests           | User          |
| Reports        | GET    | /api/reports/employee/{id}                    | Admin         |
| Reports        | GET    | /api/reports/asset/{id}                       | Admin         |
| Reports        | GET    | /api/reports/employees                        | Admin         |
| Reports        | GET    | /api/reports/assets                           | Admin         |

> `*` Role-scoped: Admins see all records; Users see only their own (filtered by `EmployeeID` from the JWT-verified session).
