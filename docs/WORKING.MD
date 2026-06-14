Your FastAPI backend has 4 jobs:
1. Connect to DB        → database.py
2. Define tables        → models/
3. Do the logic         → services/
4. Expose the API       → routes/  +  auth/


create venv on backend and install req.txt
backend : uvicorn app.main:app --reload --port 8000
frontend : npm run dev

