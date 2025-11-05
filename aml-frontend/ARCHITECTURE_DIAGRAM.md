# AML Frontend - Architecture Diagram & Visual Guide

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Angular Application (SPA)                  │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │   Admin      │  │  Compliance  │  │   Customer   │ │    │
│  │  │   Module     │  │    Module    │  │    Module    │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────┐    │    │
│  │  │           Core Services Layer                   │    │    │
│  │  │  - AuthService                                  │    │    │
│  │  │  - ComplianceService                            │    │    │
│  │  │  - DashboardService                             │    │    │
│  │  │  - TransactionService                           │    │    │
│  │  └────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────┐    │    │
│  │  │         Guards & Interceptors                   │    │    │
│  │  │  - AuthGuard (Route Protection)                 │    │    │
│  │  │  - RoleGuard (RBAC)                             │    │    │
│  │  │  - AuthInterceptor (Add JWT Token)              │    │    │
│  │  └────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              ↕                                   │
│                         HTTP/HTTPS                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Server                            │
│                  (Spring Boot / Java)                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  /api/auth   │  │ /api/admin   │  │/api/compliance│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ /api/customer│  │ /api/kyc     │  │/api/transactions│       │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                  │
│                    (MySQL / PostgreSQL)                          │
│                                                                  │
│  Tables: users, customers, transactions, alerts, sars,          │
│          rules, keywords, countries, audit_logs                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flow Diagram

```
┌─────────┐                                                    ┌─────────┐
│  User   │                                                    │ Backend │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. Enter email & password                                  │
     │─────────────────────────────────────────────────────────────▶
     │                                                              │
     │                    2. Validate credentials                  │
     │                       Check database                         │
     │                                                              │
     │  3. Return JWT token + user info                            │
     │◀─────────────────────────────────────────────────────────────
     │                                                              │
     │  4. Store in localStorage:                                  │
     │     - token                                                  │
     │     - email                                                  │
     │     - userId                                                 │
     │     - role                                                   │
     │                                                              │
     │  5. Decode JWT to get role                                  │
     │     (ADMIN / COMPLIANCE_OFFICER / CUSTOMER)                 │
     │                                                              │
     │  6. Redirect based on role:                                 │
     │     - ADMIN → /admin/dashboard                              │
     │     - COMPLIANCE_OFFICER → /compliance/dashboard            │
     │     - CUSTOMER → /customer/dashboard                        │
     │                                                              │
     │  7. All subsequent requests include:                        │
     │     Authorization: Bearer <token>                           │
     │─────────────────────────────────────────────────────────────▶
     │                                                              │
     │  8. Backend validates token on each request                 │
     │                                                              │
     │  9. If token expired → 401 Unauthorized                     │
     │◀─────────────────────────────────────────────────────────────
     │                                                              │
     │  10. Frontend logs out & redirects to login                 │
     │                                                              │
```

---

## 🛡️ Route Guard Flow

```
User navigates to /admin/dashboard
         ↓
    AuthGuard.canActivate()
         ↓
    ┌─────────────────┐
    │ Token exists?   │
    └────────┬────────┘
             │
        ┌────┴────┐
        │   NO    │──→ Redirect to /auth/login
        └─────────┘
             │
        ┌────┴────┐
        │   YES   │
        └────┬────┘
             ↓
    ┌─────────────────┐
    │ Token expired?  │
    └────────┬────────┘
             │
        ┌────┴────┐
        │   YES   │──→ Logout & Redirect to /auth/login
        └─────────┘
             │
        ┌────┴────┐
        │   NO    │
        └────┬────┘
             ↓
    RoleGuard.canActivate()
         ↓
    ┌─────────────────┐
    │ Extract role    │
    │ from JWT token  │
    └────────┬────────┘
             ↓
    ┌─────────────────────┐
    │ Role matches        │
    │ required role?      │
    │ (route.data.roles)  │
    └────────┬────────────┘
             │
        ┌────┴────┐
        │   NO    │──→ Redirect to appropriate dashboard
        └─────────┘
             │
        ┌────┴────┐
        │   YES   │
        └────┬────┘
             ↓
    ✅ Allow access to route
```

