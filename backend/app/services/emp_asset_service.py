from sqlalchemy.orm import Session
from sqlalchemy import text


def assign_asset(db: Session, data: dict):
    asset = db.execute(
        text("SELECT Status FROM Assets WHERE AssetID = :id"),
        {"id": data.get("AssetID")}
    ).first()

    if not asset:
        return None, "Asset not found"

    if asset.Status != "Available":
        return None, "Asset is not available for assignment"

    db.execute(text("""
        INSERT INTO EmployeeAssets
            (EmployeeID, AssetID, AssignedDate, IsReturned, Remarks)
        VALUES
            (:emp, :asset, :date, 0, :remarks)
    """), {
        "emp":     data.get("EmployeeID"),
        "asset":   data.get("AssetID"),
        "date":    data.get("AssignedDate"),
        "remarks": data.get("Remarks")
    })

    db.execute(
        text("UPDATE Assets SET Status = 'Assigned' WHERE AssetID = :id"),
        {"id": data.get("AssetID")}
    )
    db.commit()

    return "Asset assigned successfully", None


def return_asset(db: Session, assignment_id: int, data: dict):
    assignment = db.execute(
        text("SELECT * FROM EmployeeAssets WHERE AssignmentID = :id"),
        {"id": assignment_id}
    ).mappings().first()

    if not assignment:
        return None, "Assignment not found"

    if assignment["IsReturned"] == True:
        return None, "Asset already returned"

    db.execute(text("""
        UPDATE EmployeeAssets SET
            IsReturned   = 1,
            ReturnedDate = :ret_date,
            Remarks      = COALESCE(:remarks, Remarks)
        WHERE AssignmentID = :id
    """), {
        "ret_date": data.get("ReturnedDate"),
        "remarks":  data.get("Remarks"),
        "id":       assignment_id
    })

    db.execute(
        text("UPDATE Assets SET Status = 'Available' WHERE AssetID = :id"),
        {"id": assignment["AssetID"]}
    )
    db.commit()

    return "Asset returned successfully", None


def get_assignments_by_employee(db: Session, employee_id: int):
    result = db.execute(text("""
        SELECT
            ea.AssignmentID,
            ea.AssignedDate,
            ea.ReturnedDate,
            ea.IsReturned,
            ea.Remarks,
            e.EmployeeID,
            e.EmployeeName,
            e.Department,
            a.AssetName,
            a.AssetType,
            a.AssetCode,
            a.Brand,
            a.Model,
            a.SerialNumber
        FROM EmployeeAssets ea
        JOIN Assets    a ON ea.AssetID    = a.AssetID
        JOIN Employees e ON ea.EmployeeID = e.EmployeeID
        WHERE ea.EmployeeID = :id
        ORDER BY ea.AssignedDate DESC
    """), {"id": employee_id})
    return result.mappings().all()


def get_all_assignments(db: Session):
    result = db.execute(text("""
        SELECT
            ea.AssignmentID,
            ea.AssignedDate,
            ea.ReturnedDate,
            ea.IsReturned,
            ea.Remarks,
            e.EmployeeName,
            e.Department,
            a.AssetName,
            a.AssetType,
            a.AssetCode
        FROM EmployeeAssets ea
        JOIN Employees e ON ea.EmployeeID = e.EmployeeID
        JOIN Assets    a ON ea.AssetID    = a.AssetID
        ORDER BY ea.AssignedDate DESC
    """))
    return result.mappings().all()