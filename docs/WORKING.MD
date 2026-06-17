# Developer Setup & Running the Application

## Architecture Summary

The app has 4 backend layers:
1. **Connect to DB** → `database.py`
2. **Define schemas** → `models/` (Pydantic)
3. **Business logic** → `services/`
4. **Expose API** → `routes/` + `auth/`

---

## Backend Setup

```bash
# 1. Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file in backend/
# DB_SERVER=YOUR_SERVER_NAME
# DB_DATABASE=EmpAssetDB
# SECRET_KEY=your_secret_key_here

# 4. Start the server
uvicorn app.main:app --reload --port 8000
```

- API docs available at: http://localhost:8000/docs
- The `ReturnRequests` table is created automatically on startup if it doesn't exist.

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Runs at: http://localhost:5173 (or next available port)
- CORS on the backend accepts any `localhost` or `127.0.0.1` port via regex, so Vite port auto-increment (5173 → 5174 → …) works without any config change.

---

## Default Admin Seed

Insert a default admin account into MSSQL before first use (replace the bcrypt hash):

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

## Key Environment Variables (`.env`)

| Variable      | Description                          |
|---------------|--------------------------------------|
| `DB_SERVER`   | MSSQL server name (Windows Auth)     |
| `DB_DATABASE` | Database name (default: `EmpAssetDB`)|
| `SECRET_KEY`  | JWT signing secret                   |

---

## Notes

- The backend uses **Windows Authentication** for MSSQL — no SQL username/password needed in the connection string.
- PDF report generation uses `reportlab` / `fpdf` — ensure it's in `requirements.txt`.
- The `ReturnRequests` table includes a `Reason` column (NVARCHAR) for the employee's return justification.
