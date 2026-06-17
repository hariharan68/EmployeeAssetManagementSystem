from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.emp_asset import AssignAssetRequest, ReturnAssetRequest
from app.services import emp_asset_service
from app.auth.dependencies import get_current_user, require_admin
from pydantic import BaseModel

class ReturnRequestBody(BaseModel):
    reason: str=""


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


# ── Return Requests (user-initiated) ──────────────────────────────────────────

@router.post("/return-request/{assignment_id}", status_code=201)
def submit_return_request(
    assignment_id: int,
    body:          ReturnRequestBody,
    db:            Session = Depends(get_db),
    current_user:  dict    = Depends(get_current_user)
):
    emp_id = current_user.get("EmployeeID")
    if emp_id is None:
        raise HTTPException(status_code=403, detail="Not linked to an employee")

    existing = db.execute(text("""
        SELECT RequestID FROM ReturnRequests
        WHERE AssignmentID = :aid AND Status = 'Pending'
    """), {"aid": assignment_id}).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Return request already pending")

    db.execute(text("""
        INSERT INTO ReturnRequests (AssignmentID, EmployeeID, Status, Reason)
        VALUES (:aid, :eid, 'Pending', :reason)
    """), {"aid": assignment_id, "eid": emp_id, "reason": body.reason})
    db.commit()
    return {"message": "Return request submitted"}


@router.get("/return-requests")
def list_return_requests(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    rows = db.execute(text("""
            SELECT rr.RequestID, rr.AssignmentID, rr.EmployeeID, rr.RequestDate, rr.Status,
               rr.Reason,
               e.EmployeeName, e.EmployeeCode,
               a.AssetName, a.AssetType, a.Brand
        FROM ReturnRequests rr
        JOIN Employees e ON e.EmployeeID = rr.EmployeeID
        JOIN EmployeeAssets ea ON ea.AssignmentID = rr.AssignmentID
        JOIN Assets a ON a.AssetID = ea.AssetID
        ORDER BY rr.RequestDate DESC
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.put("/return-request/approve/{request_id}")
def approve_return_request(
    request_id:   int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    req = db.execute(text("""
        SELECT AssignmentID FROM ReturnRequests WHERE RequestID = :rid
    """), {"rid": request_id}).fetchone()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    assignment_id = req[0]
    from datetime import date
    db.execute(text("""
        UPDATE EmployeeAssets SET IsReturned = 1, ReturnedDate = :dt WHERE AssignmentID = :aid
    """), {"dt": date.today(), "aid": assignment_id})
    db.execute(text("""
        UPDATE Assets SET Status = 'Available'
        WHERE AssetID = (SELECT AssetID FROM EmployeeAssets WHERE AssignmentID = :aid)
    """), {"aid": assignment_id})
    db.execute(text("""
        UPDATE ReturnRequests SET Status = 'Approved' WHERE RequestID = :rid
    """), {"rid": request_id})
    db.commit()
    return {"message": "Return request approved"}


@router.put("/return-request/ignore/{request_id}")
def ignore_return_request(
    request_id:   int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    req = db.execute(text("""
        SELECT RequestID FROM ReturnRequests WHERE RequestID = :rid
    """), {"rid": request_id}).fetchone()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    db.execute(text("""
        UPDATE ReturnRequests SET Status = 'Ignored' WHERE RequestID = :rid
    """), {"rid": request_id})
    db.commit()
    return {"message": "Return request ignored"}


@router.get("/my-return-requests")
def my_return_requests(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    emp_id = current_user.get("EmployeeID")
    if emp_id is None:
        return []
    rows = db.execute(text("""
        SELECT AssignmentID, Status FROM ReturnRequests
        WHERE EmployeeID = :eid
    """), {"eid": emp_id}).fetchall()
    return [{"AssignmentID": r[0], "Status": r[1]} for r in rows]