# Debug Guide: Officer Name Not Showing

## Issue
The compliance officer's full name is not displaying in the top-right corner.

## Debugging Steps

### 1. Check Browser Console (F12)
Open the browser console and look for these logs:
```
Officer profile loaded: { firstName: "...", lastName: "..." }
```

### 2. Check LocalStorage (F12 → Application → Local Storage)
Look for these keys:
- `firstName` - Should contain the officer's first name
- `lastName` - Should contain the officer's last name
- `email` - Should contain the officer's email
- `token` - Should contain the JWT token

### 3. Check Login Response
When you log in, check the Network tab (F12 → Network):
- Look for the `/api/auth/login` request
- Check the response body
- Verify it contains:
  ```json
  {
    "success": true,
    "token": "...",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  }
  ```

### 4. Check Officer Profile API
After login, check for `/api/compliance/profile` request:
- Should return:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
  ```

## Common Issues & Solutions

### Issue 1: Backend Not Returning User Info in Login Response
**Symptom**: LocalStorage has no firstName/lastName after login

**Solution**: Update backend login endpoint to include user info:
```java
// Backend (Spring Boot example)
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // ... authentication logic ...
    
    User user = userRepository.findByEmail(request.getEmail());
    
    return ResponseEntity.ok(new AuthResponse(
        true,
        "Login successful",
        jwtToken,
        user.getEmail(),
        user.getRole(),
        new UserInfo(
            user.getId(),
            user.getFirstName(),  // ← Make sure this is included
            user.getLastName(),   // ← Make sure this is included
            user.getEmail()
        )
    ));
}
```

### Issue 2: Officer Profile API Not Working
**Symptom**: Console shows "Could not load officer profile from API"

**Solution**: Check backend endpoint `/api/compliance/profile`:
```java
@GetMapping("/profile")
public ResponseEntity<OfficerProfile> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
    String email = userDetails.getUsername();
    Officer officer = officerRepository.findByEmail(email);
    
    return ResponseEntity.ok(new OfficerProfile(
        officer.getId(),
        officer.getFirstName(),
        officer.getLastName(),
        officer.getEmail()
    ));
}
```

### Issue 3: LocalStorage Values Are Null
**Symptom**: firstName and lastName are null in localStorage

**Quick Fix**: Manually set them in browser console:
```javascript
localStorage.setItem('firstName', 'John');
localStorage.setItem('lastName', 'Doe');
```
Then refresh the page.

### Issue 4: Default Values Showing
**Symptom**: Shows "Compliance Officer" instead of real name

**Check**:
1. Open browser console (F12)
2. Type: `localStorage.getItem('firstName')`
3. Type: `localStorage.getItem('lastName')`
4. If both return null, the backend is not sending the data

## Testing the Fix

### Test 1: Check Current Values
Open browser console and run:
```javascript
console.log('First Name:', localStorage.getItem('firstName'));
console.log('Last Name:', localStorage.getItem('lastName'));
console.log('Email:', localStorage.getItem('email'));
```

### Test 2: Manually Set Values (Temporary)
```javascript
localStorage.setItem('firstName', 'John');
localStorage.setItem('lastName', 'Smith');
location.reload(); // Refresh page
```

### Test 3: Check Component
In browser console:
```javascript
// This will show the current officer object
// (Only works if you have Angular DevTools)
ng.getComponent(document.querySelector('app-compliance-layout')).currentOfficer
```

## Expected Behavior

1. **On Login**: 
   - Backend returns user info with firstName and lastName
   - Frontend stores them in localStorage
   - Frontend displays full name

2. **On Page Load**:
   - Frontend reads from localStorage
   - Frontend calls `/api/compliance/profile` to get fresh data
   - Frontend updates display with real name

3. **Fallback**:
   - If API fails → Use localStorage values
   - If localStorage is empty → Show "Compliance Officer"

## Code Flow

```
User Logs In
    ↓
Backend Returns: { user: { firstName, lastName } }
    ↓
AuthService stores in localStorage
    ↓
User Navigates to Compliance Dashboard
    ↓
ComplianceLayout loads
    ↓
loadOfficerInfo() called
    ↓
1. Read from localStorage (immediate display)
2. Call API /api/compliance/profile (update with fresh data)
    ↓
getOfficerFullName() returns: "John Smith"
    ↓
Display in UI: "John Smith"
```

## Quick Verification

Run this in browser console after logging in:
```javascript
// Check localStorage
const firstName = localStorage.getItem('firstName');
const lastName = localStorage.getItem('lastName');
console.log('Stored Name:', firstName, lastName);

// Check if values exist
if (!firstName || !lastName) {
    console.error('❌ Names not stored in localStorage!');
    console.log('Backend needs to return firstName and lastName in login response');
} else {
    console.log('✅ Names found:', firstName, lastName);
}
```

## Contact Backend Team

If the issue persists, ask backend team to verify:

1. **Login Endpoint** (`/api/auth/login`):
   - Returns `user` object with `firstName` and `lastName`

2. **Profile Endpoint** (`/api/compliance/profile`):
   - Returns officer profile with `firstName` and `lastName`
   - Requires JWT token in Authorization header

3. **Database**:
   - Officers table has firstName and lastName columns populated

## Final Notes

The frontend code is now correct and will display the name IF:
- ✅ Backend returns firstName and lastName in login response
- ✅ OR backend returns them in profile API
- ✅ OR they are manually set in localStorage

If none of these conditions are met, it will show "Compliance Officer" as fallback.