---

## 📡 HTTP Interceptor Flow

```
Component makes HTTP request
         ↓
    HttpClient.get/post/put/delete()
         ↓
    AuthInterceptor.intercept()
         ↓
    ┌─────────────────────────────┐
    │ Get token from localStorage │
    └──────────┬──────────────────┘
               ↓
    ┌─────────────────────────────┐
    │ Clone request & add header: │
    │ Authorization: Bearer token │
    └──────────┬──────────────────┘
               ↓
    Send request to backend
         ↓
    ┌─────────────────┐
    │ Response OK?    │
    └────────┬────────┘
             │
        ┌────┴────┐
        │   YES   │──→ Return response to component
        └─────────┘
             │
        ┌────┴────┐
        │   NO    │
        └────┬────┘
             ↓
    ┌─────────────────┐
    │ Error status?   │
    └────────┬────────┘
             │
        ┌────┴────┐
        │   401   │──→ Logout & Redirect to login
        └─────────┘
             │
        ┌────┴────┐
        │   403   │──→ Show "Permission Denied"
        └─────────┘
             │
        ┌────┴────┐
        │  Other  │──→ Return error to component
        └─────────┘
```

---

## 🎯 Component Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Component Lifecycle                      │
└──────────────────────────────────────────────────────────────┘

1. Component Created
         ↓
2. constructor() - Inject services
         ↓
3. ngOnInit() - Initialize component
         ↓
4. Call service method
         ↓
   ┌────────────────┐
   │  Service Layer │
   └────────┬───────┘
            ↓
   ┌────────────────┐
   │ HTTP Request   │
   │ via HttpClient │
   └────────┬───────┘
            ↓
   ┌────────────────┐
   │  Interceptor   │
   │  (Add token)   │
   └────────┬───────┘
            ↓
   ┌────────────────┐
   │  Backend API   │
   └────────┬───────┘
            ↓
   ┌────────────────┐
   │   Response     │
   └────────┬───────┘
            ↓
5. Observable.subscribe()
         ↓
   ┌────────────────┐
   │  next: success │──→ Update component properties
   │  error: failed │──→ Show error message
   └────────────────┘
         ↓
6. Template updates automatically
   (Angular Change Detection)
         ↓
7. User sees updated UI
```

---

## 🗂️ Folder Structure Visualization

```
aml-frontend/
│
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                          # Singleton services & guards
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts          # Protects authenticated routes
│   │   │   │   └── role.guard.ts          # Enforces RBAC
│   │   │   │
│   │   │   ├── interceptors/
│   │   │   │   └── cors.interceptor.ts    # Adds JWT to requests
│   │   │   │
│   │   │   ├── models/                    # TypeScript interfaces
│   │   │   │   ├── auth.models.ts
│   │   │   │   ├── dashboard.models.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── services/                  # Business logic
│   │   │       ├── auth.service.ts
│   │   │       ├── compliance.service.ts
│   │   │       ├── dashboard.service.ts
│   │   │       └── ...
│   │   │
│   │   ├── features/                      # Feature modules
│   │   │   │
│   │   │   ├── admin/                     # Admin feature
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/
│   │   │   │   ├── rules/
│   │   │   │   ├── keywords/
│   │   │   │   ├── countries/
│   │   │   │   ├── reports/
│   │   │   │   ├── audit-logs/
│   │   │   │   ├── kyc-review/
│   │   │   │   └── layout/
│   │   │   │
│   │   │   ├── auth/                      # Authentication
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── verify-otp/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   │
│   │   │   ├── compliance/                # Compliance feature
│   │   │   │   ├── dashboard/
│   │   │   │   ├── alerts/
│   │   │   │   ├── sar/
│   │   │   │   ├── transactions/
│   │   │   │   ├── tickets/
│   │   │   │   ├── customer-alert-history/
│   │   │   │   └── layout/
│   │   │   │
│   │   │   └── customer/                  # Customer feature
│   │   │       ├── dashboard/
│   │   │       ├── account/
│   │   │       ├── transactions/
│   │   │       ├── alerts/
│   │   │       ├── kyc/
│   │   │       ├── profile/
│   │   │       └── layout/
│   │   │
│   │   ├── shared/                        # Reusable components
│   │   │   └── components/
│   │   │       ├── toast/
│   │   │       ├── confirmation-dialog/
│   │   │       └── pagination/
│   │   │
│   │   ├── app.ts                         # Root component
│   │   ├── app.config.ts                  # App configuration
│   │   └── app.routes.ts                  # Route definitions
│   │
│   ├── environments/
│   │   ├── environment.ts                 # Dev config
│   │   └── environment.prod.ts            # Prod config
│   │
│   ├── main.ts                            # Bootstrap application
│   ├── index.html                         # HTML entry point
│   └── styles.css                         # Global styles
│
├── angular.json                           # Angular CLI config
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript config
└── README.md                              # Project documentation
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Route Guards
┌──────────────────────────────────────────────────────────────┐
│  AuthGuard: Checks if user is authenticated                  │
│  RoleGuard: Checks if user has required role                 │
└──────────────────────────────────────────────────────────────┘
                          ↓
