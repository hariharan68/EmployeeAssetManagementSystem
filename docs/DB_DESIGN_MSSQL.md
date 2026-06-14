# Employee Asset Management — MSSQL Database Design

## Database: `EmpAssetDB`

---

## Entity Relationship Diagram (Text)

```
┌──────────────────────┐
│        Users         │
│──────────────────────│
│ UserID      PK INT   │
│ Username    NVARCHAR │
│ Email       NVARCHAR │
│ PasswordHash NVARCHAR│
│ Role        NVARCHAR │  ← 'Admin' | 'User'
│ IsActive    BIT      │
│ CreatedAt   DATETIME │
└──────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│     AssetGroups      │         │      Employees       │
│──────────────────────│         │──────────────────────│
│ GroupID     PK INT   │         │ EmployeeID  PK INT   │
│ GroupCode   NVARCHAR │ UNIQUE  │ EmployeeCode NVARCHAR│ UNIQUE
│ GroupName   NVARCHAR │         │ EmployeeName NVARCHAR│
│ CreatedAt   DATETIME │         │ Department  NVARCHAR │
└──────────┬───────────┘         │ Designation NVARCHAR │
           │ 1                   │ Email       NVARCHAR │
           │                     │ Mobile      NVARCHAR │
           │ N                   │ JoiningDate DATE     │
┌──────────▼───────────┐         │ IsActive    BIT      │
│        Assets        │         │ CreatedAt   DATETIME │
│──────────────────────│         └──────────┬───────────┘
│ AssetID     PK INT   │                    │ 1
│ AssetCode   NVARCHAR │ UNIQUE             │
│ AssetName   NVARCHAR │                    │ N
│ AssetType   NVARCHAR │         ┌──────────▼───────────┐
│ Brand       NVARCHAR │         │   EmployeeAssets     │
│ Model       NVARCHAR │         │──────────────────────│
│ SerialNumber NVARCHAR│ UNIQUE  │ AssignmentID PK INT  │
│ PurchaseDate DATE    │◄───── N │ EmployeeID  FK INT   │
│ Status      NVARCHAR │         │ AssetID     FK INT   │
│ GroupID     FK INT   │         │ AssignedDate DATE    │
│ CreatedAt   DATETIME │         │ ReturnedDate DATE    │
└──────────────────────┘         │ IsReturned  BIT      │
                                 │ Remarks     NVARCHAR │
                                 └──────────────────────┘
```

**Relationships:**
- `AssetGroups` 1 → N `Assets` (GroupID FK, nullable)
- `Employees` 1 → N `EmployeeAssets` (EmployeeID FK)
- `Assets` 1 → N `EmployeeAssets` (AssetID FK)

---

## DDL: Create Database

```sql
CREATE DATABASE EmpAssetDB;
GO
USE EmpAssetDB;
GO
```

---

## DDL: Table — Users

```sql
CREATE TABLE Users (
    UserID        INT            IDENTITY(1,1) PRIMARY KEY,
    Username      NVARCHAR(100)  NOT NULL,
    Email         NVARCHAR(255)  NOT NULL,
    PasswordHash  NVARCHAR(255)  NOT NULL,
    Role          NVARCHAR(20)   NOT NULL DEFAULT 'User',
    IsActive      BIT            NOT NULL DEFAULT 1,
    CreatedAt     DATETIME       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_Users_Email    UNIQUE (Email),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT CK_Users_Role     CHECK  (Role IN ('Admin', 'User'))
);
GO
```

---

## DDL: Table — AssetGroups

```sql
CREATE TABLE AssetGroups (
    GroupID    INT           IDENTITY(1,1) PRIMARY KEY,
    GroupCode  NVARCHAR(50)  NOT NULL,
    GroupName  NVARCHAR(150) NOT NULL,
    CreatedAt  DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_AssetGroups_Code UNIQUE (GroupCode)
);
GO
```

---

## DDL: Table — Employees

```sql
CREATE TABLE Employees (
    EmployeeID    INT           IDENTITY(1,1) PRIMARY KEY,
    EmployeeCode  NVARCHAR(50)  NULL,
    EmployeeName  NVARCHAR(200) NOT NULL,
    Department    NVARCHAR(100) NULL,
    Designation   NVARCHAR(100) NULL,
    Email         NVARCHAR(255) NULL,
    Mobile        NVARCHAR(20)  NULL,
    JoiningDate   DATE          NULL,
    IsActive      BIT           NOT NULL DEFAULT 1,
    CreatedAt     DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_Employees_Code UNIQUE (EmployeeCode)
);
GO
```

---

## DDL: Table — Assets

