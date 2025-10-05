# Comprehensive Test Plan - Contour Manufacturing Management System

## Test Environment
- **Platform**: Web Application (Static Export)
- **Framework**: Next.js 15.5.4
- **State Management**: Zustand with localStorage persistence
- **Testing Method**: Manual functional testing

---

## 1. Authentication & Authorization Tests

### 1.1 Login Functionality
- [ ] **TC-AUTH-001**: Login with valid owner credentials
  - Navigate to `/login`
  - Enter owner email and password
  - Click "Sign In"
  - **Expected**: Redirect to `/dashboard` with full menu access

- [ ] **TC-AUTH-002**: Login with valid salesperson credentials
  - Navigate to `/login`
  - Enter salesperson email and password
  - Click "Sign In"
  - **Expected**: Redirect to `/dashboard` with salesperson menu access (no Admin, Personnel, Templates, Station Work)

- [ ] **TC-AUTH-003**: Login with valid operator credentials
  - Navigate to `/login`
  - Enter operator email and password
  - Click "Sign In"
  - **Expected**: Redirect to `/dashboard` with operator menu access (only Home and Station Work)

- [ ] **TC-AUTH-004**: Login with invalid credentials
  - Navigate to `/login`
  - Enter invalid email/password
  - Click "Sign In"
  - **Expected**: Error message displayed, remain on login page

### 1.2 Role-Based Access Control
- [ ] **TC-AUTH-005**: Owner can access all pages
  - Login as owner
  - Verify all menu items visible in sidebar
  - Navigate to each page and verify access granted

- [ ] **TC-AUTH-006**: Salesperson cannot access restricted pages
  - Login as salesperson
  - Verify Admin, Personnel, Templates, Station Work not in sidebar
  - Attempt direct navigation to `/dashboard/admin`
  - **Expected**: Should redirect or show error

- [ ] **TC-AUTH-007**: Operator can only access allowed pages
  - Login as operator
  - Verify only Home and Station Work in sidebar
  - Attempt direct navigation to `/dashboard/customers`
  - **Expected**: Should redirect or show error

---

## 2. Dashboard (Home) Page Tests

### 2.1 Statistics Display
- [ ] **TC-DASH-001**: Verify total work orders count is accurate
  - Login as owner
  - Navigate to `/dashboard`
  - Count should match total work orders in system

- [ ] **TC-DASH-002**: Verify active work orders count
  - Count should only include work orders with status 'in_progress'

- [ ] **TC-DASH-003**: Verify total revenue calculation
  - Should sum all finished work order actual prices

- [ ] **TC-DASH-004**: Verify pending approvals count
  - Should count work orders with status 'requested'

### 2.2 Recent Activity
- [ ] **TC-DASH-005**: Verify recent work orders display
  - Should show most recent work orders
  - Each entry should show order number, customer name, status, date

- [ ] **TC-DASH-006**: Verify work order status colors
  - Requested: yellow/orange
  - Approved: blue
  - In Progress: purple
  - Finished: green
  - Rejected: red

### 2.3 Charts and Graphs
- [ ] **TC-DASH-007**: Verify status distribution chart displays
  - Should show pie/bar chart with work order status breakdown

- [ ] **TC-DASH-008**: Verify low stock materials alert
  - Should highlight materials where quantityInStock <= minimumQuantity

---

## 3. Work Orders Page Tests

### 3.1 Work Order Listing
- [ ] **TC-WO-001**: Verify all work orders display in table
  - Navigate to `/dashboard/work-orders`
  - Verify table shows all work orders

- [ ] **TC-WO-002**: Verify work order search functionality
  - Enter search term in search box
  - Verify filtered results match search term

- [ ] **TC-WO-003**: Verify filter by status
  - Select status filter (Requested, Approved, etc.)
  - Verify only matching work orders display

### 3.2 Work Order Creation
- [ ] **TC-WO-004**: Create new work order
  - Click "+ New Work Order"
  - Fill in all required fields (customer, template, salesperson)
  - Click "Create"
  - **Expected**: New work order appears in list with status 'requested'

- [ ] **TC-WO-005**: Create work order with missing required fields
  - Click "+ New Work Order"
  - Leave required fields empty
  - Click "Create"
  - **Expected**: Validation error, form not submitted

### 3.3 Work Order Approval/Rejection (Owner Only)
- [ ] **TC-WO-006**: Approve work order
  - Login as owner
  - Find work order with status 'requested'
  - Click approve button
  - **Expected**: Status changes to 'approved', approvedAt and approvedBy set

