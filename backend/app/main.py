from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.routes.employees import router as employee_router
from app.routes.assets import router as asset_router
from app.routes.emp_assets import router as assignment_router
from app.routes.asset_groups import router as asset_group_router
from app.routes.reports import router as report_router


app=FastAPI(
    title = "Employee Asset MAnagement API ",   
    description="Manage employee and their assigned assets ",
    version="1.0.0"

)

app.add_middleware(
    CORSMiddleware,
    # Allow any localhost / 127.0.0.1 port so the Vite dev server works even
    # when it auto-increments (5173 -> 5174 -> ...) because a port is in use.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(asset_router)
app.include_router(assignment_router)
app.include_router(asset_group_router)
app.include_router(report_router)

@app.get("/")
def root():
    return {"message": "Employee Asset Management API is running"}
