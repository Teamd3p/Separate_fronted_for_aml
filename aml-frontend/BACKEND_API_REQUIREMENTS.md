# Backend API Requirements for Frontend

This document outlines all the API endpoints needed for the Reports & Analysis page and Dashboard graphs.

---

## 📊 Reports & Analysis Page APIs

### 1. Get Report Statistics
**Endpoint**: `GET /api/admin/reports/stats`

**Query Parameters**:
- `period` (string): One of `7days`, `30days`, `90days`, `6months`, `1year`

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "totalTransactions": 15420,
  "flaggedTransactions": 342,
  "totalAlerts": 156,
  "resolvedAlerts": 98,
  "pendingAlerts": 45,
  "totalSARs": 23,
  "submittedSARs": 18,
  "draftedSARs": 5,
  "highRiskCustomers": 12,
  "averageRiskScore": 65.4
}
```

**Data Source**:
- Count transactions from `transactions` table filtered by date range
- Count flagged transactions where `is_flagged = true` or `alert_id IS NOT NULL`
- Count alerts from `alerts` table by status
- Count SARs from `sars` table by status
- Count customers where `risk_score >= 70`
- Calculate average risk score from `customers` table

---

### 2. Get Alerts by Type
**Endpoint**: `GET /api/admin/reports/alerts-by-type`

**Query Parameters**:
- `period` (string, optional): Date range filter

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "labels": ["High Value", "Suspicious Pattern", "Rapid Movement", "Cross Border", "Structuring", "Other"],
  "values": [45, 30, 25, 18, 12, 26]
}
```

**Data Source**:
- Group alerts by `alert_type` or `rule_type`
- Count occurrences of each type
- Map to friendly labels

**SQL Example**:
```sql
SELECT 
  alert_type,
  COUNT(*) as count
FROM alerts
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY alert_type
ORDER BY count DESC;
```

---

### 3. Get Alerts by Status
**Endpoint**: `GET /api/admin/reports/alerts-by-status`

**Query Parameters**:
- `period` (string, optional): Date range filter

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "labels": ["Pending", "Under Review", "Resolved", "False Positive"],
  "values": [25, 15, 50, 10]
}
```

**Data Source**:
- Group alerts by `status` field
- Count occurrences

**SQL Example**:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM alerts
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY status;
```

---

### 4. Get Trend Data
**Endpoint**: `GET /api/admin/reports/trends`

**Query Parameters**:
- `period` (string): One of `7days`, `30days`, `90days`, `6months`, `1year`

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
[
  {
    "month": "Jan",
    "alerts": 45,
    "sars": 12,
    "transactions": 1250
  },
  {
    "month": "Feb",
    "alerts": 52,
    "sars": 15,
    "transactions": 1380
  },
  {
    "month": "Mar",
    "alerts": 38,
    "sars": 10,
    "transactions": 1420
  }
  // ... more months
]
```

**Data Source**:
- Group data by month
- Count alerts, SARs, and transactions per month
- Return last N months based on period

**SQL Example**:
```sql
SELECT 
  DATE_FORMAT(created_at, '%b') as month,
  COUNT(DISTINCT CASE WHEN type = 'alert' THEN id END) as alerts,
  COUNT(DISTINCT CASE WHEN type = 'sar' THEN id END) as sars,
  COUNT(DISTINCT CASE WHEN type = 'transaction' THEN id END) as transactions
FROM (
  SELECT id, created_at, 'alert' as type FROM alerts
  UNION ALL
  SELECT id, created_at, 'sar' as type FROM sars
  UNION ALL
  SELECT id, created_at, 'transaction' as type FROM transactions
) combined
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY created_at ASC;
```

---

### 5. Get Top Risk Customers
**Endpoint**: `GET /api/admin/reports/top-risk-customers`

**Query Parameters**:
- `limit` (number, optional): Default 10

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
[
  {
    "id": 123,
    "name": "John Doe",
    "riskScore": 85,
    "alertCount": 5,
    "lastActivity": "2025-11-01T10:30:00Z"
  },
  {
    "id": 456,
    "name": "Jane Smith",
    "riskScore": 78,
    "alertCount": 3,
    "lastActivity": "2025-10-31T15:45:00Z"
  }
  // ... more customers
]
```

