# Employee Asset Management System

A full-stack web application for managing employee asset assignments within an organization. Admins can track assets, assign them to employees, handle return requests, and manage user registrations — all from a role-gated dashboard.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19, Vite 8, React Router v7, Axios, TanStack Query |
| Backend   | FastAPI, SQLAlchemy, Pydantic, Python-Jose (JWT) |
| Database  | Microsoft SQL Server (Windows Authentication)   |
| Auth      | JWT Bearer tokens, bcrypt password hashing      |

---

## Features

- **Role-based access control** — Admin and Employee roles with route-level guards
- **Asset management** — Create, update, and categorize assets by group
- **Assignment tracking** — Assign assets to employees, track status and return requests
- **User approval flow** — New registrations require admin approval before access
- **Admin portal** — Create admin users and manage existing accounts
- **User portal** — Admin-managed CRUD for employee user accounts
- **PDF reports** — Generate asset/assignment reports via ReportLab
- **Dark/light theme** — Persistent theme toggle across the app

---

## Project Structure

```
Empassetmanagement/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app, CORS, router registration
│       ├── database.py          # SQLAlchemy engine & session
│       ├── auth/
│       │   ├── router.py        # /api/auth endpoints
│       │   ├── service.py       # register, login, approval logic
│       │   ├── dependencies.py  # get_current_user, require_admin
│       │   └── jwt_handler.py   # token creation & verification
│       ├── models/              # Pydantic schemas (request/response)
│       ├── routes/              # employees, assets, emp_assets, reports
│       └── services/            # business logic layer
├── frontend/
│   └── src/
│       ├── App.jsx              # Route definitions
│       ├── context/             # AuthContext, ThemeContext
│       ├── components/          # Navbar, ProtectedRoute, AdminRoute
│       ├── api/                 # Axios wrappers per domain
│       └── pages/
│           ├── LoginPage.jsx
│           ├── DashboardPage.jsx
│           ├── EmployeePage.jsx
│           ├── AssetPage.jsx         # Admin only
│           ├── AssignmentPage.jsx
│           ├── PendingUsersPage.jsx  # Admin only
│           ├── UserPortalPage.jsx    # Admin only
│           └── AdminPortalPage.jsx   # Admin only
└── docs/
    ├── ARCHITECTURE_DIAGRAM.md
    ├── DB_DESIGN_MSSQL.md
    ├── USE_CASE_REPORT.md
    └── WORKING.MD
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Microsoft SQL Server (local instance with Windows Authentication)

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
# DB_SERVER=YOUR_SERVER_NAME
# DB_DATABASE=EmpAssetDB
# SECRET_KEY=your_secret_key_here

# Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at **http://localhost:8000/docs**

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:5173** (Vite auto-increments the port if busy; CORS on the backend accepts any `localhost` port).

---

### Database Seed (First-Time Setup)

Create a default admin account in MSSQL before first login:

```sql
INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive, IsApproved)
VALUES ('admin', 'admin@company.com', '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH', 'Admin', 1, 1);
```

Generate the bcrypt hash in Python:

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])
print(pwd_context.hash("Admin@123"))
```

---

## Environment Variables

| Variable      | Description                              |
|---------------|------------------------------------------|
| `DB_SERVER`   | MSSQL server name (Windows Auth)         |
| `DB_DATABASE` | Database name — default `EmpAssetDB`     |
| `SECRET_KEY`  | JWT signing secret                       |

---

## API Overview

| Endpoint                           | Description                            |
|------------------------------------|----------------------------------------|
| `POST /api/auth/register`          | Register a new user (pending approval) |
| `POST /api/auth/login`             | Login and receive JWT token            |
| `GET  /api/auth/me`                | Get current user profile               |
| `GET  /api/auth/pending`           | List pending registrations (Admin)     |
| `POST /api/auth/approve`           | Approve a pending user (Admin)         |
| `POST /api/auth/reject`            | Reject a pending user (Admin)          |
| `POST /api/auth/admin/create-user` | Create a user directly (Admin)         |
| `/api/employees/*`                 | Employee CRUD                          |
| `/api/assets/*`                    | Asset CRUD (Admin)                     |
| `/api/emp-assets/*`                | Asset assignment & return requests     |
| `/api/asset-groups/*`              | Asset group management                 |
| `/api/reports/*`                   | PDF report generation                  |

---

## Roles & Permissions

| Feature                      | Admin | Employee |
|------------------------------|:-----:|:--------:|
| View dashboard               |  ✓   |    ✓     |
| View employees               |  ✓   |    ✓     |
| Manage assets                |  ✓   |          |
| View/submit assignments      |  ✓   |    ✓     |
| Approve user registrations   |  ✓   |          |
| User portal (manage users)   |  ✓   |          |
| Admin portal (create admins) |  ✓   |          |

---

## Notes

- The backend uses **Windows Authentication** for MSSQL — no SQL username/password needed in the connection string.
- The `ReturnRequests` table (including a `Reason` column) is auto-created on backend startup if it doesn't exist.
- PDF reports use `reportlab` / `fpdf` — ensure these are listed in `requirements.txt`.