```sql
CREATE TABLE Assets (
    AssetID       INT           IDENTITY(1,1) PRIMARY KEY,
    AssetCode     NVARCHAR(50)  NULL,
    AssetName     NVARCHAR(200) NULL,
    AssetType     NVARCHAR(100) NULL,
    Brand         NVARCHAR(100) NULL,
    Model         NVARCHAR(100) NULL,
    SerialNumber  NVARCHAR(100) NULL,
    PurchaseDate  DATE          NULL,
    Status        NVARCHAR(20)  NOT NULL DEFAULT 'Available',
    GroupID       INT           NULL,
    CreatedAt     DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_Assets_Code         UNIQUE (AssetCode),
    CONSTRAINT UQ_Assets_SerialNumber UNIQUE (SerialNumber),
    CONSTRAINT CK_Assets_Status       CHECK  (Status IN ('Available', 'Assigned', 'UnderMaintenance', 'Retired')),
    CONSTRAINT FK_Assets_GroupID      FOREIGN KEY (GroupID)
        REFERENCES AssetGroups (GroupID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
GO
```

---

## DDL: Table — EmployeeAssets (Assignment Table)

```sql
CREATE TABLE EmployeeAssets (
    AssignmentID  INT           IDENTITY(1,1) PRIMARY KEY,
    EmployeeID    INT           NOT NULL,
    AssetID       INT           NOT NULL,
    AssignedDate  DATE          NOT NULL,
    ReturnedDate  DATE          NULL,
    IsReturned    BIT           NOT NULL DEFAULT 0,
    Remarks       NVARCHAR(500) NULL,

    CONSTRAINT FK_EmpAssets_EmployeeID FOREIGN KEY (EmployeeID)
        REFERENCES Employees (EmployeeID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,

    CONSTRAINT FK_EmpAssets_AssetID FOREIGN KEY (AssetID)
        REFERENCES Assets (AssetID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);
GO
```

---

## DDL: Indexes (Performance)

```sql
-- Speed up employee lookup by code
CREATE NONCLUSTERED INDEX IX_Employees_Code
    ON Employees (EmployeeCode);

-- Speed up asset lookup by status (common filter)
CREATE NONCLUSTERED INDEX IX_Assets_Status
    ON Assets (Status);

-- Speed up asset group lookup
CREATE NONCLUSTERED INDEX IX_Assets_GroupID
    ON Assets (GroupID);

-- Speed up assignment queries by employee
CREATE NONCLUSTERED INDEX IX_EmpAssets_EmployeeID
    ON EmployeeAssets (EmployeeID);

-- Speed up assignment queries by asset
CREATE NONCLUSTERED INDEX IX_EmpAssets_AssetID
    ON EmployeeAssets (AssetID);

-- Speed up active assignment filter
CREATE NONCLUSTERED INDEX IX_EmpAssets_IsReturned
    ON EmployeeAssets (IsReturned);
GO
```

---

## Seed Data

```sql
-- Insert default Admin user
-- Password: Admin@123 (bcrypt hashed — replace hash below with real bcrypt output)
INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive)
VALUES (
    'admin',
    'admin@company.com',
    '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH',
    'Admin',
    1
);

-- Insert sample asset groups
INSERT INTO AssetGroups (GroupCode, GroupName) VALUES ('LAPTOP',   'Laptops');
INSERT INTO AssetGroups (GroupCode, GroupName) VALUES ('MOBILE',   'Mobile Phones');
INSERT INTO AssetGroups (GroupCode, GroupName) VALUES ('MONITOR',  'Monitors');
INSERT INTO AssetGroups (GroupCode, GroupName) VALUES ('KEYBOARD', 'Keyboards & Peripherals');
INSERT INTO AssetGroups (GroupCode, GroupName) VALUES ('VEHICLE',  'Vehicles');
GO
```

---

## Common Queries Used by the Application

### 1. Register User — Check duplicate
```sql
SELECT UserID FROM Users WHERE Email    = 'user@example.com';
SELECT UserID FROM Users WHERE Username = 'john_doe';
```

### 2. Register User — Insert
```sql
INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive)
VALUES ('john_doe', 'john@example.com', '<bcrypt_hash>', 'User', 1);
```

### 3. Login — Fetch user
```sql
SELECT UserID, Username, Email, PasswordHash, Role, IsActive
FROM   Users
WHERE  Email = 'john@example.com' AND IsActive = 1;
```

### 4. Auth middleware — Verify token user
```sql
SELECT UserID, Username, Email, Role, IsActive
FROM   Users
WHERE  UserID = 1 AND IsActive = 1;
```

