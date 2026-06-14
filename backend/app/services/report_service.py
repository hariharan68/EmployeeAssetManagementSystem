"""Builds live PDF reports from fresh DB data using reportlab."""
from io import BytesIO
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import text

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)

BRAND = colors.HexColor("#1d4ed8")
LIGHT = colors.HexColor("#f1f5f9")
GREY = colors.HexColor("#64748b")


# ── shared helpers ─────────────────────────────────────────────────────────

def _styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportTitle", fontSize=20, leading=24,
        textColor=colors.HexColor("#0f172a"), spaceAfter=2,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="ReportSub", fontSize=10, textColor=GREY, spaceAfter=14,
    ))
    styles.add(ParagraphStyle(
        name="Section", fontSize=13, leading=16, spaceBefore=10, spaceAfter=8,
        textColor=BRAND, fontName="Helvetica-Bold",
    ))
    # Cell styles used inside tables so long text wraps instead of overflowing.
    styles.add(ParagraphStyle(
        name="Cell", fontSize=9, leading=11,
        textColor=colors.HexColor("#0f172a"),
    ))
    styles.add(ParagraphStyle(
        name="CellHead", fontSize=9, leading=11,
        textColor=colors.white, fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="CellKey", fontSize=10, leading=13,
        textColor=GREY, fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="CellVal", fontSize=10, leading=13,
        textColor=colors.HexColor("#0f172a"),
    ))
    return styles


def _esc(value):
    """Stringify a cell value and escape XML so Paragraph renders it safely."""
    if value is None:
        return ""
    s = str(value)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _header(styles, title, subtitle):
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    return [
        Paragraph(title, styles["ReportTitle"]),
        Paragraph(f"{subtitle} &nbsp;&bull;&nbsp; Generated {stamp}", styles["ReportSub"]),
    ]


def _detail_table(styles, rows):
    """Two-column key/value table for a single record."""
    data = [
        [Paragraph(_esc(k), styles["CellKey"]), Paragraph(_esc(v), styles["CellVal"])]
        for k, v in rows
    ]
    t = Table(data, colWidths=[55 * mm, 110 * mm])
    t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def _grid_table(styles, headers, rows, col_widths=None):
    """Full data grid with a branded header row. Cells wrap via Paragraph."""
    head = [Paragraph(_esc(h), styles["CellHead"]) for h in headers]
    body = [[Paragraph(_esc(c), styles["Cell"]) for c in r] for r in rows]
    data = [head] + body
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def _build(elements):
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title="EmpAssetDB Report",
    )
    doc.build(elements)
    buf.seek(0)
    return buf


# ── reports ────────────────────────────────────────────────────────────────

def employee_report(db: Session, employee_id: int):
    emp = db.execute(
        text("SELECT * FROM Employees WHERE EmployeeID = :id"),
        {"id": employee_id}
    ).mappings().first()
    if not emp:
        return None

    assignments = db.execute(text("""
        SELECT a.AssetCode, a.AssetName, a.AssetType,
               ea.AssignedDate, ea.ReturnedDate, ea.IsReturned
        FROM EmployeeAssets ea
        JOIN Assets a ON ea.AssetID = a.AssetID
        WHERE ea.EmployeeID = :id
        ORDER BY ea.AssignedDate DESC
    """), {"id": employee_id}).mappings().all()

    styles = _styles()
    elements = _header(styles, "Employee Report", emp["EmployeeName"])

    elements.append(Paragraph("Profile", styles["Section"]))
    elements.append(_detail_table(styles, [
        ("Employee Code", emp["EmployeeCode"]),
        ("Name", emp["EmployeeName"]),
        ("Department", emp["Department"]),
        ("Designation", emp["Designation"]),
        ("Email", emp["Email"]),
        ("Mobile", emp["Mobile"]),
        ("Joining Date", emp["JoiningDate"]),
        ("Status", "Active" if emp["IsActive"] else "Inactive"),
    ]))

    holding = sum(1 for a in assignments if not a["IsReturned"])
    returned = sum(1 for a in assignments if a["IsReturned"])
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"Assets &mdash; {len(assignments)} total, {holding} currently holding, {returned} returned",
        styles["Section"]))

    if assignments:
        rows = [[
            a["AssetCode"], a["AssetName"], a["AssetType"],
            a["AssignedDate"], a["ReturnedDate"] or "-",
            "Returned" if a["IsReturned"] else "Holding",
        ] for a in assignments]
        elements.append(_grid_table(
            styles,
            ["Code", "Asset", "Type", "Assigned", "Returned", "Status"],
            rows,
            col_widths=[22 * mm, 45 * mm, 26 * mm, 26 * mm, 26 * mm, 22 * mm],
        ))
    else:
        elements.append(Paragraph("No assets assigned.", styles["Normal"]))

    return _build(elements)