- [ ] **TC-WO-007**: Reject work order
  - Login as owner
  - Find work order with status 'requested'
  - Click reject button
  - Enter rejection reason
  - **Expected**: Status changes to 'rejected', rejectedAt, rejectedBy, and reason set

### 3.4 Work Order Details
- [ ] **TC-WO-008**: View work order details
  - Click on a work order
  - Verify all details display correctly (template, customer, prices, status, history)

- [ ] **TC-WO-009**: View station history
  - View work order with station history
  - Verify all completed stations show with operators and timestamps

---

## 4. Customers Page Tests

### 4.1 Customer Listing
- [ ] **TC-CUST-001**: Verify all customers display
  - Navigate to `/dashboard/customers`
  - Verify customer table shows all customers

- [ ] **TC-CUST-002**: Search customers
  - Enter customer name or email in search
  - Verify filtered results

### 4.2 Customer CRUD Operations
- [ ] **TC-CUST-003**: Create new customer
  - Click "+ New Customer"
  - Fill in all fields
  - Click "Add Customer"
  - **Expected**: New customer appears in list

- [ ] **TC-CUST-004**: Edit customer
  - Click edit on a customer
  - Modify fields
  - Click "Save Changes"
  - **Expected**: Customer details updated

- [ ] **TC-CUST-005**: Delete customer
  - Click delete on a customer
  - Confirm deletion
  - **Expected**: Customer removed from list

---

## 5. Operators Page Tests

### 5.1 Operator Dashboard
- [ ] **TC-OP-001**: View all operators
  - Navigate to `/dashboard/operators`
  - Verify all operators display

- [ ] **TC-OP-002**: View operator statistics
  - Verify total orders, accuracy, avg time per order display correctly

- [ ] **TC-OP-003**: View operator badges
  - Verify badges display for operators who have earned them

### 5.2 Operator Performance
- [ ] **TC-OP-004**: View performance chart
  - Verify performance chart displays operator metrics

- [ ] **TC-OP-005**: Filter by active/inactive operators
  - Verify filter shows only logged-in operators when selecting "Active"

---

## 6. Inventory Page Tests

### 6.1 Material Listing
- [ ] **TC-INV-001**: View all materials
  - Navigate to `/dashboard/inventory`
  - Verify all materials display in table

- [ ] **TC-INV-002**: Search materials
  - Enter search term
  - Verify filtered results

- [ ] **TC-INV-003**: View low stock alerts
  - Verify materials with stock <= minimum show warning indicator

### 6.2 Material CRUD Operations
- [ ] **TC-INV-004**: Add new material
  - Click "+ Add Material"
  - Fill in all fields (part name, source, quantity, price)
  - Click "Add Material"
  - **Expected**: New material appears in inventory

- [ ] **TC-INV-005**: Update material stock
  - Click on material
  - Adjust quantity (add or remove)
  - Confirm change
  - **Expected**: Quantity updated in table

- [ ] **TC-INV-006**: Delete material
  - Click delete on material
  - Confirm deletion
  - **Expected**: Material removed from inventory

---

## 7. Invoices Page Tests

### 7.1 Invoice Listing
- [ ] **TC-INV-001**: View all invoices
  - Navigate to `/dashboard/invoices`
  - Verify invoice table displays all invoices

- [ ] **TC-INV-002**: Filter invoices by status
  - Select "Paid" or "Unpaid" filter
  - Verify only matching invoices display

- [ ] **TC-INV-003**: Search invoices
  - Enter invoice number or customer name
  - Verify filtered results

### 7.2 Invoice Details
- [ ] **TC-INV-004**: View invoice details
  - Click on invoice
  - Verify work order link, customer info, amount, status display correctly

- [ ] **TC-INV-005**: Mark invoice as paid
  - Find unpaid invoice
  - Click "Mark as Paid"
  - **Expected**: Status changes to 'paid', paidAt timestamp set

---

## 8. Shipping Page Tests

### 8.1 Shipment Listing
- [ ] **TC-SHIP-001**: View all shipments
  - Navigate to `/dashboard/shipping`
  - Verify shipment table displays

- [ ] **TC-SHIP-002**: Filter by delivery status
  - Select status filter (Label Created, Shipped, Delivered)
  - Verify filtered results

- [ ] **TC-SHIP-003**: Search shipments
  - Enter tracking number or customer name
  - Verify filtered results

