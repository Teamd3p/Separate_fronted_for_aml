# Dynamic Notification System Documentation

## Overview
The notification system in the admin layout is designed to be **dynamic** and fetch data from the backend API.

## How It Works

### 1. Primary Method: Backend API
**Endpoint**: `GET /admin/notifications`

**Request Headers**:
```
Authorization: Bearer <token>
```

**Expected Response Format**:
```json
[
  {
    "id": 1,
    "title": "New KYC Document",
    "message": "5 new documents pending review",
    "createdAt": "2025-01-01T10:30:00Z",
    "type": "info",
    "read": false,
    "link": "/admin/kyc-review"
  },
  {
    "id": 2,
    "title": "High Risk Alert",
    "message": "Suspicious transaction detected",
    "createdAt": "2025-01-01T09:15:00Z",
    "type": "warning",
    "read": false
  }
]
```

**Fields**:
- `id` (number): Unique notification ID
- `title` (string): Notification title
- `message` (string): Notification message/description
- `createdAt` (string): ISO timestamp
- `type` (string): One of: `'info'`, `'warning'`, `'success'`, `'error'`
- `read` (boolean): Whether notification has been read
- `link` (string, optional): Navigation link when clicked

### 2. Fallback Method: System Data
If the `/admin/notifications` endpoint is not available, the system automatically generates notifications from existing data:

#### Fallback Sources:

**A. KYC Pending Documents**
- **Endpoint**: `GET /admin/kyc/pending`
- **Generates**: "KYC Documents Pending - X documents awaiting review"
- **Type**: `info`
- **Link**: `/admin/kyc-review`

**B. Pending Alerts**
- **Endpoint**: `GET /compliance/alerts`
- **Filters**: Alerts with status `'PENDING'` or `'NEW'`
- **Generates**: "Pending Alerts - X alerts require attention"
- **Type**: `warning`

### 3. Time Formatting
Notifications display relative time:
- "Just now" (< 1 minute)
- "5 minutes ago"
- "2 hours ago"
- "3 days ago"
- Full date (> 7 days)

## Implementation in Code

### Location
**File**: `src/app/features/admin/layout/layout.ts`

### Key Methods

```typescript
// Called on component initialization
loadNotifications(): void {
  // Try primary method
  this.http.get(`${this.apiUrl}/admin/notifications`)
    .subscribe({
      next: (data) => {
        // Use backend notifications
        this.notifications = data.map(n => ({...}));
      },
      error: () => {
        // Use fallback method
        this.generateFallbackNotifications();
      }
    });
}

// Fallback: Generate from system data
private generateFallbackNotifications(headers: HttpHeaders): void {
  // Fetch KYC pending count
  this.http.get(`${this.apiUrl}/admin/kyc/pending`)
    .subscribe({
      next: (docs) => {
        if (docs.length > 0) {
          this.notifications.push({
            id: Date.now(),
            title: 'KYC Documents Pending',
            message: `${docs.length} documents awaiting review`,
            time: 'Just now',
            type: 'info',
            read: false,
            link: '/admin/kyc-review'
          });
        }
      }
    });

  // Fetch pending alerts count
  this.http.get(`${this.apiUrl}/compliance/alerts`)
    .subscribe({
      next: (alerts) => {
        const pending = alerts.filter(a => 
          a.status === 'PENDING' || a.status === 'NEW'
        );
        if (pending.length > 0) {
          this.notifications.push({
            id: Date.now() + 1,
            title: 'Pending Alerts',
            message: `${pending.length} alerts require attention`,
            time: 'Recent',
            type: 'warning',
            read: false
          });
        }
      }
    });
}

// Format timestamp to relative time
private formatNotificationTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMins = Math.floor((now - time) / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  // ... more formatting
}
```

## Backend Implementation Guide

### Create Notification Endpoint

**Spring Boot Example**:
```java
@RestController
@RequestMapping("/api/admin")
public class NotificationController {
    
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO>> getNotifications(
        @RequestHeader("Authorization") String token
    ) {
        // Get user from token
        User user = authService.getUserFromToken(token);
        
        // Fetch notifications for user
        List<Notification> notifications = notificationService
            .getNotificationsByUserId(user.getId());
        
        return ResponseEntity.ok(
            notifications.stream()
                .map(this::toDTO)
                .collect(Collectors.toList())
        );
    }
    
    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markAsRead(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token
    ) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
```

### Database Schema Example
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Features

### Current Features
✅ Dynamic loading from backend API
✅ Automatic fallback to system data
✅ Unread badge count
✅ Click to navigate
✅ Mark all as read
✅ Relative time display
✅ Color-coded by type

### Future Enhancements
- Real-time updates via WebSocket
- Mark individual notifications as read
- Delete notifications
- Notification preferences
- Push notifications

## Testing

### Test Without Backend
The system will automatically use fallback mode and generate notifications from:
- KYC pending documents
- Pending alerts

### Test With Backend
1. Create the `/admin/notifications` endpoint
2. Return sample data in the expected format
3. Notifications will display from backend

## Summary

**Static Data**: ❌ Removed
**Dynamic Data**: ✅ Implemented

The notification system is **fully dynamic** and will:
1. Try to fetch from `/admin/notifications` endpoint first
2. Fall back to generating from KYC/Alert data if endpoint doesn't exist
3. Display real-time counts and updates
4. Work seamlessly whether backend endpoint exists or not
