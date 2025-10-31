# KYC Review Page - Updates Applied

## Changes Made

### ✅ 1. Removed Risk Level and Date Filters
- Removed "Risk Level" filter dropdown
- Removed "Date From" and "Date To" filter inputs
- Only kept: Search Customer, Document Type, and Status filters

### ✅ 2. Removed Risk Score Completely
- Removed `riskScore` field from `KycDocument` interface
- Removed `riskScore` field from `KycDocumentSummary` interface
- Removed `getRiskScoreClass()` method from component
- Removed risk score display from document details modal
- Removed all risk score related code

### ✅ 3. Different Table Columns for Each Tab

#### **Pending Review Tab:**
- ✅ Checkbox (for bulk selection)
- ✅ Customer Name (with email below)
- ✅ Type
- ✅ Upload Time
- ✅ Status
- ✅ **Document Link** (new column with clickable link to file)
- ✅ Actions (View, Approve, Reject)

#### **All Documents Tab:**
- ❌ No Checkbox column
- ✅ Customer Name (with email below)
- ✅ Type
- ✅ Upload Time
- ✅ Status
- ✅ Verified Time
- ❌ No Actions column

### ✅ 4. Bulk Actions Only in Pending Review
- Bulk actions bar only shows when in "Pending Review" tab
- Removed from "All Documents" tab

### ✅ 5. Customer Email & Phone in Modal
- Added `customerEmail` and `customerPhone` fields to `KycDocument` model
- Updated modal to display actual email and phone from document data
- Shows "N/A" if email/phone not available

### ✅ 6. Document Link Column
- Added new "Document Link" column in Pending Review tab
- Shows clickable link with icon if `filePath` exists
- Shows "No link" text if no file path available
- Opens document in new tab when clicked

## Files Modified

1. **kyc.models.ts**
   - Added `customerEmail?: string`
   - Added `customerPhone?: string`
   - Removed `riskScore?: number` from KycDocument
   - Removed `riskScore?: number` from KycDocumentSummary

2. **kyc-review.ts**
   - Removed `riskLevel`, `dateFrom`, `dateTo` from FilterOptions
   - Updated filter reset logic
   - Removed date range filtering logic
   - Removed risk level filtering logic
   - Updated `openDocumentDetailsModal()` to use actual email/phone
   - Removed `getRiskScoreClass()` method

3. **kyc-review.html**
   - Removed risk level filter dropdown
   - Removed date range filter inputs
   - Created separate table for Pending Review tab (with checkboxes, document link, actions)
   - Created separate table for All Documents tab (no checkboxes, no actions, has verified time)
   - Added document link column with clickable link
   - Updated bulk actions bar to only show for pending tab
   - Removed risk score from document details modal
   - Updated customer email display to use actual data

4. **kyc-review.css**
   - Added styles for `.document-link-col`
   - Added styles for `.doc-link` (clickable link)
   - Added styles for `.no-link` (when no file path)

## Backend Note

The error you mentioned:
```
Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; For input string: "all"
```

This suggests the backend is receiving "all" as a documentId parameter. Make sure the backend endpoint for getting all documents doesn't expect a documentId parameter. The frontend is calling:
- `GET /kyc/pending` for pending documents
- `GET /kyc/all` for all documents

Ensure your backend route is set up correctly for `/kyc/all` without expecting a path parameter.

## Testing Checklist

- [ ] Pending Review tab shows checkboxes
- [ ] Pending Review tab shows Document Link column
- [ ] Pending Review tab shows action buttons
- [ ] All Documents tab has NO checkboxes
- [ ] All Documents tab has NO action buttons
- [ ] All Documents tab shows Verified Time column
- [ ] Document link opens file in new tab
- [ ] Customer email displays correctly in table
- [ ] Customer email displays correctly in modal
- [ ] Customer phone displays correctly in modal
- [ ] Bulk actions only appear in Pending Review tab
- [ ] Risk score is completely removed
- [ ] Date filters are removed
- [ ] Risk level filter is removed
