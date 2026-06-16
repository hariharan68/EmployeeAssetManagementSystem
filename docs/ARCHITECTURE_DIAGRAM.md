# Employee Asset Management System — Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                            │
│                     React + Vite  :5173                             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │LoginPage │  │Dashboard │  │Employees │  │Assets/Assignments│     │
│  └───┬── ───┘  └────┬─────┘  └── ──┬────┘  └────── --──┬──────┘     │
│      │              │              │                   │            │
│      └──────────────┴──────────────┴───────────────-───┘            │
│                              │                                      │
│                    ┌─────────▼──────────┐                           │
│                    │   AuthContext.jsx   │ ← stores token, role,    │
│                    │  (React Context)    │   username in memory     │
│                    └─────────┬──────────┘                           │
│                              │                                      │
│                    ┌─────────▼──────────┐                           │
│                    │  axiosInstance.js   │ ← attaches Bearer token  │
│                    │  (Axios + intercept)│   to every request       │
│                    └─────────┬──────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP/REST  (JSON)
                               │ CORS allowed: localhost:5173
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend  :8000                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        main.py                               │   │
│  │   CORSMiddleware → Router registration                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐    │
│  │  auth/      │  │  routes/     │  │  auth/dependencies.py    │    │
│  │  router.py  │  │  employees   │  │                          │    │
│  │  /api/auth  │  │  assets      │  │  get_current_user()      │    │
│  │             │  │  emp_assets  │  │  ↑ verifies JWT          │    │
│  │  register   │  │  asset_groups│  │  ↑ fetches user from DB  │    │
│  │  login      │  └──────┬───────┘  │                          │    │
│  │  /me        │         │          │  require_admin()         │    │
│  │  pending    │         │          │  ↑ checks Role = 'Admin' │    │
│  │  approve    │         │          └──────────────────────────┘    │
│  │  reject     │         |                                          │
│  │  admin/     │         |                                          │
│  │  create-user│         |                                          │
│  │  gen-login  │         |                                          │
│  │  set-passwd │         |                                          │
│  └──────┬──────┘         │                                          │
│         │                │                                          │
│         │                │                                          │
│  ┌──────▼────────────────▼─────────────────────────────────────┐    │
│  │                      services/                              │    │
│  │   auth/service.py         employee_service.py               │    │
│  │   asset_service.py        emp_asset_service.py              │    │
│  │   asset_group_service.py                                    │    │
│  │                                                             │    │
│  │   All use raw SQL via SQLAlchemy text()                     │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────▼─────────────────────────────── ─ ─┐   │
│  │                     database.py                              │   │
│  │   create_engine(mssql+pyodbc)  →  SessionLocal               │   │
│  │   get_db() dependency → yields Session per request           │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────────--─┘
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
│                        └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
Client                         FastAPI                          MSSQL
  │                               │                               │
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
  │                               │── SELECT user WHERE UserID ──►│
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
  │           └─ decode JWT → fetch user from DB → check IsActive
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

## Data Flow: Asset Assignment

```
Admin User
  │
  │  POST /api/assignments/assign
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
```

---

## Data Flow: Asset Return

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

## Folder Structure

```
Empassetmanagement/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app, CORS, router registration
│   │   ├── database.py          ← MSSQL engine, SessionLocal, get_db()
│   │   ├── auth/
│   │   │   ├── router.py        ← /api/auth endpoints
│   │   │   ├── service.py       ← register_user, login_user
│   │   │   ├── jwt_handler.py   ← create_token, decode_token
│   │   │   └── dependencies.py  ← get_current_user, require_admin
│   │   ├── models/              ← Pydantic request/response schemas
│   │   │   ├── user.py
│   │   │   ├── employee.py
│   │   │   ├── asset.py
│   │   │   ├── asset_group.py
│   │   │   └── emp_asset.py
│   │   ├── routes/              ← FastAPI routers (HTTP endpoints)
│   │   │   ├── employees.py
│   │   │   ├── assets.py
│   │   │   ├── emp_assets.py
│   │   │   └── asset_groups.py
│   │   └── services/            ← Business logic + raw SQL queries
│   │       ├── employee_service.py
│   │       ├── asset_service.py
│   │       ├── emp_asset_service.py
│   │       └── asset_group_service.py
│   ├── .env                     ← DB_SERVER, DB_DATABASE, SECRET_KEY
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── App.jsx              ← Router setup, protected routes
        ├── main.jsx
        ├── context/
        │   └── AuthContext.jsx  ← token, role, username state
        ├── api/
        │   ├── axiosInstance.js ← base URL + auth header injection
        │   ├── authApi.js
        │   ├── employeeApi.js
        │   ├── assetApi.js
        │   ├── assignmentApi.js
        │   └── assetGroupApi.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── AdminRoute.jsx
        └── pages/
            ├── LoginPage.jsx        ← Sign In + Set Password tabs
            ├── DashboardPage.jsx
            ├── EmployeePage.jsx     ← includes Generate Login per employee (Admin)
            ├── AssetPage.jsx
            ├── AssignmentPage.jsx
            └── PendingUsersPage.jsx ← Admin: approve / reject registrations
```

---

## API Endpoint Summary

| Module         | Method | Endpoint                              | Auth Required |
|----------------|--------|---------------------------------------|---------------|
| Auth           | POST   | /api/auth/register                    | None          |
| Auth           | POST   | /api/auth/login                       | None          |
| Auth           | POST   | /api/auth/set-password                | None          |
| Auth           | GET    | /api/auth/me                          | User          |
| Auth           | GET    | /api/auth/pending                     | Admin         |
| Auth           | PUT    | /api/auth/approve/{user_id}           | Admin         |
| Auth           | DELETE | /api/auth/reject/{user_id}            | Admin         |
| Auth           | POST   | /api/auth/admin/create-user           | Admin         |
| Auth           | POST   | /api/auth/generate-login/{emp_id}     | Admin         |
| Auth           | GET    | /api/auth/employees-with-logins       | Admin         |
| Employees      | GET    | /api/employees/                       | User          |
| Employees      | GET    | /api/employees/{id}                   | User          |
| Employees      | GET    | /api/employees/{id}/assets            | User          |
| Employees      | POST   | /api/employees/                       | Admin         |
| Employees      | PUT    | /api/employees/{id}                   | Admin         |
| Employees      | DELETE | /api/employees/{id}                   | Admin         |
| Assets         | GET    | /api/assets/                          | User          |
| Assets         | GET    | /api/assets/?status={status}          | User          |
| Assets         | GET    | /api/assets/{id}                      | User          |
| Assets         | POST   | /api/assets/                          | Admin         |
| Assets         | PUT    | /api/assets/{id}                      | Admin         |
| Assets         | DELETE | /api/assets/{id}                      | Admin         |
| Asset Groups   | GET    | /api/asset-groups/                    | User          |
| Asset Groups   | GET    | /api/asset-groups/{id}                | User          |
| Asset Groups   | GET    | /api/asset-groups/{id}/assets         | User          |
| Asset Groups   | POST   | /api/asset-groups/                    | Admin         |
| Asset Groups   | PUT    | /api/asset-groups/{id}                | Admin         |
| Asset Groups   | DELETE | /api/asset-groups/{id}                | Admin         |
| Assignments    | GET    | /api/assignments/                     | User          |
| Assignments    | GET    | /api/assignments/employee/{id}        | User          |
| Assignments    | POST   | /api/assignments/assign               | Admin         |
| Assignments    | PUT    | /api/assignments/return/{id}          | Admin         |