**Data Source**:
- Select customers with highest risk scores
- Join with alerts to count alert_count
- Get last transaction/activity timestamp
- Order by risk_score DESC
- Limit to top N

**SQL Example**:
```sql
SELECT 
  c.id,
  CONCAT(c.first_name, ' ', c.last_name) as name,
  c.risk_score as riskScore,
  COUNT(DISTINCT a.id) as alertCount,
  MAX(t.created_at) as lastActivity
FROM customers c
LEFT JOIN alerts a ON a.customer_id = c.id
LEFT JOIN transactions t ON t.customer_id = c.id
WHERE c.risk_score >= 60
GROUP BY c.id
ORDER BY c.risk_score DESC
LIMIT 10;
```

---

### 6. Export Report
**Endpoint**: `GET /api/admin/reports/export`

**Query Parameters**:
- `format` (string): `pdf` or `excel`
- `period` (string): Date range filter

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
- Content-Type: `application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Binary file download

**Implementation**:
- Use library like Apache POI (Java) or openpyxl (Python) for Excel
- Use library like iText (Java) or ReportLab (Python) for PDF
- Include all statistics, charts data, and top risk customers
- Format as professional report

---

## 📈 Dashboard Page APIs

### 1. Get Dashboard Statistics
**Endpoint**: `GET /api/admin/dashboard/stats`

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "totalUsers": 1250,
  "totalCustomers": 1100,
  "totalOfficers": 150,
  "totalAlerts": 342,
  "pendingAlerts": 45,
  "totalSARs": 23,
  "activeAccounts": 980,
  "openHelpTickets": 12
}
```

**Data Source**:
- Count from `users` table grouped by role
- Count from `alerts` table grouped by status
- Count from `sars` table
- Count from `accounts` table where status = 'ACTIVE'
- Count from `tickets` table where status = 'OPEN'

---

### 2. Get Alert Trend (for Dashboard Graph)
**Endpoint**: `GET /api/admin/dashboard/alert-trend`

**Query Parameters**:
- `days` (number, optional): Default 30

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "labels": ["Oct 1", "Oct 2", "Oct 3", "Oct 4", "Oct 5", "..."],
  "datasets": [
    {
      "label": "New Alerts",
      "data": [12, 15, 8, 20, 18, "..."],
      "color": "#3b82f6"
    },
    {
      "label": "Resolved Alerts",
      "data": [10, 12, 15, 14, 16, "..."],
      "color": "#10b981"
    }
  ]
}
```

**Data Source**:
- Group alerts by date
- Count new alerts per day
- Count resolved alerts per day
- Return last N days

**SQL Example**:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(CASE WHEN status = 'NEW' OR status = 'PENDING' THEN 1 END) as new_alerts,
  COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_alerts
FROM alerts
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date ASC;
```

---

### 3. Get Transaction Volume (for Dashboard Graph)
**Endpoint**: `GET /api/admin/dashboard/transaction-volume`

**Query Parameters**:
- `days` (number, optional): Default 30

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "labels": ["Oct 1", "Oct 2", "Oct 3", "..."],
  "datasets": [
    {
      "label": "Transaction Count",
      "data": [450, 520, 380, "..."],
      "color": "#3b82f6"
    },
    {
      "label": "Flagged Transactions",
      "data": [12, 18, 8, "..."],
      "color": "#ef4444"
    }
  ]
}
```

**Data Source**:
- Group transactions by date
- Count total transactions per day
- Count flagged transactions per day

---

### 4. Get Risk Distribution (for Dashboard Pie Chart)
**Endpoint**: `GET /api/admin/dashboard/risk-distribution`

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "labels": ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"],
  "values": [450, 320, 180, 50],
  "colors": ["#10b981", "#f59e0b", "#f97316", "#ef4444"]
}
```

**Data Source**:
- Group customers by risk level:
  - Low: risk_score < 40
  - Medium: 40 <= risk_score < 60
  - High: 60 <= risk_score < 80
  - Critical: risk_score >= 80