### 8.2 Shipment Details
- [ ] **TC-SHIP-004**: View shipment details
  - Click on shipment
  - Verify tracking number, destination, status, dates display correctly

- [ ] **TC-SHIP-005**: Update shipment status
  - Select shipment
  - Change delivery status
  - **Expected**: Status and timestamp updated

---

## 9. Transactions Page Tests

### 9.1 Transaction Log
- [ ] **TC-TRANS-001**: View all transactions
  - Navigate to `/dashboard/transactions`
  - Verify transaction log displays all system transactions

- [ ] **TC-TRANS-002**: Filter by entity type
  - Select filter (Work Order, Customer, Material, etc.)
  - Verify only matching transactions display

- [ ] **TC-TRANS-003**: Search transactions
  - Enter search term
  - Verify filtered results

- [ ] **TC-TRANS-004**: View transaction details
  - Verify each transaction shows: type, entity, action, user, timestamp, changes

---

## 10. Personnel Management Page Tests (Owner Only)

### 10.1 Personnel Listing
- [ ] **TC-PERS-001**: View all personnel
  - Login as owner
  - Navigate to `/dashboard/personnel`
  - Verify all owners, salespeople, and operators display

- [ ] **TC-PERS-002**: Filter by role
  - Select role filter (Owner, Salesperson, Operator)
  - Verify only matching personnel display

- [ ] **TC-PERS-003**: Search personnel
  - Enter name or email
  - Verify filtered results

### 10.2 Personnel CRUD Operations
- [ ] **TC-PERS-004**: Add new owner
  - Click "+ Add Personnel"
  - Select role "Owner"
  - Fill in all fields
  - Click "Add Personnel"
  - **Expected**: New owner added, no QR code

- [ ] **TC-PERS-005**: Add new salesperson
  - Click "+ Add Personnel"
  - Select role "Salesperson"
  - Fill in all fields
  - Click "Add Personnel"
  - **Expected**: New salesperson added, no QR code

- [ ] **TC-PERS-006**: Add new operator
  - Click "+ Add Personnel"
  - Select role "Operator"
  - Fill in all fields
  - Click "Add Personnel"
  - **Expected**: New operator added WITH QR code auto-generated

- [ ] **TC-PERS-007**: Edit personnel
  - Click edit on personnel
  - Modify fields
  - Save changes
  - **Expected**: Personnel details updated

- [ ] **TC-PERS-008**: Delete personnel
  - Click delete on personnel
  - Confirm deletion
  - **Expected**: Personnel removed

### 10.3 QR Code Generation
- [ ] **TC-PERS-009**: Verify QR code for operators
  - Add or view operator
  - Verify QR code displays
  - Verify QR code is unique per operator

---

## 11. Work Order Templates Page Tests (Owner Only)

### 11.1 Template Listing
- [ ] **TC-TMPL-001**: View all templates
  - Login as owner
  - Navigate to `/dashboard/templates`
  - Verify all templates display in list

- [ ] **TC-TMPL-002**: Search templates
  - Enter search term
  - Verify filtered results

### 11.2 Template Creation
- [ ] **TC-TMPL-003**: Create new template
  - Click "+ New Template"
  - Fill in name, description, estimated cost
  - Click "Create Template"
  - **Expected**: New template created with empty workflow

- [ ] **TC-TMPL-004**: Create template with missing fields
  - Click "+ New Template"
  - Leave required fields empty
  - Attempt to create
  - **Expected**: Create button disabled, validation message shown

### 11.3 Template Workflow Viewer
- [ ] **TC-TMPL-005**: View template workflow
  - Select a template from list
  - **Expected**: Right panel shows workflow steps in order

- [ ] **TC-TMPL-006**: View workflow step details
  - Select template with workflow steps
  - Verify each step shows: station name, materials required, next steps

- [ ] **TC-TMPL-007**: View quality check steps
  - Select template with quality check node
  - Verify quality checkpoint indicator displays

---

## 12. Station Workflow Page Tests (Operator)

### 12.1 Work Order Scanning
- [ ] **TC-STATION-001**: Scan work order
  - Login as operator
  - Navigate to `/dashboard/station`
  - Enter work order number
  - Click "Scan"
  - **Expected**: Work order details display

- [ ] **TC-STATION-002**: Scan invalid work order
  - Enter non-existent work order number
  - Click "Scan"
  - **Expected**: Error message or no results

