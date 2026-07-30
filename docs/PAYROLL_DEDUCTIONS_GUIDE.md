# Payroll Deductions System Guide

This document details how deductions are calculated, configured, prorated, and managed within the JAJR Attendance & Payroll System (`v2-attendance`).

---

## 1. Overview of Deductions

The payroll system categorizes deductions into two main components:
1. **Mandatory Government Contributions**:
   - **SSS** (Social Security System)
   - **PhilHealth** (PHIC - Philippine Health Insurance Corporation)
   - **Pag-IBIG** (HDMF - Home Development Mutual Fund)
2. **Company / Personal Deductions**:
   - **Cash Advance (CA)**: Loan repayments or salary advances directly subtracted from gross pay.

---

## 2. Employee Deduction Eligibility (`hasDeductions`)

Mandatory government deductions are controlled at the **Employee level** via the `hasDeductions` boolean flag stored in the database (`employees` table).

- **`hasDeductions = true`**: Standard weekly prorated government deductions (SSS, PhilHealth, Pag-IBIG) are automatically calculated and stored in database records for payslips and remittance reports.
- **`hasDeductions = false`**: Government deductions are set to **₱0.00**.
- **Cash Advances (`cash_advance`)**: Applied regardless of the `hasDeductions` setting whenever a cash advance value is present on the payroll record.

---

## 3. Prorated Weekly Schedule for Government Deductions

Because payroll is calculated **weekly**, statutory monthly deductions are prorated based on the **week of the month** in which the payroll week begins (`getWeekOfMonth(weekStart)`).

### Weekly Proration Breakdown

| Week of Month | Calendar Days | SSS Contribution | PhilHealth (PHIC) | Pag-IBIG (HDMF) | Total Mandatory / Week |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Week 1** | Days 1 – 7 | ₱250.00 | ₱100.00 | ₱50.00 | **₱400.00** |
| **Week 2** | Days 8 – 14 | ₱100.00 | ₱100.00 | ₱50.00 | **₱250.00** |
| **Week 3** | Days 15 – 21 | ₱100.00 | ₱50.00 | ₱100.00 | **₱250.00** |
| **Week 4 & 5** | Days 22+ | ₱0.00 | ₱0.00 | ₱0.00 | **₱0.00** |
| **Monthly Total Cap** | — | **₱450.00** | **₱250.00** | **₱200.00** | **₱900.00** |

---

## 4. Calculation Formulas & Logic

The core calculation is handled in [`backend/src/controllers/payroll.controller.ts`](file:///c:/wamp64/www/v2-attendance/backend/src/controllers/payroll.controller.ts).

### Mathematical & Excel Formulas Matrix

For row $r$ (from row 6 to $N$):

| Column | Header Name | Mathematical Formula | Excel Cell Formula | Summary Total Formula |
| :---: | :--- | :--- | :--- | :--- |
| **F** | `BASIC PAY` | $\text{Days Worked} \times \text{Daily Rate}$ | `=C{r}*E{r}` | `=SUM(F6:F{N})` |
| **H** | `OVERTIME (AMT)` | $\text{OT Hours} \times (\frac{\text{Daily Rate}}{8} \times 1.25)$ | `=G{r}*(E{r}/8*1.25)` | `=SUM(H6:H{N})` |
| **I** | `GROSS PAY` | $\text{Basic Pay} + \text{OT Amount}$ | `=F{r}+H{r}` | `=SUM(I6:I{N})` |
| **K** | `GROSS ALLOWANCE` | $\text{Gross Pay} + \text{Performance Allowance}$ | `=I{r}+J{r}` | `=SUM(K6:K{N})` |
| **L** | `CA` | Cash Advance | Numerical Value | `=SUM(L6:L{N})` |
| **M** | `TOTAL` *(Deductions)* | Cash Advance (CA) | `=L{r}` | `=SUM(M6:M{N})` |
| **N** | `TAKE HOME PAY` | $\text{Gross Allowance} - \text{Total Deductions}$ | `=K{r}-M{r}` | `=SUM(N6:N{N})` |

---

## 5. Pros, Cons & Real-Life Scenarios

### Pros & Advantages
1. **Simplified Site Cash Distribution**: On construction job sites, site admins/timekeepers need a clear cash payout sheet for weekly wage distribution showing only Cash Advance (CA) deductions.
2. **Reduced On-Site Worker Confusion**: Prevents worker confusion regarding weekly rate deductions vs. monthly statutory contributions.
3. **Preserved Compliance & Accounting Trail**: Retains SSS, PHIC, and HDMF inside the database for monthly government remittances (SSS R-5, PhilHealth EPRS, Pag-IBIG portal).
4. **Official Payslip Completeness**: Individual employee payslips remain fully compliant with Philippine labor standards.

---

## 6. Excel Export Layout (`EXPORT PAYROLL.xlsx`)

The Excel export matches `EXPORT PAYROLL.xlsx` with **15 Columns (A through O)** and dynamic native Excel formulas `=F6+H6`, `=I6+J6`, `=L6`, `=K6-M6`, and `=SUM(...)`.

---

## 7. Relevant Codebase References

- **Backend Controller**: [`backend/src/controllers/payroll.controller.ts`](file:///c:/wamp64/www/v2-attendance/backend/src/controllers/payroll.controller.ts)
- **Database Schema**: [`backend/prisma/schema.prisma`](file:///c:/wamp64/www/v2-attendance/backend/prisma/schema.prisma) (`Employee.hasDeductions`, `PayrollRecord`)
- **Frontend Payroll Dashboard**: [`frontend/src/app/dashboard/payroll/page.tsx`](file:///c:/wamp64/www/v2-attendance/frontend/src/app/dashboard/payroll/page.tsx)
- **Reference Layout File**: [`EXPORT PAYROLL.xlsx`](file:///c:/wamp64/www/v2-attendance/EXPORT%20PAYROLL.xlsx)
