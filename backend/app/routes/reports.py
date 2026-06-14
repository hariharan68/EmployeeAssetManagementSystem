from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import report_service
from app.auth.dependencies import require_admin

router = APIRouter(
    prefix = "/api/reports",
    tags   = ["Reports"]
)


def _pdf_response(buffer, filename: str):
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/employee/{employee_id}")
def employee_report(
    employee_id:  int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    pdf = report_service.employee_report(db, employee_id)
    if pdf is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _pdf_response(pdf, f"employee_{employee_id}_report.pdf")


@router.get("/asset/{asset_id}")
def asset_report(
    asset_id:     int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    pdf = report_service.asset_report(db, asset_id)
    if pdf is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return _pdf_response(pdf, f"asset_{asset_id}_report.pdf")


@router.get("/employees")
def employees_report(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    pdf = report_service.employees_list_report(db)
    return _pdf_response(pdf, "employees_report.pdf")


@router.get("/assets")
def assets_report(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    pdf = report_service.assets_list_report(db)
    return _pdf_response(pdf, "assets_report.pdf")