### 12.2 Station Selection
- [ ] **TC-STATION-003**: Select station
  - Scan valid work order
  - Select station from dropdown
  - **Expected**: Current step for that station displays

- [ ] **TC-STATION-004**: View current step details
  - After selecting station
  - Verify step label, materials required display

### 12.3 Material Consumption
- [ ] **TC-STATION-005**: Track material usage
  - View step with materials required
  - Verify material list displays
  - Verify quantity fields available for input

- [ ] **TC-STATION-006**: Start work at station
  - Click "Start Work"
  - **Expected**: Work order status updates, station history entry created

### 12.4 Complete Station Work
- [ ] **TC-STATION-007**: Complete step
  - Enter materials used
  - Click "Complete Step"
  - **Expected**: Station work completed, history updated, work order advances to next step

- [ ] **TC-STATION-008**: View today's activity
  - Verify activity feed shows recently completed work

---

## 13. Admin Dashboard Page Tests (Owner Only)

### 13.1 System Overview
- [ ] **TC-ADMIN-001**: View system statistics
  - Login as owner
  - Navigate to `/dashboard/admin`
  - Verify total personnel, active work orders, low stock, unpaid invoices counts

- [ ] **TC-ADMIN-002**: View live station monitor
  - Verify all stations display
  - Verify active operators shown at their current stations
  - Verify inactive stations shown with no operator

- [ ] **TC-ADMIN-003**: Verify operator activity indicators
  - Verify logged-in operators show green indicator
  - Verify operator name displays at their current station

---

## 14. Insights Page Tests

### 14.1 Charts and Analytics
- [ ] **TC-INSIGHT-001**: View work order trends chart
  - Navigate to `/dashboard/insights`
  - Verify line/bar chart displays

- [ ] **TC-INSIGHT-002**: View status distribution
  - Verify pie chart shows work order status breakdown

- [ ] **TC-INSIGHT-003**: View inventory levels
  - Verify inventory chart displays material stock levels

- [ ] **TC-INSIGHT-004**: Verify chart responsiveness
  - Resize browser window
  - Verify charts resize appropriately

---

## 15. UI/UX Tests

### 15.1 Sidebar Navigation
- [ ] **TC-UI-001**: Verify sidebar collapse/expand
  - Click collapse button
  - **Expected**: Sidebar collapses to icons only
  - Click again
  - **Expected**: Sidebar expands to show labels

- [ ] **TC-UI-002**: Verify active page highlighting
  - Navigate between pages
  - Verify current page highlighted in sidebar

- [ ] **TC-UI-003**: Verify monochrome icons display
  - Verify all sidebar icons are SVG monochrome (not emojis)
  - Specifically check Personnel and Templates icons

### 15.2 Header
- [ ] **TC-UI-004**: Verify page title updates
  - Navigate between pages
  - Verify header title matches current page

- [ ] **TC-UI-005**: Verify user info displays
  - Verify current user name displays in header
  - Verify logout button present

### 15.3 Modals
- [ ] **TC-UI-006**: Open/close modals
  - Click button to open modal (Add Customer, Add Material, etc.)
  - Verify modal opens
  - Click Cancel or X to close
  - Verify modal closes

- [ ] **TC-UI-007**: Modal background click
  - Open modal
  - Click outside modal (on backdrop)
  - **Expected**: Modal should close (if implemented)

### 15.4 Responsive Design
- [ ] **TC-UI-008**: Test on mobile viewport
  - Resize to mobile width (< 768px)
  - Verify layout adjusts appropriately

- [ ] **TC-UI-009**: Test on tablet viewport
  - Resize to tablet width (768px - 1024px)
  - Verify layout adjusts appropriately

---

## 16. Data Persistence Tests

### 16.1 localStorage Persistence
- [ ] **TC-DATA-001**: Create data and refresh page
  - Login and create new work order/customer/material
  - Refresh browser page
  - **Expected**: Data still present

- [ ] **TC-DATA-002**: Clear data functionality
  - Navigate to Admin page
  - Find "Clear All Data" or similar button
  - Click and confirm
  - **Expected**: All data cleared, sample data reloaded

- [ ] **TC-DATA-003**: Data persists across sessions
  - Create data
  - Close browser tab
  - Reopen application
  - **Expected**: Data still present

### 16.2 State Management
- [ ] **TC-DATA-004**: Verify Zustand state updates
  - Modify data in one page
  - Navigate to another page that shows same data
  - **Expected**: Updated data displays correctly

