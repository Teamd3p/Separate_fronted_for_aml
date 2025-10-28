# API Testing Guide for Dashboard Issues

## 🔍 Current Issue
- Dashboard showing "Deep.ratanpara" instead of "Deep Ratanpara"
- Dashboard data not loading properly

## 🧪 Step-by-Step Testing

### 1. Test JWT Token
First, verify your JWT token is valid:
```bash
# Check if token exists in localStorage
console.log(localStorage.getItem('token'))
```

### 2. Test Each API Individually in Postman

#### A. Test Customer Profile API
```
GET http://localhost:8080/api/customer/profile
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

**Expected Response:**
```json
{
  "firstName": "Deep",
  "lastName": "Ratanpara", 
  "email": "deep.ratanpara@domain.com",
  "phoneNumber": "9876543210",
  "address": {
    "line1": "123 Street",
    "city": "Surat",
    "state": "Gujarat", 
    "postalCode": "395007"
  },
  "lastLogin": "2025-10-25T10:30:00Z"
}
```

#### B. Test Dashboard Stats API
```
GET http://localhost:8080/api/customer/dashboard/stats
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

**Expected Response:**
```json
{
  "totalTransactions": 12,
  "lastLogin": "2025-10-27T10:30:00Z",
  "newAlerts": 2,
  "pendingTransactions": 1
}
```

#### C. Test Recent Transactions API
```
GET http://localhost:8080/api/customer/transactions/recent?limit=5
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "description": "Salary Credit",
    "type": "CREDIT",
    "date": "2025-10-27",
    "amount": 50000.00,
    "status": "COMPLETED"
  }
]
```

#### D. Test Recent Alerts API
```
GET http://localhost:8080/api/customer/alerts/recent?limit=5
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "description": "Large Transaction Alert",
    "date": "2025-10-24",
    "riskScore": 45,
    "status": "OPEN"
  }
]
```

## 🔧 Frontend Debugging

### 1. Open Browser Console
1. Open dashboard in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for these logs:

```
🚀 Loading dashboard data...
🔑 JWT Token: [your-token]
📊 Dashboard Stats: [API response]
💳 Recent Transactions: [API response]
🚨 Recent Alerts: [API response] 
👤 Customer Profile: [API response]
🏷️ Display Name: [calculated name]
```

### 2. Test Manual Refresh
1. Click the "Refresh" button in dashboard
2. Check console for individual API test results:
```
✅ Dashboard Stats: [response]
✅ Recent Transactions: [response]
✅ Recent Alerts: [response]
✅ Customer Profile: [response]
```

## 🚨 Common Issues & Solutions

### Issue 1: Name showing as "Deep.ratanpara"
**Cause:** Customer Profile API not returning firstName/lastName
**Solution:** Ensure `/customer/profile` returns proper firstName and lastName fields

### Issue 2: Dashboard stats showing 0
**Cause:** Dashboard Stats API not returning data
**Solution:** Ensure `/customer/dashboard/stats` returns proper numeric values

### Issue 3: Empty transactions/alerts tables
**Cause:** Recent data APIs returning empty arrays
**Solution:** Ensure APIs return actual customer data, not empty responses

### Issue 4: "Unable to load dashboard data" error
**Cause:** APIs returning 401/403/500 errors
**Solution:** Check JWT token validity and backend API implementation

## ✅ Success Criteria

After fixing APIs, you should see:
1. **Dashboard Header:** "Welcome, Deep Ratanpara!" 
2. **Stats Cards:** Real numbers (not 0s)
3. **Transactions Table:** Recent transactions listed
4. **Alerts Table:** Recent alerts listed  
5. **Account Info:** Full profile details displayed
6. **Console:** All green checkmarks (✅) for API calls

## 🔍 Backend Checklist

Ensure your backend:
- [ ] Extracts customer ID from JWT token
- [ ] Returns customer-specific data only
- [ ] Uses exact JSON field names as specified
- [ ] Handles CORS properly
- [ ] Returns proper HTTP status codes
- [ ] Includes proper error messages

## 📞 Next Steps

1. Test each API in Postman first
2. Fix any failing APIs in backend
3. Test dashboard in browser
4. Check console logs for debugging info
5. Use "Refresh" button to test individual APIs
