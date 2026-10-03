# Ghana Highway Authority (GHA) Asset Management System
## Comprehensive User Manual

Welcome to the **Ghana Highway Authority (GHA) Asset Management System**. This user manual provides step-by-step instructions on navigating, operating, and managing assets, maintenance schedules, financial depreciation reports, and user workflows across the platform.

---

## 1. System Overview & Key Features

The GHA Asset Management System is an enterprise solution built to manage the complete lifecycle of fixed and non-fixed assets across all GHA divisions and regional centers.

### Key Capabilities:
- **Asset Registration & Bulk Import**: Register single assets with custom attributes or import hundreds of assets via CSV/Excel template mapping.
- **Categorization & Tagging**: Automatically assign unique **Asset Identification Numbers (AIN)**, major categories (*Fixed Asset*, *Non-Fixed Asset*), asset types (*Moveable*, *Non Moveable*), divisions, and locations.
- **Image Lightbox & Document Storage**: Upload asset photos and click thumbnails anywhere in the system to launch full-screen zoom previews.
- **Automated Straight-Line Depreciation**: Real-time calculations of **Annual Depreciation**, **Accumulated Depreciation**, and **Current Book Value**.
- **Asset Transfers & Approval Workflow**: Transfer asset custody between divisions and track complete ownership histories.
- **Maintenance & Servicing Log**: Schedule routine checks, record parts replaced, track service providers, and calculate total maintenance spend.
- **Disposal & Archive Management**: Safely decommission end-of-life assets with mandatory reason logging and audit archival.
- **Custom Report Builder & CSV Export**: Generate custom reports filtering by division, category, and status with customizable export columns.

---

## 2. User Roles & Access Control

The system implements Role-Based Access Control (RBAC) to ensure security and compliance:

| Role | Permissions & Access Level |
| :--- | :--- |
| **Super Administrator** | Full system control: User management, asset approvals, asset edits, disposals, archival, and system settings. |
| **Executive / Auditor** | Read-only access to all divisions, full financial report generation, depreciation schedules, and audit logs. |
| **Division Head / Officer** | Add new assets (pending approval), initiate transfers, log maintenance, and manage division assets. |
| **Field Custodian / Worker** | View assigned assets, inspect maintenance tasks, and view asset details. |

---

## 3. Navigation & Dashboard Overview

Upon logging in, the primary sidebar menu gives you quick access to all modules:

```
├── 📊 Dashboard              (High-level KPIs & system summary)
├── 📦 Asset Inventory         (Main list, filtering, registration & image previews)
├── 📊 Category Summary        (Financial breakdown by category)
├── 📈 Reports & Analytics     (Depreciation schedule, charts & CSV builder)
├── 🔧 Maintenance Schedule    (Servicing, parts, and maintenance spend)
├── 📜 Asset History           (Complete audit trail of all asset actions)
├── 🗑️ Disposed Assets        (Decommissioned assets)
├── 📁 Archived Assets        (Permanently archived asset records)
├── 👥 User Management        (Admin role assignment & user accounts)
└── ⚙️ Settings               (Profile and system preferences)
```

### Dashboard Highlights:
- **Total Approved Assets Card**: Quick count of fixed and non-fixed assets.
- **Financial Purchase Value Card**: Total purchase cost of all active assets.
- **Pending Approvals Card**: Quick access to assets requiring administrative review.
- **Division Distribution Chart**: Visual breakdown of asset allocations.

---

## 4. Asset Inventory Management

Navigate to **Asset Inventory** (`/inventory`) to view, manage, and register assets.

### 4.1 Inventory Tabs
- **All Approved**: View all active approved assets.
- **Fixed Moveable**: View vehicles, mobile plant, heavy machinery, equipment.
- **Fixed Non-Moveable**: View land, office buildings, installed infrastructure, bridges.
- **Non-Fixed Assets**: View consumable supplies and office items.
- **Pending Approval**: Review assets awaiting Super Admin sign-off.

### 4.2 Full-Screen Image Lightbox Preview
Whenever an asset image thumbnail appears (in the inventory table or details modal):
1. Hover over the asset image to reveal the **Zoom In** overlay.
2. Click the image to launch the **Full-Screen Lightbox Preview**.
3. View the asset name, ID, and high-resolution photo.
4. Press `ESC` or click anywhere outside to close the preview.

### 4.3 Registering a New Asset
1. Click the **`+ Add Asset`** button at the top right of the Inventory page.
2. Complete the multi-step form:
   - **General Info**: Asset Name, Major Category (*Fixed* or *Non-Fixed*), Sub Category, Reporting Division, Location, Room No.
   - **Financial Info**: Purchase Cost (₵), Purchase Date, Useful Life (Years), Residual Value (₵).
   - **Specifications**: Brand, Model, Serial Number, Vehicle Plate No, Engine No, Chassis No.
   - **Asset Photo**: Upload a clear photograph.
3. Click **Submit Asset**. (Assets added by division staff enter *Pending Approval* status).

### 4.4 Bulk Importing Assets via CSV/Excel
1. Click **`Import Assets`**.
2. Download the provided sample CSV template.
3. Upload your completed CSV file.
4. Use the interactive column mapping interface to match CSV headers to system fields.
5. Review validation results and click **Import Assets**.

---

## 5. Depreciation & Financial Reporting

Navigate to **Reports & Analytics** (`/reports`) or **Category Summary** (`/category-summary`).

