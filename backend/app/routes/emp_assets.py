from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.emp_asset import AssignAssetRequest, ReturnAssetRequest
from app.services import emp_asset_service
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix = "/api/assignments",
    tags   = ["Assignments"]
)


@router.get("/")
def get_all_assignments(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    # Admins see all assignments; a User sees only their own.
    if current_user["Role"] == "Admin":
        return emp_asset_service.get_all_assignments(db)

    emp_id = current_user["EmployeeID"]
    if emp_id is None:
        return []
    return emp_asset_service.get_assignments_by_employee(db, emp_id)


@router.get("/employee/{employee_id}")
def get_assignments_by_employee(
    employee_id:  int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    # A User may only read their own assignments.
    if current_user["Role"] != "Admin" and current_user["EmployeeID"] != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return emp_asset_service.get_assignments_by_employee(db, employee_id)


@router.post("/assign", status_code=201)
def assign_asset(
    request:      AssignAssetRequest,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    message, error = emp_asset_service.assign_asset(db, request.model_dump())
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": message}


@router.put("/return/{assignment_id}")
def return_asset(
    assignment_id: int,
    request:       ReturnAssetRequest,
    db:            Session = Depends(get_db),
    current_user:  dict    = Depends(require_admin)
):
    message, error = emp_asset_service.return_asset(
        db,
        assignment_id,
        request.dict()
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": message}