def asset_report(db: Session, asset_id: int):
    asset = db.execute(
        text("SELECT * FROM Assets WHERE AssetID = :id"),
        {"id": asset_id}
    ).mappings().first()
    if not asset:
        return None

    history = db.execute(text("""
        SELECT e.EmployeeCode, e.EmployeeName, e.Department,
               ea.AssignedDate, ea.ReturnedDate, ea.IsReturned
        FROM EmployeeAssets ea
        JOIN Employees e ON ea.EmployeeID = e.EmployeeID
        WHERE ea.AssetID = :id
        ORDER BY ea.AssignedDate DESC
    """), {"id": asset_id}).mappings().all()

    styles = _styles()
    elements = _header(styles, "Asset Report", asset["AssetName"] or asset["AssetCode"])

    elements.append(Paragraph("Details", styles["Section"]))
    elements.append(_detail_table(styles, [
        ("Asset Code", asset["AssetCode"]),
        ("Name", asset["AssetName"]),
        ("Type", asset["AssetType"]),
        ("Brand", asset["Brand"]),
        ("Model", asset["Model"]),
        ("Serial Number", asset["SerialNumber"]),
        ("Purchase Date", asset["PurchaseDate"]),
        ("Status", asset["Status"]),
    ]))

    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Assignment History &mdash; {len(history)} record(s)", styles["Section"]))
    if history:
        rows = [[
            h["EmployeeCode"], h["EmployeeName"], h["Department"],
            h["AssignedDate"], h["ReturnedDate"] or "-",
            "Returned" if h["IsReturned"] else "Holding",
        ] for h in history]
        elements.append(_grid_table(
            styles,
            ["Emp Code", "Employee", "Dept", "Assigned", "Returned", "Status"],
            rows,
            col_widths=[22 * mm, 42 * mm, 26 * mm, 26 * mm, 26 * mm, 22 * mm],
        ))
    else:
        elements.append(Paragraph("This asset has never been assigned.", styles["Normal"]))

    return _build(elements)


def employees_list_report(db: Session):
    employees = db.execute(
        text("SELECT * FROM Employees WHERE IsActive = 1 ORDER BY EmployeeCode")
    ).mappings().all()

    styles = _styles()
    elements = _header(styles, "Employees Report", f"{len(employees)} active employees")
    rows = [[
        e["EmployeeCode"], e["EmployeeName"], e["Department"],
        e["Designation"], e["Email"], e["Mobile"],
    ] for e in employees]
    elements.append(_grid_table(
        styles,
        ["Code", "Name", "Department", "Designation", "Email", "Mobile"],
        rows,
        col_widths=[20 * mm, 33 * mm, 24 * mm, 32 * mm, 35 * mm, 24 * mm],
    ))
    return _build(elements)


def assets_list_report(db: Session):
    assets = db.execute(
        text("SELECT * FROM Assets ORDER BY AssetCode")
    ).mappings().all()

    styles = _styles()
    elements = _header(styles, "Assets Report", f"{len(assets)} assets")
    rows = [[
        a["AssetCode"], a["AssetName"], a["AssetType"],
        a["Brand"], a["SerialNumber"], a["Status"],
    ] for a in assets]
    elements.append(_grid_table(
        styles,
        ["Code", "Name", "Type", "Brand", "Serial", "Status"],
        rows,
        col_widths=[22 * mm, 38 * mm, 26 * mm, 28 * mm, 35 * mm, 24 * mm],
    ))
    return _build(elements)
