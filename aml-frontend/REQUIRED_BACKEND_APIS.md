# Required Backend APIs for AML Dashboard

## Base URL: `http://localhost:8080/api`

## 1. Authentication APIs (Already Implemented?)
```
POST /auth/login
POST /auth/register  
POST /auth/verify-otp
POST /auth/resend-otp
```

## 2. Dashboard Statistics API
```
GET /customer/dashboard/stats
```
**Response:**
```json
{
  "totalTransactions": 12,
  "lastLogin": "2025-10-27T10:30:00Z",
  "newAlerts": 2,
  "pendingTransactions": 1
}
```

**Note:** This API should return data specific to the logged-in customer based on JWT token. The backend should extract customer ID from the JWT token and return their specific statistics.

## 3. Customer Profile API
```
GET /customer/profile
PUT /customer/profile
```
**GET Response:**
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

## 4. Transactions APIs
```
GET /customer/transactions/recent?limit=5
GET /customer/transactions?page=0&size=20
GET /customer/transactions/{id}
```
**Recent Transactions Response:**
```json
[
  {
    "id": 1,
    "description": "Salary Credit",
    "type": "CREDIT",
    "date": "2025-10-27",
    "amount": 50000.00,
    "status": "COMPLETED",
    "fromAccount": "COMPANY_PAYROLL",
    "toAccount": "USER_ACCOUNT"
  },
  {
    "id": 2,
    "description": "Online Purchase",
    "type": "DEBIT", 
    "date": "2025-10-27",
    "amount": 2500.00,
    "status": "COMPLETED",
    "fromAccount": "USER_ACCOUNT",
    "toAccount": "MERCHANT_ACCOUNT"
  }
]
```

## 5. Alerts APIs
```
GET /customer/alerts/recent?limit=5
GET /customer/alerts?page=0&size=20
GET /customer/alerts/{id}
```
**Recent Alerts Response:**
```json
[
  {
    "id": 1,
    "description": "Large Transaction Alert - Investment Transfer",
    "date": "2025-10-24",
    "riskScore": 45,
    "status": "OPEN",
    "transactionId": 123
  },
  {
    "id": 2,
    "description": "Multiple ATM Withdrawals in Different Locations",
    "date": "2025-10-23",
    "riskScore": 35,
    "status": "RESOLVED",
    "transactionId": 124
  }
]
```

## 6. Customer Accounts API
```
GET /customer/accounts
GET /customer/accounts/{id}
```
**Accounts Response:**
```json
[
  {
    "id": 1,
    "accountNumber": "1234567890",
    "accountType": "SAVINGS",
    "balance": 150000.00,
    "currency": "INR",
    "status": "ACTIVE",
    "openDate": "2023-01-15"
  }
]
```

## 7. KYC APIs
```
POST /customer/kyc/upload
GET /customer/kyc/documents
```
**Upload Request:** Multipart form with file and documentType
**Documents Response:**
```json
[
  {
    "id": 1,
    "documentType": "AADHAAR",
    "fileName": "aadhaar.pdf",
    "uploadDate": "2025-10-20",
    "status": "VERIFIED"
  }
]
```

## Authentication Headers
All customer APIs require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## JWT Token Usage
- The backend should extract customer information from the JWT token
- All customer-specific data should be filtered based on the customer ID from the token
- No customer ID should be passed in the request body/params - use JWT token only
- This ensures data security and prevents unauthorized access to other customers' data

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-10-27T10:30:00Z"
}
```

## Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