### 5. Get all active employees
```sql
SELECT * FROM Employees WHERE IsActive = 1;
```

### 6. Get employee by ID
```sql
SELECT * FROM Employees WHERE EmployeeID = 5;
```

### 7. Create employee
```sql
INSERT INTO Employees (EmployeeCode, EmployeeName, Department, Designation, Email, Mobile, JoiningDate)
VALUES ('EMP001', 'John Smith', 'IT', 'Developer', 'john@company.com', '9876543210', '2024-01-15');
```

### 8. Update employee (partial — COALESCE preserves unchanged fields)
```sql
UPDATE Employees SET
    EmployeeCode = COALESCE(NULL,      EmployeeCode),
    EmployeeName = COALESCE('New Name', EmployeeName),
    Department   = COALESCE(NULL,      Department),
    Designation  = COALESCE(NULL,      Designation),
    Email        = COALESCE(NULL,      Email),
    Mobile       = COALESCE(NULL,      Mobile),
    JoiningDate  = COALESCE(NULL,      JoiningDate),
    IsActive     = COALESCE(NULL,      IsActive)
WHERE EmployeeID = 5;
```

### 9. Soft-delete employee
```sql
UPDATE Employees SET IsActive = 0 WHERE EmployeeID = 5;
```

### 10. Employee asset summary
```sql
SELECT
    e.EmployeeID,
    e.EmployeeName,
    e.Department,
    COUNT(ea.AssignmentID)                             AS TotalAssigned,
    SUM(CASE WHEN ea.IsReturned = 0 THEN 1 ELSE 0 END) AS CurrentlyHolding,
    SUM(CASE WHEN ea.IsReturned = 1 THEN 1 ELSE 0 END) AS TotalReturned
FROM Employees e
LEFT JOIN EmployeeAssets ea ON e.EmployeeID = ea.EmployeeID
WHERE e.EmployeeID = 5
GROUP BY e.EmployeeID, e.EmployeeName, e.Department;
```

### 11. Get all assets (with optional status filter)
```sql
-- All assets
SELECT * FROM Assets;

-- Filtered by status
SELECT * FROM Assets WHERE Status = 'Available';
```

### 12. Create asset
```sql
INSERT INTO Assets (AssetCode, AssetName, AssetType, Brand, Model, SerialNumber, PurchaseDate, Status, GroupID)
VALUES ('LAP001', 'Dell Latitude 5520', 'Laptop', 'Dell', 'Latitude 5520', 'SN-12345', '2023-06-01', 'Available', 1);
```

### 13. Update asset (partial)
```sql
UPDATE Assets SET
    AssetCode    = COALESCE(NULL,        AssetCode),
    AssetName    = COALESCE(NULL,        AssetName),
    AssetType    = COALESCE(NULL,        AssetType),
    Brand        = COALESCE(NULL,        Brand),
    Model        = COALESCE(NULL,        Model),
    SerialNumber = COALESCE(NULL,        SerialNumber),
    PurchaseDate = COALESCE(NULL,        PurchaseDate),
    Status       = COALESCE('Retired',   Status)
WHERE AssetID = 3;
```

### 14. Delete asset (hard delete)
```sql
DELETE FROM Assets WHERE AssetID = 3;
```

### 15. Get all asset groups with counts
```sql
SELECT
    g.GroupID,
    g.GroupCode,
    g.GroupName,
    g.CreatedAt,
    COUNT(a.AssetID)                                         AS TotalAssets,
    SUM(CASE WHEN a.Status = 'Available' THEN 1 ELSE 0 END)  AS AvailableCount,
    SUM(CASE WHEN a.Status = 'Assigned'  THEN 1 ELSE 0 END)  AS AssignedCount
FROM AssetGroups g
LEFT JOIN Assets a ON g.GroupID = a.GroupID
GROUP BY g.GroupID, g.GroupCode, g.GroupName, g.CreatedAt
ORDER BY g.GroupName;
```

### 16. Get assets inside a group
```sql
SELECT
    a.AssetID, a.AssetCode, a.AssetName, a.AssetType,
    a.Brand, a.Model, a.SerialNumber, a.PurchaseDate,
    a.Status, g.GroupName
FROM Assets a
LEFT JOIN AssetGroups g ON a.GroupID = g.GroupID
WHERE a.GroupID = 1
ORDER BY a.AssetCode;
```

### 17. Assign asset — check status first
```sql
SELECT Status FROM Assets WHERE AssetID = 3;
```

