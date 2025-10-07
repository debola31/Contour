# Tour System Test Cases

## Test Case 1: Initial Tour on First Login
**Prerequisites:** Fresh browser session (no completed tours in localStorage)
**Steps:**
1. Login as any user type
2. Wait for initial tour to automatically start after 500ms
3. Verify tour appears with "Welcome to CTM!" as first step
4. Click "Next" through all 4 steps:
   - Step 1: Body - Welcome message
   - Step 2: Sidebar - Navigation explanation
   - Step 3: Logo - Logo explanation (OUTDATED - no collapse feature)
   - Step 4: User info - Profile/logout location
5. Click "Done" on final step
6. Verify tour doesn't appear on page refresh

**Expected Result:**
- Tour starts automatically
- All elements are highlighted correctly
- Tooltip positions correctly near each target
- Tour scrolls to center each highlighted element
- Tour doesn't repeat after completion

**Current Issues Found:**
- Step 3 mentions "collapse/expand the sidebar" but this feature was removed
- Need to verify `data-tour` attributes exist on all target elements

---

## Test Case 2: Dashboard Home Page Tour
**Prerequisites:** User logged in, initial tour completed
**Steps:**
1. Navigate to /dashboard (if not already there)
2. Tour should start automatically if not previously completed
3. Verify 3 steps:
   - Step 1: Stats cards `[data-tour="stats-cards"]`
   - Step 2: Recent activity `[data-tour="recent-activity"]`
   - Step 3: Status chart `[data-tour="status-chart"]`
4. Complete tour

**Expected Result:**
- Tour starts on first visit to dashboard home
- All target elements exist and are highlighted
- Tour doesn't repeat on subsequent visits

**Elements to Verify:**
- Dashboard page has `data-tour="stats-cards"` attribute
- Dashboard page has `data-tour="recent-activity"` attribute
- Dashboard page has `data-tour="status-chart"` attribute

---

## Test Case 3: Work Orders Tour
**Prerequisites:** User logged in, initial tour completed
**Steps:**
1. Navigate to /dashboard/work-orders
2. Tour should start automatically
3. Verify 3 steps:
   - Step 1: New work order button `[data-tour="new-work-order"]`
   - Step 2: Search/filter `[data-tour="search-filter"]`
   - Step 3: Work orders list `[data-tour="work-orders-list"]`

**Expected Result:**
- Tour highlights correct elements
- Elements exist on page

**Elements to Verify:**
- Work orders page has all required `data-tour` attributes

---

## Test Case 4: Tour Tooltip Positioning
**Prerequisites:** Any tour active
**Steps:**
1. Start any page tour
2. For each step, verify:
   - Tooltip appears near the highlighted element
   - Tooltip doesn't overflow viewport
   - Element is scrolled into center view
   - Highlight overlay covers the correct element

**Expected Result:**
- Tooltips position correctly based on `placement` property
- Smooth scrolling to center elements
- No flashing or jumping

---

## Test Case 5: Tour State Persistence
**Prerequisites:** Fresh session
**Steps:**
1. Login and complete initial tour
2. Navigate to Work Orders page and complete that tour
3. Refresh the browser
4. Navigate back to Work Orders page

**Expected Result:**
- Initial tour doesn't repeat
- Work Orders tour doesn't repeat
- Completed tours are stored in localStorage

---

## Test Case 6: Tour Skip/Cancel Functionality
**Prerequisites:** Any tour active
**Steps:**
1. Start a tour
2. Click "Skip Tour" button
3. Navigate away and back to same page

**Expected Result:**
- Tour closes immediately
- Tour is marked as completed in localStorage
- Tour doesn't restart on return to page

---

## Test Case 7: All Page Tours Data Attributes
**Test each page has required data-tour attributes**

### Dashboard Home (/dashboard)
- [ ] `[data-tour="stats-cards"]`
- [ ] `[data-tour="recent-activity"]`
- [ ] `[data-tour="status-chart"]`

### Work Orders (/dashboard/work-orders)
- [ ] `[data-tour="new-work-order"]`
- [ ] `[data-tour="search-filter"]`
- [ ] `[data-tour="work-orders-list"]`

### Customers (/dashboard/customers)
- [ ] `[data-tour="new-customer"]`
- [ ] `[data-tour="customer-search"]`
- [ ] `[data-tour="customers-table"]`

### Inventory (/dashboard/inventory)
- [ ] `[data-tour="add-material"]`
- [ ] `[data-tour="low-stock-alert"]`
- [ ] `[data-tour="inventory-table"]`

### Personnel (/dashboard/personnel)
- [ ] `[data-tour="add-personnel"]`
- [ ] `[data-tour="role-filter"]`
- [ ] `[data-tour="personnel-list"]`

### Templates (/dashboard/templates)
- [ ] `[data-tour="new-template"]`
- [ ] `[data-tour="templates-list"]`
- [ ] `[data-tour="workflow-viewer"]`
- [ ] `[data-tour="edit-workflow"]`

### Station Work (/dashboard/station)
- [ ] `[data-tour="scan-work-order"]`
- [ ] `[data-tour="station-selector"]`
- [ ] `[data-tour="current-step"]`
- [ ] `[data-tour="complete-step"]`

### Operators (/dashboard/operators)
- [ ] `[data-tour="operator-stats"]`
- [ ] `[data-tour="operator-badges"]`
- [ ] `[data-tour="operators-list"]`

### Admin (/dashboard/admin)
- [ ] `[data-tour="system-stats"]`
- [ ] `[data-tour="live-stations"]`
- [ ] `[data-tour="recent-orders"]`

### Insights (/dashboard/insights)
- [ ] `[data-tour="trend-chart"]`
- [ ] `[data-tour="status-distribution"]`
- [ ] `[data-tour="inventory-chart"]`

### Invoices (/dashboard/invoices)
- [ ] `[data-tour="invoice-filter"]`
- [ ] `[data-tour="invoices-table"]`

### Shipping (/dashboard/shipping)
- [ ] `[data-tour="shipment-filter"]`
- [ ] `[data-tour="shipments-table"]`

### Transactions (/dashboard/transactions)
- [ ] `[data-tour="transaction-filter"]`
- [ ] `[data-tour="transactions-log"]`

---

## Test Case 8: Tour Component Functionality
**Prerequisites:** Tour system active
**Steps:**
1. Verify Tour.tsx component renders overlay
2. Verify highlight appears around target element
3. Verify tooltip with title and content
4. Verify "Next", "Back", "Skip Tour" buttons work
5. Verify step counter (e.g., "2/4")

**Expected Result:**
- All UI elements render correctly
- Buttons are functional
- Step progression works forward and backward

---

## Known Issues to Fix:
1. Initial tour step 3 references collapsed sidebar (feature removed)
2. Need to verify all `data-tour` attributes exist on pages
3. Tour positioning may fail if elements don't exist yet (timing issue)
4. Need fade-in effect when tour repositions to avoid flash at top-left