Layer 2: HTTP Interceptor
┌──────────────────────────────────────────────────────────────┐
│  AuthInterceptor: Adds JWT token to all requests             │
│                   Handles 401/403 errors                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
Layer 3: JWT Token Validation
┌──────────────────────────────────────────────────────────────┐
│  Token expiration check (with 5-min buffer)                  │
│  Token format validation                                      │
│  Role extraction from token payload                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
Layer 4: Backend Validation
┌──────────────────────────────────────────────────────────────┐
│  Backend verifies JWT signature                              │
│  Backend checks user permissions                             │
│  Backend validates request data                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
Layer 5: Angular Built-in Security
┌──────────────────────────────────────────────────────────────┐
│  XSS Protection: Automatic HTML sanitization                 │
│  CSRF Protection: Token-based (if implemented)               │
│  Content Security Policy: Configurable                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow for Key Features

### SAR (Suspicious Activity Report) Generation

```
1. Compliance Officer views alert
         ↓
2. Click "Generate SAR"
         ↓
3. Navigate to /compliance/sar?alertId=123
         ↓
4. Component loads:
   - Alert details
   - Transaction details
   - Customer details
   - Officer information
         ↓
5. Auto-populate SAR form:
   ┌─────────────────────────────────┐
   │ Customer Info (read-only)       │
   │ Transaction Info (read-only)    │
   │ Alert Info (read-only)          │
   │ Officer Info (read-only)        │
   │ Investigation Notes (editable)  │
   │ Declaration (checkbox)          │
   └─────────────────────────────────┘
         ↓
6. Officer fills investigation notes
         ↓
7. Officer checks declaration
         ↓
8. Click "Submit SAR"
         ↓
9. POST /api/compliance/sar
   Body: { alertId, summary, notes }
         ↓
10. Backend creates SAR record
         ↓
11. Status: SUBMITTED
         ↓
12. Show success toast
         ↓
13. Redirect to SAR list
```

### KYC Approval Process

```
Customer Side:
1. Upload documents (ID, Address proof)
         ↓
2. POST /api/customer/kyc/upload
         ↓
3. Status: PENDING
         ↓

Admin Side:
4. Admin views KYC review page
         ↓
5. GET /api/admin/kyc/pending
         ↓
6. Admin reviews documents
         ↓
7. Admin clicks Approve/Reject
         ↓
8. PUT /api/admin/kyc/{id}/approve
   or
   PUT /api/admin/kyc/{id}/reject
         ↓
9. Status: APPROVED or REJECTED
         ↓
10. Customer notified
         ↓
11. Customer sees updated status
```

---

## 🎨 UI Component Hierarchy