**SQL Example**:
```sql
SELECT 
  CASE 
    WHEN risk_score < 40 THEN 'Low Risk'
    WHEN risk_score < 60 THEN 'Medium Risk'
    WHEN risk_score < 80 THEN 'High Risk'
    ELSE 'Critical Risk'
  END as risk_level,
  COUNT(*) as count
FROM customers
GROUP BY risk_level
ORDER BY FIELD(risk_level, 'Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk');
```

---

### 5. Get Recent Activities (for Dashboard Feed)
**Endpoint**: `GET /api/admin/dashboard/recent-activities`

**Query Parameters**:
- `limit` (number, optional): Default 10

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "type": "alert",
    "title": "High Value Transaction Alert",
    "description": "Transaction of $50,000 flagged for review",
    "timestamp": "2025-11-01T10:30:00Z",
    "severity": "high",
    "user": "John Doe"
  },
  {
    "id": 2,
    "type": "sar",
    "title": "SAR Submitted",
    "description": "SAR #123 submitted to FinCEN",
    "timestamp": "2025-11-01T09:15:00Z",
    "severity": "info",
    "user": "Jane Smith"
  }
]
```

**Data Source**:
- Union of recent alerts, SARs, and significant transactions
- Order by timestamp DESC
- Limit to N records

---

## 🔧 Implementation Notes

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error Responses
All endpoints should return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Date Ranges
Period parameter mapping:
- `7days` → Last 7 days
- `30days` → Last 30 days
- `90days` → Last 90 days
- `6months` → Last 6 months
- `1year` → Last 12 months

### Performance Optimization
- Add database indexes on:
  - `created_at` columns
  - `status` columns
  - `customer_id` foreign keys
  - `risk_score` column
- Consider caching for dashboard stats (5-minute cache)
- Use database views for complex aggregations

### Spring Boot Example (Java)

```java
@RestController
@RequestMapping("/api/admin/reports")
public class ReportsController {
    
    @GetMapping("/stats")
    public ResponseEntity<ReportStatsDTO> getStats(
        @RequestParam String period,
        @RequestHeader("Authorization") String token
    ) {
        // Validate token
        User user = authService.getUserFromToken(token);
        
        // Calculate date range
        LocalDateTime startDate = calculateStartDate(period);
        
        // Get statistics
        ReportStatsDTO stats = reportsService.getStatistics(startDate);
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/alerts-by-type")
    public ResponseEntity<ChartDataDTO> getAlertsByType(
        @RequestParam(required = false) String period,
        @RequestHeader("Authorization") String token
    ) {
        LocalDateTime startDate = calculateStartDate(period);
        ChartDataDTO data = reportsService.getAlertsByType(startDate);
        return ResponseEntity.ok(data);
    }
    
    // ... more endpoints
}
```

---

## 📋 Summary

### Reports Page Needs:
1. ✅ `/api/admin/reports/stats` - Overall statistics
2. ✅ `/api/admin/reports/alerts-by-type` - Bar chart data
3. ✅ `/api/admin/reports/alerts-by-status` - Donut chart data
4. ✅ `/api/admin/reports/trends` - Line chart data
5. ✅ `/api/admin/reports/top-risk-customers` - Table data
6. ✅ `/api/admin/reports/export` - PDF/Excel export

### Dashboard Page Needs:
1. ✅ `/api/admin/dashboard/stats` - Statistics cards
2. ✅ `/api/admin/dashboard/alert-trend` - Alert trend graph
3. ✅ `/api/admin/dashboard/transaction-volume` - Transaction graph
4. ✅ `/api/admin/dashboard/risk-distribution` - Pie chart
5. ✅ `/api/admin/dashboard/recent-activities` - Activity feed

### Fallback Behavior:
If these endpoints don't exist, the frontend will:
- Use existing `/compliance/alerts` endpoint
- Use existing `/users` endpoint
- Generate approximate data from available sources
- Still display functional UI with estimated values

This ensures the frontend works even if backend is not fully ready!