### 18. Assign asset — insert assignment + update status
```sql
INSERT INTO EmployeeAssets (EmployeeID, AssetID, AssignedDate, IsReturned, Remarks)
VALUES (5, 3, '2025-06-10', 0, 'Issued for project work');

UPDATE Assets SET Status = 'Assigned' WHERE AssetID = 3;
```

### 19. Return asset — fetch assignment
```sql
SELECT * FROM EmployeeAssets WHERE AssignmentID = 12;
```

### 20. Return asset — mark returned + free asset
```sql
UPDATE EmployeeAssets SET
    IsReturned   = 1,
    ReturnedDate = '2025-06-15',
    Remarks      = COALESCE('Good condition', Remarks)
WHERE AssignmentID = 12;

UPDATE Assets SET Status = 'Available' WHERE AssetID = 3;
```

### 21. Get all assignments (full joined view)
```sql
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
ORDER BY ea.AssignedDate DESC;
```

### 22. Get assignments for one employee
```sql
SELECT
    ea.AssignmentID,
    ea.AssignedDate,
    ea.ReturnedDate,
    ea.IsReturned,
    ea.Remarks,
    a.AssetName,
    a.AssetType,
    a.AssetCode,
    a.Brand,
    a.Model,
    a.SerialNumber
FROM EmployeeAssets ea
JOIN Assets a ON ea.AssetID = a.AssetID
WHERE ea.EmployeeID = 5
ORDER BY ea.AssignedDate DESC;
```

---

## Useful Admin / Reporting Queries

### Assets currently held by each employee
```sql
SELECT
    e.EmployeeName,
    e.Department,
    a.AssetCode,
    a.AssetName,
    a.AssetType,
    ea.AssignedDate
FROM EmployeeAssets ea
JOIN Employees e ON ea.EmployeeID = e.EmployeeID
JOIN Assets    a ON ea.AssetID    = a.AssetID
WHERE ea.IsReturned = 0
ORDER BY e.EmployeeName;
```

### Asset utilization by group
```sql
SELECT
    g.GroupName,
    COUNT(a.AssetID)                                         AS Total,
    SUM(CASE WHEN a.Status = 'Available' THEN 1 ELSE 0 END)  AS Available,
    SUM(CASE WHEN a.Status = 'Assigned'  THEN 1 ELSE 0 END)  AS Assigned,
    SUM(CASE WHEN a.Status = 'Retired'   THEN 1 ELSE 0 END)  AS Retired
FROM AssetGroups g
LEFT JOIN Assets a ON g.GroupID = a.GroupID
GROUP BY g.GroupName
ORDER BY Total DESC;
```

### Assets not assigned in last 6 months
```sql
SELECT a.AssetCode, a.AssetName, a.AssetType, a.Brand, a.Status
FROM   Assets a
WHERE  a.Status = 'Available'
  AND  (
         a.AssetID NOT IN (SELECT AssetID FROM EmployeeAssets)
         OR a.AssetID IN (
             SELECT AssetID FROM EmployeeAssets
             GROUP BY AssetID
             HAVING MAX(ReturnedDate) < DATEADD(MONTH, -6, GETDATE())
         )
       );
```

### Employee count per department with active assets
```sql
SELECT
    e.Department,
    COUNT(DISTINCT e.EmployeeID)                             AS EmployeeCount,
    COUNT(ea.AssignmentID)                                   AS ActiveAssignments
FROM Employees e
LEFT JOIN EmployeeAssets ea
       ON e.EmployeeID = ea.EmployeeID AND ea.IsReturned = 0
WHERE e.IsActive = 1
GROUP BY e.Department
ORDER BY EmployeeCount DESC;
```

### Full asset history for a specific asset
```sql
SELECT
    ea.AssignmentID,
    e.EmployeeName,
    e.Department,
    ea.AssignedDate,
    ea.ReturnedDate,
    ea.IsReturned,
    ea.Remarks
FROM EmployeeAssets ea
JOIN Employees e ON ea.EmployeeID = e.EmployeeID
WHERE ea.AssetID = 3
ORDER BY ea.AssignedDate DESC;
```

---

## Notes

- All tables use `IDENTITY(1,1)` for auto-increment primary keys.
- `IsActive` on `Employees` and `Users` enables soft delete — records are never physically removed.
- `Assets.Status` has a CHECK constraint: `Available`, `Assigned`, `UnderMaintenance`, `Retired`.
- `Assets.GroupID` is nullable — assets can exist without a group.
- The `EmployeeAssets.IsReturned` bit (0/1) drives the active assignment logic.
- The backend uses **Windows Authentication** (`mssql+pyodbc://@SERVER/DB`) — no SQL username/password in the connection string.