```
App (Root)
│
├── RouterOutlet
    │
    ├── Auth Module
    │   ├── Login
    │   ├── Register
    │   ├── VerifyOtp
    │   ├── ForgotPassword
    │   └── ResetPassword
    │
    ├── Admin Module
    │   ├── Layout (Sidebar + Header)
    │   │   └── RouterOutlet
    │   │       ├── Dashboard
    │   │       ├── Users
    │   │       ├── Rules
    │   │       ├── Keywords
    │   │       ├── Countries
    │   │       ├── Reports
    │   │       ├── AuditLogs
    │   │       └── KycReview
    │   │
    │   └── Shared Components
    │       ├── Toast
    │       ├── ConfirmationDialog
    │       └── Pagination
    │
    ├── Compliance Module
    │   ├── Layout (Sidebar + Header)
    │   │   └── RouterOutlet
    │   │       ├── Dashboard
    │   │       ├── Alerts
    │   │       ├── SAR
    │   │       ├── Transactions
    │   │       ├── Tickets
    │   │       └── CustomerAlertHistory
    │   │
    │   └── Shared Components
    │       ├── Toast
    │       └── ConfirmationDialog
    │
    └── Customer Module
        ├── Layout (Sidebar + Header)
        │   └── RouterOutlet
        │       ├── Dashboard
        │       ├── Account
        │       ├── Transactions
        │       ├── Alerts
        │       ├── KYC
        │       └── Profile
        │
        └── Shared Components
            └── Toast
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layers                    │
└─────────────────────────────────────────────────────────────┘

Layer 1: LocalStorage (Persistent)
┌──────────────────────────────────────────────────────────┐
│  - token (JWT)                                           │
│  - email                                                 │
│  - userId                                                │
│  - role                                                  │
│  - firstName, lastName, contactNumber                    │
└──────────────────────────────────────────────────────────┘
                        ↕
Layer 2: Services (BehaviorSubject)
┌──────────────────────────────────────────────────────────┐
│  AuthService.currentUser$ (Observable)                   │
│  ToastService.toasts$ (Observable)                       │
│  ConfirmationDialogService.state$ (Observable)           │
└──────────────────────────────────────────────────────────┘
                        ↕
Layer 3: Components (Subscribe)
┌──────────────────────────────────────────────────────────┐
│  Component properties updated via subscription           │
│  Template automatically re-renders                       │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Build & Deployment Flow

```
Development:
1. npm start
         ↓
2. ng serve
         ↓
3. esbuild compiles TypeScript
         ↓
4. Dev server runs on http://localhost:4200
         ↓
5. Hot Module Replacement (HMR) enabled
         ↓
6. Changes auto-reload in browser

Production:
1. npm run build
         ↓
2. ng build --configuration production
         ↓
3. esbuild optimizations:
   - Tree shaking
   - Minification
   - Bundle splitting
   - Source map generation
         ↓
4. Output to dist/ folder
         ↓
5. Deploy to web server
   (Nginx, Apache, or cloud hosting)
         ↓
6. Configure routing:
   - All routes → index.html (SPA)
```

---

## 📈 Performance Optimization Strategies

```
1. Lazy Loading
   ✅ Load routes only when needed
   ✅ Smaller initial bundle

2. Tree Shaking
   ✅ Remove unused code
   ✅ Smaller bundle size

3. OnPush Change Detection
   ✅ Reduce change detection cycles
   ✅ Better performance

4. TrackBy in *ngFor
   ✅ Efficient list rendering
   ✅ Avoid unnecessary re-renders

5. Async Pipe
   ✅ Auto-unsubscribe
   ✅ Prevent memory leaks

6. Bundle Budgets
   ✅ Monitor bundle size
   ✅ Warn on size increase
```

---

## 🎯 Key Metrics

```
┌─────────────────────────────────────────────────────────┐
│                  Application Metrics                     │
└─────────────────────────────────────────────────────────┘

Code Statistics:
- Total Components: ~40+
- Total Services: ~14
- Total Routes: ~30+
- Lines of Code: ~10,000+

Bundle Size:
- Initial Bundle: < 500 KB (target)
- Maximum Bundle: < 1 MB (limit)

Performance:
- Initial Load: < 3 seconds
- Route Navigation: < 500ms
- API Response: < 2 seconds

Security:
- Authentication: JWT-based
- Authorization: Role-based (3 roles)
- Route Protection: 100% coverage
```

---

**This architecture ensures:**
✅ Scalability
✅ Maintainability
✅ Security
✅ Performance
✅ User Experience
