# Backend Fix Required - Add @Transactional Annotation

## Issue
The error "Could not commit JPA transaction" occurs because the service methods are missing the `@Transactional` annotation.

## Fix Required in Backend

### Add to AdminServiceImpl.java

Add the `@Transactional` annotation to all CRUD methods:

```java
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminServiceImpl implements AdminService {
    
    // === KEYWORDS ===
    
    @Transactional  // ← ADD THIS
    @Override
    public SuspiciousKeyword createKeyword(KeywordRequest request) {
        SuspiciousKeyword keyword = new SuspiciousKeyword(request.getWord(), request.getCategory(),
                request.getSeverity());
        keyword.setActive(request.getActive());
        return keywordRepo.save(keyword);
    }

    @Transactional  // ← ADD THIS
    @Override
    public SuspiciousKeyword updateKeyword(Long id, KeywordRequest request) {
        SuspiciousKeyword kw = keywordRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Keyword not found"));
        kw.setWord(request.getWord());
        kw.setCategory(request.getCategory());
        kw.setSeverity(request.getSeverity());
        kw.setActive(request.getActive());
        return keywordRepo.save(kw);
    }

    @Transactional  // ← ADD THIS
    @Override
    public void deleteKeyword(Long id) {
        keywordRepo.deleteById(id);
    }

    // Read operations don't need @Transactional but it doesn't hurt
    @Transactional(readOnly = true)  // ← OPTIONAL but recommended
    @Override
    public List<SuspiciousKeyword> getAllKeywords() {
        return keywordRepo.findAll();
    }
}
```

## Why This Fixes the Issue

The `@Transactional` annotation:
1. **Starts a database transaction** before the method executes
2. **Commits the transaction** when the method completes successfully
3. **Rolls back** if an exception occurs
4. **Manages the EntityManager** lifecycle properly

Without it, JPA can't commit changes to the database, causing the "Could not commit JPA transaction" error.

## Alternative: Add @Transactional at Class Level

You can also add it at the class level to apply to all methods:

```java
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional  // ← ADD THIS at class level
public class AdminServiceImpl implements AdminService {
    
    // All methods will now be transactional
    @Override
    public SuspiciousKeyword createKeyword(KeywordRequest request) {
        // ... existing code
    }
    
    // ... other methods
}
```

## Verify the Fix

After adding `@Transactional`:
1. Restart your backend server
2. Try the update operation from the frontend
3. It should now work without the transaction error

## Frontend Changes Already Made

The frontend has been updated to send the correct field names:
- `word` (instead of `keyword`)
- `active` (instead of `isActive`)

These match what your backend expects in the `KeywordRequest` class.
