# AML Frontend - Code Review Preparation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Core Concepts](#core-concepts)
4. [Key Features](#key-features)
5. [Technical Stack](#technical-stack)
6. [Security Implementation](#security-implementation)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Component Structure](#component-structure)
10. [Common Interview Questions](#common-interview-questions)

---

## 🎯 Project Overview

### What is this application?
**AML (Anti-Money Laundering) Frontend** - A comprehensive compliance management system for financial institutions to:
- Monitor suspicious transactions
- Manage customer KYC (Know Your Customer) verification
- Generate Suspicious Activity Reports (SARs)
- Track compliance alerts and investigations
- Manage risk assessments

### Application Type
- **Framework**: Angular 20.3.0 (Latest standalone components architecture)
- **Architecture**: Single Page Application (SPA)
- **Build Tool**: Angular CLI with esbuild
- **Language**: TypeScript 5.9.2

### Backend Integration
- **API Base URL**: `http://localhost:8080/api`
- **Authentication**: JWT (JSON Web Token) based
- **Communication**: RESTful HTTP APIs

---

## 🏗️ Architecture & Design Patterns

### 1. **Standalone Components Architecture**
Angular 20+ uses standalone components (no NgModules):

```typescript
@Component({
  selector: 'app-root',
  standalone: true,  // ✅ No module declaration needed
  imports: [RouterOutlet],  // Direct imports
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { }
```

**Why this matters:**
- Simpler, more modular code
- Better tree-shaking (smaller bundle size)
- Easier lazy loading
- Modern Angular best practice

### 2. **Feature-Based Folder Structure**

```
src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── guards/             # Route protection (AuthGuard, RoleGuard)
│   ├── interceptors/       # HTTP interceptors (AuthInterceptor)
│   ├── models/             # TypeScript interfaces
│   └── services/           # Business logic services
├── features/               # Feature modules
│   ├── admin/             # Admin dashboard, users, rules, reports
│   ├── auth/              # Login, register, OTP verification
│   ├── compliance/        # Alerts, SARs, tickets, investigations
│   └── customer/          # Customer dashboard, KYC, transactions
└── shared/                # Reusable components
    └── components/        # Toast, confirmation dialogs, pagination
```

**Design Pattern**: Feature-based modular architecture
- Each feature is self-contained
- Promotes code reusability
- Easy to maintain and scale

### 3. **Lazy Loading Strategy**

```typescript
// app.routes.ts
{
  path: 'admin',
  loadComponent: () => import('./features/admin/dashboard/dashboard')
    .then(m => m.Dashboard)  // ✅ Loaded only when needed
}
```

**Benefits:**
- Faster initial load time
- Reduced bundle size
- Better performance

### 4. **Dependency Injection Pattern**

```typescript
@Injectable({ providedIn: 'root' })  // ✅ Singleton service
export class AuthService {
  constructor(private http: HttpClient) {}  // DI
}
```

**Key Points:**
- Services are injected, not instantiated
- `providedIn: 'root'` creates singleton
- Promotes testability and loose coupling

---

## 🔑 Core Concepts

### 1. **Authentication Flow**

#### Login Process:
```
User enters credentials
    ↓
POST /api/auth/login
    ↓
Backend validates & returns JWT token
    ↓
Token stored in localStorage
    ↓
Token added to all subsequent requests via AuthInterceptor
    ↓
User redirected based on role (Admin/Compliance/Customer)
```

#### JWT Token Structure:
```typescript
// Token payload contains:
{
  userId: number,
  email: string,
  role: string,  // ADMIN, COMPLIANCE_OFFICER, CUSTOMER
  exp: number    // Expiration timestamp
}
```

#### Token Validation:
```typescript
// AuthGuard checks:
1. Token exists in localStorage
2. Token is not expired (with 5-minute buffer)
3. Token is valid JWT format
```

### 2. **Role-Based Access Control (RBAC)**

Three user roles with different permissions:

#### **ADMIN** (`/admin/*`)
- Manage users (customers, officers)
- Configure rules and keywords
- View audit logs
- Generate reports
- Manage countries and risk settings

#### **COMPLIANCE_OFFICER** (`/compliance/*`)
- Investigate alerts
- Generate SARs
- Review transactions
- Manage tickets
- View customer alert history

#### **CUSTOMER** (`/customer/*`)
- View own dashboard
- Manage accounts
- View transactions
- Check alerts
- Complete KYC

#### Implementation:
```typescript
// RoleGuard.ts
canActivate(route: ActivatedRouteSnapshot): boolean {
  const userRole = this.authService.getUserRoleFromToken();
  const requiredRoles = route.data['roles'] as string[];
  
  // Normalize and compare roles
  return requiredRoles.some(role => 
    userRole.toUpperCase().includes(role.toUpperCase())
  );
}
```

### 3. **HTTP Interceptor Pattern**

#### AuthInterceptor automatically:
```typescript
1. Adds Authorization header to all requests
   Authorization: Bearer <token>

2. Handles 401 Unauthorized errors
   → Logs out user
   → Redirects to login

3. Handles 403 Forbidden errors
   → Shows permission denied message
```

**Why this is important:**
- Centralized authentication logic
- No need to add headers manually in every service
- Consistent error handling across the app

### 4. **Reactive Programming with RxJS**

```typescript
// Observable pattern
login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
    .pipe(
      tap(response => {
        // Side effect: Store token
        localStorage.setItem('token', response.token);
      })
    );
}

// Component subscribes
this.authService.login(credentials).subscribe({
  next: (response) => { /* Success */ },
  error: (error) => { /* Error handling */ }
});
```

**Key RxJS Operators Used:**
- `tap()` - Side effects without modifying stream
- `map()` - Transform data
- `catchError()` - Error handling
- `BehaviorSubject` - State management

---

## 🚀 Key Features

### 1. **Authentication System**

#### Components:
- **Login** (`/auth/login`)
  - Email + Password authentication
  - JWT token generation
  - Role-based redirection

- **Register** (`/auth/register`)
  - Customer registration
  - OTP verification required
  - Collects KYC information

- **OTP Verification** (`/auth/verify-otp`)
  - 6-digit OTP input
  - Resend OTP functionality
  - Auto-navigation after verification

- **Forgot/Reset Password** (`/auth/forgot-password`, `/auth/reset-password`)
  - Email-based password recovery
  - OTP verification
  - New password setup

### 2. **Admin Dashboard** (`/admin`)

#### Features:
- **Dashboard** - Statistics, charts, recent activities
- **Users Management** - CRUD operations for customers and officers
- **Rules Engine** - Configure AML detection rules
- **Keywords** - Manage flagged keywords
- **Countries** - Risk-based country management
- **Reports** - Comprehensive analytics and exports
- **Audit Logs** - System activity tracking
- **KYC Review** - Approve/reject customer KYC documents

#### Key Components:

**Rules Component:**
```typescript
// Rule types supported:
- TRANSACTION_AMOUNT: Threshold-based detection
- TRANSACTION_FREQUENCY: Pattern detection
- HIGH_RISK_COUNTRY: Geographic risk
- KEYWORD_MATCH: Text analysis
- VELOCITY_CHECK: Speed of transactions
```

**Reports Component:**
- 4 Statistics cards (Transactions, Alerts, SARs, Risk Customers)
- 3 Interactive charts (Alerts by Type, Status, Trends)
- Top Risk Customers table
- Export to PDF/Excel functionality

### 3. **Compliance Dashboard** (`/compliance`)

#### Features:
- **Alerts Management** - Investigate suspicious activities
- **SAR Generation** - Create Suspicious Activity Reports
- **Transactions Review** - Monitor flagged transactions
- **Tickets System** - Customer support and queries
- **Customer Alert History** - Historical view per customer

#### SAR (Suspicious Activity Report) Workflow:
```
1. Alert triggered by rule engine
2. Compliance officer investigates
3. Officer fills investigation notes
4. System auto-populates:
   - Customer details
   - Transaction details
   - Risk scores
   - Officer information
5. Officer reviews and submits
6. SAR sent to regulatory authority
7. Status tracked (DRAFT, SUBMITTED, UNDER_REVIEW)
```

**SAR Component Features:**
- Auto-population from backend
- Investigation notes (editable)
- Declaration checkbox
- PDF export functionality
- Status tracking

### 4. **Customer Dashboard** (`/customer`)

#### Features:
- **Dashboard** - Account overview, recent transactions
- **Accounts** - View linked accounts
- **Transactions** - Transaction history with filters
- **Alerts** - View alerts related to their account
- **KYC** - Upload documents, check status
- **Profile** - Update personal information

#### KYC Process:
```
1. Customer uploads documents (ID, Address proof)
2. Status: PENDING
3. Admin/Compliance reviews
4. Status: APPROVED or REJECTED
5. Customer notified
```

### 5. **Notification System**

#### Two approaches:
1. **Primary**: Fetch from backend API
   ```typescript
   GET /api/admin/notifications
   ```

2. **Fallback**: Generate from system data
   - KYC pending count
   - Pending alerts count

#### Features:
- Real-time badge count
- Relative time ("5 minutes ago")
- Click to navigate
- Mark all as read

### 6. **Toast Notification System**

#### Types:
- **Success** (Green) - Operation completed
- **Error** (Red) - Operation failed
- **Warning** (Yellow) - Caution required
- **Info** (Blue) - Informational

#### Features:
- Auto-dismiss after 3 seconds
- Manual close button
- Stacks multiple toasts
- Smooth animations
- Non-intrusive

```typescript
// Usage
this.toastService.success('User created successfully!');
this.toastService.error('Failed to delete rule');
```

### 7. **Confirmation Dialog System**

#### Types:
- **Danger** (Red) - Destructive actions (delete)
- **Warning** (Yellow) - Caution actions (deactivate)
- **Info** (Blue) - Informational confirmations

```typescript
// Usage
this.confirmationService.confirm({
  title: 'Delete Rule',
  message: 'Are you sure? This cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  type: 'danger'
}).subscribe(confirmed => {
  if (confirmed) {
    this.deleteRule();
  }
});
```

---

## 🛠️ Technical Stack

### Core Dependencies

```json
{
  "@angular/core": "^20.3.0",           // Latest Angular
  "@angular/router": "^20.3.0",         // Routing
  "@angular/forms": "^20.3.0",          // Forms (Template & Reactive)
  "rxjs": "~7.8.0",                     // Reactive programming
  "bootstrap": "^5.3.8",                // UI framework
  "lucide-angular": "^0.546.0",         // Modern icons
  "jspdf": "^2.5.2",                    // PDF generation
  "jspdf-autotable": "^3.8.4",          // PDF tables
  "typescript": "~5.9.2"                // TypeScript
}
```

### Build Configuration

```json
// angular.json
{
  "builder": "@angular/build:application",  // New esbuild-based builder
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kB",
      "maximumError": "1MB"
    }
  ]
}
```

**Key Points:**
- Uses esbuild (faster than webpack)
- Bundle size monitoring
- Tree-shaking enabled
- Source maps in development

---

## 🔒 Security Implementation

### 1. **JWT Token Management**

```typescript
// Storage
localStorage.setItem('token', token);

// Retrieval
const token = localStorage.getItem('token');

// Validation
private isTokenExpired(token: string): boolean {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 5 * 60; // 5 minutes buffer
  return (payload.exp - bufferTime) < currentTime;
}
```

**Security Measures:**
- Token expiration check with buffer
- Automatic logout on expiration
- Token included in all authenticated requests
- Secure HTTP-only (should be implemented on backend)

### 2. **Route Guards**

#### AuthGuard:
```typescript
// Protects routes from unauthenticated users
canActivate(): boolean {
  if (!token || isExpired(token)) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
}
```

#### RoleGuard:
```typescript
// Protects routes based on user role
canActivate(route): boolean {
  const userRole = getUserRoleFromToken();
  const requiredRoles = route.data['roles'];
  
  if (!hasRequiredRole(userRole, requiredRoles)) {
    redirectBasedOnRole(userRole);
    return false;
  }
  return true;
}
```

### 3. **XSS Protection**

Angular provides built-in XSS protection:
- Automatic sanitization of user input
- Safe HTML rendering
- Content Security Policy support

### 4. **CORS Handling**

```typescript
// AuthInterceptor adds headers
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const authRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  return next.handle(authRequest);
}
```

---

## 📊 State Management

### 1. **LocalStorage for Persistence**

```typescript
// Stored items:
- token: JWT authentication token
- email: User email
- userId: User ID
- customerId: Customer ID (for customers)
- role: User role
- firstName, lastName, contactNumber: User info
```

### 2. **BehaviorSubject for Reactive State**

```typescript
// AuthService
private currentUserSubject = new BehaviorSubject<any>(null);
public currentUser$ = this.currentUserSubject.asObservable();

// Components can subscribe
this.authService.currentUser$.subscribe(user => {
  // React to user changes
});
```

### 3. **Service-Based State**

Each feature has its own service:
- `AuthService` - Authentication state
- `ComplianceService` - Compliance data
- `DashboardService` - Dashboard statistics
- `ToastService` - Toast notifications state
- `ConfirmationDialogService` - Dialog state

---

## 🌐 API Integration

### API Structure

```
Base URL: http://localhost:8080/api

/auth/*                  - Authentication endpoints
/admin/*                 - Admin operations
/compliance/*            - Compliance operations
/customer/*              - Customer operations
```

### Common API Patterns

#### 1. **GET Requests**
```typescript
getAllAlerts(): Observable<Alert[]> {
  return this.http.get<Alert[]>(`${this.apiUrl}/alerts`, {
    headers: this.getHeaders()
  });
}
```

#### 2. **POST Requests**
```typescript
createRule(rule: Rule): Observable<Rule> {
  return this.http.post<Rule>(`${this.apiUrl}/rules`, rule, {
    headers: this.getHeaders()
  });
}
```

#### 3. **PUT Requests**
```typescript
updateRule(id: number, rule: Rule): Observable<Rule> {
  return this.http.put<Rule>(`${this.apiUrl}/rules/${id}`, rule, {
    headers: this.getHeaders()
  });
}
```

#### 4. **DELETE Requests**
```typescript
deleteRule(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/rules/${id}`, {
    headers: this.getHeaders()
  });
}
```

### Error Handling

```typescript
// Centralized in AuthInterceptor
catchError((error: HttpErrorResponse) => {
  if (error.status === 401) {
    // Unauthorized - logout and redirect
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  } else if (error.status === 403) {
    // Forbidden - show permission error
    alert('You do not have permission');
  }
  return throwError(() => error);
})
```

---

## 🧩 Component Structure

### Typical Component Anatomy

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, FormsModule],  // Required imports
  templateUrl: './example.html',
  styleUrl: './example.css'
})
export class ExampleComponent implements OnInit {
  // Properties
  data: any[] = [];
  loading = false;
  
  // Dependency Injection
  constructor(private service: ExampleService) {}
  
  // Lifecycle hook
  ngOnInit(): void {
    this.loadData();
  }
  
  // Methods
  loadData(): void {
    this.loading = true;
    this.service.getData().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
      }
    });
  }
}
```

### Component Communication

#### 1. **Parent to Child** - @Input()
```typescript
// Child component
@Input() data: any;

// Parent template
<app-child [data]="parentData"></app-child>
```

#### 2. **Child to Parent** - @Output()
```typescript
// Child component
@Output() dataChange = new EventEmitter<any>();

// Parent template
<app-child (dataChange)="handleChange($event)"></app-child>
```

#### 3. **Service-Based** - Shared service
```typescript
// Service
private dataSubject = new BehaviorSubject<any>(null);
public data$ = this.dataSubject.asObservable();

// Component A
this.service.dataSubject.next(newData);

// Component B
this.service.data$.subscribe(data => { /* React */ });
```

---

## 💡 Common Interview Questions

### 1. **What is the difference between standalone components and NgModules?**

**Answer:**
- **NgModules (Old)**: Required declarations, imports, exports arrays. More boilerplate.
- **Standalone (New)**: Components declare their own dependencies. Simpler, more modular.

```typescript
// Old way (NgModule)
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, RouterModule],
  bootstrap: [AppComponent]
})

// New way (Standalone)
@Component({
  standalone: true,
  imports: [RouterOutlet]
})
```

### 2. **How does authentication work in your application?**

**Answer:**
1. User logs in with credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. AuthInterceptor adds token to all requests
5. AuthGuard protects routes
6. RoleGuard enforces role-based access
7. Token validated on each route change
8. Auto-logout on token expiration

### 3. **Explain the role of HTTP Interceptors**

**Answer:**
Interceptors intercept HTTP requests/responses globally:
- Add authentication headers automatically
- Handle errors centrally (401, 403)
- Log requests for debugging
- Transform requests/responses
- Implement retry logic

### 4. **What is lazy loading and why is it important?**

**Answer:**
Lazy loading loads modules/components only when needed:
- **Benefits**: Faster initial load, smaller bundle, better performance
- **Implementation**: `loadComponent: () => import('./path')`
- **Use case**: Large applications with multiple features

### 5. **How do you handle state management?**

**Answer:**
Multiple approaches:
1. **LocalStorage**: Persistent data (token, user info)
2. **BehaviorSubject**: Reactive state in services
3. **Service-based**: Each feature has its own service
4. **No NgRx**: Simple app doesn't need complex state management

### 6. **What are Signals in Angular?**

**Answer:**
Signals are Angular's new reactivity primitive (Angular 16+):
```typescript
protected readonly title = signal('aml-frontend');
```
- Fine-grained reactivity
- Better performance than Zone.js
- Simpler than RxJS for simple state

### 7. **How do you handle forms?**

**Answer:**
Two approaches:
1. **Template-driven**: FormsModule, ngModel
2. **Reactive**: ReactiveFormsModule, FormBuilder

This app uses Template-driven for simplicity:
```typescript
<input [(ngModel)]="user.email" name="email">
```

### 8. **Explain the component lifecycle**

**Answer:**
Key lifecycle hooks:
- `ngOnInit()`: Initialize component, load data
- `ngOnDestroy()`: Cleanup, unsubscribe
- `ngOnChanges()`: React to input changes
- `ngAfterViewInit()`: After view initialization

### 9. **How do you prevent memory leaks?**

**Answer:**
1. Unsubscribe from Observables in `ngOnDestroy()`
2. Use `async` pipe in templates (auto-unsubscribe)
3. Use `takeUntil()` operator
4. Avoid global event listeners without cleanup

### 10. **What is the purpose of environment files?**

**Answer:**
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```
- Different configs for dev/prod
- API URLs, feature flags
- Build-time configuration

---

## 🎓 Key Takeaways for Review

### Architecture Highlights:
✅ Modern Angular 20 with standalone components
✅ Feature-based modular structure
✅ Lazy loading for performance
✅ JWT-based authentication
✅ Role-based access control
✅ HTTP interceptor for centralized auth
✅ Reactive programming with RxJS

### Security Features:
✅ Token expiration validation
✅ Route guards (Auth + Role)
✅ Automatic logout on 401
✅ XSS protection (Angular built-in)
✅ CORS handling

### User Experience:
✅ Toast notifications (no more alerts!)
✅ Confirmation dialogs for destructive actions
✅ Loading states
✅ Error handling
✅ Responsive design

### Code Quality:
✅ TypeScript for type safety
✅ Service-based architecture
✅ Reusable components
✅ Consistent naming conventions
✅ Comprehensive documentation

---

## 📚 Additional Resources

### Official Documentation:
- [Angular Docs](https://angular.dev)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Documentation:
- `IMPLEMENTATION_SUMMARY.md` - Feature implementation details
- `BACKEND_API_REQUIREMENTS.md` - API specifications
- `NOTIFICATION_SYSTEM.md` - Notification system guide

---

## 🎯 Review Checklist

Before your review, ensure you understand:

- [ ] Project structure and folder organization
- [ ] Authentication flow (login to dashboard)
- [ ] Role-based access control mechanism
- [ ] HTTP interceptor purpose and implementation
- [ ] Route guards (AuthGuard, RoleGuard)
- [ ] Service architecture and dependency injection
- [ ] Component lifecycle and data flow
- [ ] API integration patterns
- [ ] State management approach
- [ ] Security measures implemented
- [ ] Key features (SAR, Alerts, KYC, Reports)
- [ ] Toast and confirmation dialog systems
- [ ] Lazy loading strategy
- [ ] Error handling approach

---

**Good luck with your code review! 🚀**

Remember: Focus on understanding the **why** behind each decision, not just the **what**.
