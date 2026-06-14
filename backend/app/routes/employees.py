from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.employee import EmployeeCreate, EmployeeUpdate
from app.services import employee_service
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix = "/api/employees",
    tags   = ["Employees"]
)


@router.get("/")
def get_all_employees(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    # Admins see the whole directory; a User sees only their own linked record.
    if current_user["Role"] == "Admin":
        return employee_service.get_all_employees(db)

    emp_id = current_user["EmployeeID"]
    if emp_id is None:
        return []
    own = employee_service.get_employee_by_id(db, emp_id)
    return [own] if own else []


@router.get("/{employee_id}")
def get_employee(
    employee_id:  int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    # A User may only read their own employee record.
    if current_user["Role"] != "Admin" and current_user["EmployeeID"] != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    employee = employee_service.get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.get("/{employee_id}/assets")
def get_employee_assets(
    employee_id:  int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    if current_user["Role"] != "Admin" and current_user["EmployeeID"] != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    result = employee_service.get_employee_total_assets(db, employee_id)
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")
    return result


@router.post("/", status_code=201)
def create_employee(
    employee:     EmployeeCreate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    employee_service.create_employee(db, employee.model_dump())
    return {"message": "Employee created successfully"}


@router.put("/{employee_id}")
def update_employee(
    employee_id:  int,
    employee:     EmployeeUpdate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    employee_service.update_employee(db,employee_id,employee.model_dump())
    return {"message": "Employee updated successfully"}


@router.delete("/{employee_id}")
def delete_employee(
    employee_id:  int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    employee_service.delete_employee(db, employee_id)
    return {"message": "Employee deactivated successfully"}