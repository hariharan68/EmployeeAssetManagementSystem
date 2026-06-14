from sqlalchemy.orm import Session
from sqlalchemy import text


def get_all_employees(db: Session):
    result = db.execute(
        text("SELECT * FROM Employees WHERE IsActive = 1")
    )
    return result.mappings().all()


def get_employee_by_id(db: Session, employee_id: int):
    result = db.execute(
        text("SELECT * FROM Employees WHERE EmployeeID = :id"),
        {"id": employee_id}
    ).mappings().first()
    return result


def create_employee(db: Session, data: dict):
    db.execute(text("""
        INSERT INTO Employees
            (EmployeeCode, EmployeeName, Department,
             Designation, Email, Mobile, JoiningDate)
        VALUES
            (:code, :name, :dept,
             :desig, :email, :mobile, :joining)
    """), {
        "code":    data.get("EmployeeCode"),
        "name":    data.get("EmployeeName"),
        "dept":    data.get("Department"),
        "desig":   data.get("Designation"),
        "email":   data.get("Email"),
        "mobile":  data.get("Mobile"),
        "joining": data.get("JoiningDate")
    })
    db.commit()


def update_employee(db: Session, employee_id: int, data: dict):
    db.execute(text("""
        UPDATE Employees SET
            EmployeeCode = COALESCE(:code,    EmployeeCode),
            EmployeeName = COALESCE(:name,    EmployeeName),
            Department   = COALESCE(:dept,    Department),
            Designation  = COALESCE(:desig,   Designation),
            Email        = COALESCE(:email,   Email),
            Mobile       = COALESCE(:mobile,  Mobile),
            JoiningDate  = COALESCE(:joining, JoiningDate),
            IsActive     = COALESCE(:active,  IsActive)
        WHERE EmployeeID = :id
    """), {
        "code":    data.get("EmployeeCode"),
        "name":    data.get("EmployeeName"),
        "dept":    data.get("Department"),
        "desig":   data.get("Designation"),
        "email":   data.get("Email"),
        "mobile":  data.get("Mobile"),
        "joining": data.get("JoiningDate"),
        "active":  data.get("IsActive"),
        "id":      employee_id
    })
    db.commit()


def delete_employee(db: Session, employee_id: int):
    db.execute(
        text("UPDATE Employees SET IsActive = 0 WHERE EmployeeID = :id"),
        {"id": employee_id}
    )
    db.commit()


def get_employee_total_assets(db: Session, employee_id: int):
    result = db.execute(text("""
        SELECT
            e.EmployeeID,
            e.EmployeeName,
            e.Department,
            COUNT(ea.AssignmentID)                        AS TotalAssigned,
            SUM(CASE WHEN ea.IsReturned = 0 THEN 1 ELSE 0 END) AS CurrentlyHolding,
            SUM(CASE WHEN ea.IsReturned = 1 THEN 1 ELSE 0 END) AS TotalReturned
        FROM Employees e
        LEFT JOIN EmployeeAssets ea ON e.EmployeeID = ea.EmployeeID
        WHERE e.EmployeeID = :id
        GROUP BY e.EmployeeID, e.EmployeeName, e.Department
    """), {"id": employee_id})
    return result.mappings().first()