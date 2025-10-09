# Tour System Bugs Found

## Critical Issues

### 1. Missing Data-Tour Attributes on ALL Pages
**Severity:** Critical
**Impact:** All page-specific tours will fail because target elements don't exist

**Pages Missing Attributes:**
- ❌ Dashboard Home - missing all 3 attributes
- ❌ Work Orders - missing all 3 attributes
- ❌ Customers - missing all 3 attributes
- ❌ Inventory - missing all 3 attributes
- ❌ Personnel - missing all 3 attributes
- ❌ Templates - missing all 4 attributes
- ❌ Station Work - missing all 4 attributes
- ❌ Operators - missing all 3 attributes
- ❌ Admin - missing all 3 attributes
- ❌ Insights - missing all 3 attributes
- ❌ Invoices - missing all 2 attributes
- ❌ Shipping - missing all 2 attributes
- ❌ Transactions - missing all 2 attributes

**Only working:** Initial tour (sidebar, logo, user-info)

### 2. Outdated Initial Tour Content
**Severity:** Medium
**Impact:** Confusing user experience

Step 3 of initial tour says: "Click the logo to collapse/expand the sidebar for more screen space."
**Problem:** Sidebar collapse feature was removed - this text is now incorrect

### 3. Tour Component Positioning Issues
**Severity:** Medium
**Impact:** Poor user experience during tours

- Tooltip may flash at (0,0) before positioning correctly
- This was partially fixed with opacity transition, but may still have timing issues

## Fixes Required

1. **Add data-tour attributes to ALL dashboard pages** (Critical Priority)
   - Need to add ~35 data-tour attributes across 13 pages

2. **Update initial tour step 3** (Medium Priority)
   - Remove or update the sidebar collapse reference

3. **Verify tour positioning logic** (Low Priority)
   - Ensure smooth transitions with no flashing

## Implementation Plan

1. Fix initial tour text
2. Add data-tour attributes to each page systematically
3. Test tour flow on each page
4. Verify localStorage persistence works correctly