- [ ] **TC-DATA-005**: Concurrent updates
  - Open two tabs
  - Make changes in both
  - **Expected**: Changes should sync via localStorage (if implemented)

---

## 17. Performance Tests

### 17.1 Page Load Times
- [ ] **TC-PERF-001**: Measure initial page load
  - Clear cache
  - Navigate to application
  - **Expected**: Page loads in < 3 seconds

- [ ] **TC-PERF-002**: Measure navigation between pages
  - Click between different pages
  - **Expected**: Page transitions in < 500ms

### 17.2 Large Dataset Handling
- [ ] **TC-PERF-003**: Test with 100+ work orders
  - Verify table renders without lag
  - Verify search/filter still responsive

- [ ] **TC-PERF-004**: Test with 500+ materials
  - Verify inventory page loads quickly
  - Verify no scroll lag

---

## 18. Error Handling Tests

### 18.1 Form Validation
- [ ] **TC-ERR-001**: Submit form with invalid email
  - Enter invalid email format
  - Attempt to submit
  - **Expected**: Validation error message

- [ ] **TC-ERR-002**: Submit form with negative numbers
  - Enter negative price or quantity
  - **Expected**: Validation error or value prevented

- [ ] **TC-ERR-003**: Required field validation
  - Leave required fields empty
  - Attempt to submit
  - **Expected**: Error messages for all required fields

### 18.2 State Errors
- [ ] **TC-ERR-004**: Reference deleted entity
  - Delete a customer
  - View work order for that customer
  - **Expected**: Should handle gracefully (show "Unknown" or similar)

- [ ] **TC-ERR-005**: Invalid state transitions
  - Attempt to approve already approved work order
  - **Expected**: Action prevented or error shown

---

## 19. Security Tests

### 19.1 Route Protection
- [ ] **TC-SEC-001**: Access protected route without login
  - Directly navigate to `/dashboard` without logging in
  - **Expected**: Redirect to login page

- [ ] **TC-SEC-002**: Access owner-only page as salesperson
  - Login as salesperson
  - Directly navigate to `/dashboard/admin`
  - **Expected**: Access denied or redirect

- [ ] **TC-SEC-003**: Access owner-only page as operator
  - Login as operator
  - Directly navigate to `/dashboard/personnel`
  - **Expected**: Access denied or redirect

### 19.2 Data Access Control
- [ ] **TC-SEC-004**: Operator cannot approve work orders
  - Login as operator
  - Verify no approve/reject buttons on work orders

- [ ] **TC-SEC-005**: Salesperson cannot access personnel management
  - Login as salesperson
  - Verify Personnel page not accessible

---

## 20. Integration Tests

### 20.1 End-to-End Workflows
- [ ] **TC-INT-001**: Complete work order lifecycle
  1. Login as salesperson
  2. Create work order
  3. Logout, login as owner
  4. Approve work order
  5. Logout, login as operator
  6. Start and complete work at station
  7. Verify work order status updated
  8. Verify invoice generated
  9. Verify shipment created

- [ ] **TC-INT-002**: Material consumption workflow
  1. Note material quantity
  2. Create and approve work order requiring that material
  3. Complete work order with material usage
  4. Verify material quantity decreased

- [ ] **TC-INT-003**: Multi-station workflow
  1. Create work order with template having multiple stations
  2. Complete work at first station
  3. Verify work order advances to next station
  4. Complete work at second station
  5. Verify work order status updates appropriately

---

## Test Execution Summary

### Priority Levels
- **P0 (Critical)**: Authentication, work order creation/approval, data persistence
- **P1 (High)**: CRUD operations, role-based access, navigation
- **P2 (Medium)**: Charts, search/filter, UI/UX
- **P3 (Low)**: Performance optimization, edge cases

### Test Coverage Goals
- [ ] 100% of P0 tests passing
- [ ] 95% of P1 tests passing
- [ ] 90% of P2 tests passing
- [ ] 80% of P3 tests passing

### Bug Tracking
- Document all bugs found with:
  - Test case ID
  - Severity (Critical, High, Medium, Low)
  - Steps to reproduce
  - Expected vs Actual behavior
  - Screenshots if applicable

---

## Notes
- All tests should be executed in a fresh browser session
- Clear localStorage before each major test suite
- Test on Chrome, Firefox, and Safari for cross-browser compatibility
- Document any deviations from expected behavior