### 5.1 Straight-Line Depreciation Formula
Depreciation is calculated automatically for all approved Fixed Assets using standard accounting formulas:

$$\text{Annual Depreciation} = \frac{\text{Purchase Cost} - \text{Residual Value}}{\text{Useful Life (Years)}}$$

$$\text{Monthly Depreciation} = \frac{\text{Annual Depreciation}}{12}$$

$$\text{Accumulated Depreciation} = \text{Monthly Depreciation} \times \text{Elapsed Months}$$

$$\text{Current Book Value} = \text{Purchase Cost} - \text{Accumulated Depreciation}$$

> [!NOTE]
> Accumulated Depreciation is automatically capped at the depreciable amount ($\text{Cost} - \text{Residual Value}$).

### 5.2 Financial KPI Summary
- **Total Purchase Value**: Sum of original acquisition costs.
- **Annual Depreciation**: Total yearly depreciation rate across all fixed assets.
- **Accumulated Depreciation**: Total cumulative depreciation loss to date.
- **Current Book Value**: Net current balance sheet value of all assets.

### 5.3 Fixed Assets Depreciation & Accumulated Schedule
The Reports page features an itemized **Depreciation Schedule Table**:
- Shows AIN, Asset Name, Category, Purchase Date, Useful Life, Purchase Cost, Annual Depreciation, Accumulated Depreciation, Book Value, and Depreciation % Progress Bar.
- Use the **Schedule Filter** search box to quickly locate specific assets by AIN or name.

### 5.4 Custom Report Builder & CSV Export
1. Scroll to the **Report Builder** section on the Reports page.
2. Filter by **Category**, **Division**, or **Status**.
3. Toggle the exact columns you wish to export (e.g., *AIN*, *Asset Name*, *Cost*, *Annual Depreciation*, *Accumulated Depreciation*, *Book Value*).
4. Click **`Export CSV`** to download the formatted report.

---

## 6. Asset Maintenance & Servicing

Navigate to **Maintenance Schedule** (`/maintenance`).

### 6.1 Logging a Maintenance Task
1. Click **`Log Maintenance`**.
2. Select the asset by AIN or Name.
3. Enter task details:
   - **Routine Check / Service Type** (e.g., *Oil Change*, *Engine Overhaul*, *HVAC Inspection*).
   - **Scheduled Date** and **Completion Date**.
   - **Parts Maintained / Replaced** (e.g., *Brake Pads, Oil Filter*).
   - **Service Provider / Workshop Name**.
   - **Service Cost (₵)**.
4. Click **Save Maintenance Record**.

### 6.2 Reviewing Asset Service History & Adjusted Value
Inside the Asset Details Modal, the **Financial Info** section displays:
- **Base Book Value**
- **Total Maintenance Spend** (Sum of all completed service costs)
- **Adjusted Asset Value** ($\text{Current Book Value} + \text{Total Maintenance Spend}$)

---

## 7. Asset Transfers & Custody Tracking

To transfer an asset between divisions or custodians:
1. Open **Asset Inventory** or the **Asset Details Modal**.
2. Click the **`Transfer`** button.
3. Select the **Destination Division**, **New Location**, and **Custodian Name**.
4. Enter the **Reason for Transfer** (e.g., *Project Reassignment*).
5. Click **Confirm Transfer**.
6. The transfer action is permanently recorded in the **Asset History & Audit Trail**.

---

## 8. Asset Disposal & Archival

When an asset reaches end-of-life, becomes unserviceable, or is sold:
1. Select the asset and click **Dispose Asset** or select **Status: Disposed**.
2. A mandatory **Disposal Reason Modal** will prompt you to enter the reason (e.g., *Beyond Economical Repair*, *Auctioned*).
3. The asset moves to the **Disposed Assets** page (`/disposed`).
4. Super Administrators can archive disposed assets to permanently move them to **Archived Assets** (`/archived`) for audit retention.

---

## 9. Status Breakdown Reference

The **Status Breakdown** panel provides real-time counts and percentage distributions:

| Status / Condition | Color Indicator | Description |
| :--- | :--- | :--- |
| **Good** | 🔵 Blue | Asset is in good/excellent operating condition. |
| **Fair** | 🟡 Yellow | Asset is operational but shows wear. |
| **Poor** | 🔴 Red | Asset requires attention or major servicing. |
| **Active** | 🟢 Green | Asset is actively deployed in division operations. |
| **Maintenance** | 🟠 Orange | Asset is currently undergoing service or repair. |
| **Inactive** | ⚪ Gray | Asset is in storage or unassigned. |
| **Disposed** | 🟤 Dark Red | Asset has been decommissioned. |
| **Archived** | 🟣 Purple | Asset records are archived for audit compliance. |

---

## 10. Frequently Asked Questions (FAQ)

> [!TIP]
> **Q: How do I zoom into an asset picture?**  
> **A:** Simply click on any asset thumbnail in the inventory table or details modal. A full-screen lightbox will open. Press `ESC` or click outside to exit.

> [!IMPORTANT]
> **Q: Why does a newly registered asset not appear on the main Inventory list?**  
> **A:** If you are a Division Officer, new assets enter **Pending Approval** status first. They will appear on the main inventory list once a Super Administrator approves them.

> [!NOTE]
> **Q: How is Book Value calculated for non-fixed assets?**  
> **A:** Non-fixed assets (office consumables, small tools) do not depreciate; their Book Value equals their original Purchase Cost.

---

*© Ghana Highway Authority (GHA). All rights reserved.*
