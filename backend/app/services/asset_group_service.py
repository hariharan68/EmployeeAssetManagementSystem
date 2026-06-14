from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError


def get_all_groups(db: Session):
    result = db.execute(text("""
        SELECT
            g.GroupID,
            g.GroupCode,
            g.GroupName,
            g.CreatedAt,
            COUNT(a.AssetID) AS TotalAssets,
            SUM(CASE WHEN a.Status = 'Available'
                THEN 1 ELSE 0 END) AS AvailableCount,
            SUM(CASE WHEN a.Status = 'Assigned'
                THEN 1 ELSE 0 END) AS AssignedCount
        FROM AssetGroups g
        LEFT JOIN Assets a ON g.GroupID = a.GroupID
        GROUP BY
            g.GroupID,
            g.GroupCode,
            g.GroupName,
            g.CreatedAt
        ORDER BY g.GroupName
    """))
    return result.mappings().all()


def get_group_by_id(db: Session, group_id: int):
    result = db.execute(
        text("SELECT * FROM AssetGroups WHERE GroupID = :id"),
        {"id": group_id}
    ).mappings().first()
    return result


def create_group(db: Session, data: dict):
    try:
        db.execute(text("""
            INSERT INTO AssetGroups (GroupCode, GroupName)
            VALUES (:code, :name)
        """), {
            "code": data.get("GroupCode"),
            "name": data.get("GroupName")
        })
        db.commit()
        return None
    except IntegrityError:
        db.rollback()
        return "GroupCode already exists"


def update_group(db: Session, group_id: int, data: dict):
    db.execute(text("""
        UPDATE AssetGroups SET
            GroupCode = COALESCE(:code, GroupCode),
            GroupName = COALESCE(:name, GroupName)
        WHERE GroupID = :id
    """), {
        "code": data.get("GroupCode"),
        "name": data.get("GroupName"),
        "id":   group_id
    })
    db.commit()


def delete_group(db: Session, group_id: int):
    assets = db.execute(
        text("SELECT COUNT(*) as cnt FROM Assets WHERE GroupID = :id"),
        {"id": group_id}
    ).first()

    if assets.cnt > 0:
        return f"Cannot delete. Group has {assets.cnt} assets inside."

    db.execute(
        text("DELETE FROM AssetGroups WHERE GroupID = :id"),
        {"id": group_id}
    )
    db.commit()
    return None


def get_assets_by_group(db: Session, group_id: int):
    result = db.execute(text("""
        SELECT
            a.AssetID,
            a.AssetCode,
            a.AssetName,
            a.AssetType,
            a.Brand,
            a.Model,
            a.SerialNumber,
            a.PurchaseDate,
            a.Status,
            g.GroupName
        FROM Assets a
        LEFT JOIN AssetGroups g ON a.GroupID = g.GroupID
        WHERE a.GroupID = :id
        ORDER BY a.AssetCode
    """), {"id": group_id})
    return result.mappings().all()