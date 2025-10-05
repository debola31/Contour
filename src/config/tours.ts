import { TourStep } from '@/components/Tour';

// Initial website tour for first-time users
export const initialTour: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to CTM!',
    content: 'Welcome to the CTM Manufacturing Management System! Let\'s take a quick tour to show you the key features.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content: 'Use the sidebar to navigate between different sections. Your available options depend on your user role.',
    placement: 'right',
  },
  {
    target: '[data-tour="logo"]',
    title: 'Company Logo',
    content: 'Click the logo to collapse/expand the sidebar for more screen space.',
    placement: 'right',
  },
  {
    target: '[data-tour="user-info"]',
    title: 'User Information',
    content: 'Your profile information and logout button are here.',
    placement: 'bottom',
  },
];

// Dashboard home tour
export const dashboardHomeTour: TourStep[] = [
  {
    target: '[data-tour="stats-cards"]',
    title: 'Key Metrics',
    content: 'View important statistics at a glance - total work orders, active orders, revenue, and pending approvals.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-activity"]',
    title: 'Recent Activity',
    content: 'Track the latest work orders and their current status.',
    placement: 'left',
  },
  {
    target: '[data-tour="status-chart"]',
    title: 'Visual Analytics',
    content: 'Charts provide visual insights into work order distribution and trends.',
    placement: 'left',
  },
];

// Work Orders tour
export const workOrdersTour: TourStep[] = [
  {
    target: '[data-tour="new-work-order"]',
    title: 'Create Work Order',
    content: 'Click here to create a new work order. You\'ll select a customer, template, and other details.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search-filter"]',
    title: 'Search & Filter',
    content: 'Quickly find work orders using the search box or filter by status.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="work-orders-list"]',
    title: 'Work Orders List',
    content: 'All work orders are displayed here. Click on any work order to view details or take actions.',
    placement: 'left',
  },
];

// Customers tour
export const customersTour: TourStep[] = [
  {
    target: '[data-tour="new-customer"]',
    title: 'Add Customer',
    content: 'Click here to add a new customer to the system.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="customer-search"]',
    title: 'Search Customers',
    content: 'Search customers by name, email, or company.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="customers-table"]',
    title: 'Customer Management',
    content: 'View, edit, or delete customers. Click on any row to manage customer details.',
    placement: 'top',
  },
];

// Inventory tour
export const inventoryTour: TourStep[] = [
  {
    target: '[data-tour="add-material"]',
    title: 'Add Material',
    content: 'Add new materials or parts to your inventory.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="low-stock-alert"]',
    title: 'Low Stock Alerts',
    content: 'Items with low stock are highlighted here so you can reorder in time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="inventory-table"]',
    title: 'Inventory Management',
    content: 'Track quantities, update stock levels, and manage pricing for all materials.',
    placement: 'top',
  },
];

// Personnel tour (Owner only)
export const personnelTour: TourStep[] = [
  {
    target: '[data-tour="add-personnel"]',
    title: 'Add Personnel',
    content: 'Add new team members - owners, salespeople, or operators.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="role-filter"]',
    title: 'Filter by Role',
    content: 'Filter personnel by their role to quickly find specific team members.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="personnel-list"]',
    title: 'Personnel Management',
    content: 'View all personnel. Operators automatically get QR codes for station login.',
    placement: 'left',
  },
];

// Templates tour (Owner only)
export const templatesTour: TourStep[] = [
  {
    target: '[data-tour="new-template"]',
    title: 'Create Template',
    content: 'Create a new work order template to define manufacturing workflows.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="templates-list"]',
    title: 'Templates Library',
    content: 'Browse all available templates. Click one to view its workflow.',
    placement: 'right',
  },
  {
    target: '[data-tour="workflow-viewer"]',
    title: 'Workflow Details',
    content: 'View the complete workflow with all stations, materials, and routing.',
    placement: 'left',
  },
  {
    target: '[data-tour="edit-workflow"]',
    title: 'Visual Workflow Editor',
    content: 'Click "Edit Workflow" to use the visual editor. Add stations, create parallel paths, and assign materials.',
    placement: 'top',
  },
];

// Station Work tour (Operator)
export const stationWorkTour: TourStep[] = [
  {
    target: '[data-tour="scan-work-order"]',
    title: 'Scan Work Order',
    content: 'Enter or scan the work order number to start working on it.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="station-selector"]',
    title: 'Select Your Station',
    content: 'Choose which station you\'re working at.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="current-step"]',
    title: 'Current Step',
    content: 'View the current manufacturing step, required materials, and instructions.',
    placement: 'left',
  },
  {
    target: '[data-tour="complete-step"]',
    title: 'Complete Work',
    content: 'Once finished, record materials used and complete the step.',
    placement: 'top',
  },
];

// Operators tour
export const operatorsTour: TourStep[] = [
  {
    target: '[data-tour="operator-stats"]',
    title: 'Performance Metrics',
    content: 'View operator performance - total orders, accuracy, and average time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="operator-badges"]',
    title: 'Achievement Badges',
    content: 'Operators earn badges for achievements and consistent performance.',
    placement: 'left',
  },
  {
    target: '[data-tour="operators-list"]',
    title: 'Operator Details',
    content: 'View all operators and their current status (active/inactive).',
    placement: 'top',
  },
];

// Admin tour (Owner only)
export const adminTour: TourStep[] = [
  {
    target: '[data-tour="system-stats"]',
    title: 'System Overview',
    content: 'Monitor key system metrics at a glance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="live-stations"]',
    title: 'Live Station Monitor',
    content: 'See which operators are currently working at each station in real-time.',
    placement: 'left',
  },
  {
    target: '[data-tour="recent-orders"]',
    title: 'Recent Work Orders',
    content: 'Quick access to the most recent work order activity.',
    placement: 'left',
  },
];

// Insights tour
export const insightsTour: TourStep[] = [
  {
    target: '[data-tour="trend-chart"]',
    title: 'Trend Analysis',
    content: 'Visualize work order trends over time to identify patterns.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="status-distribution"]',
    title: 'Status Breakdown',
    content: 'See the distribution of work orders across different statuses.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="inventory-chart"]',
    title: 'Inventory Levels',
    content: 'Monitor material stock levels to prevent shortages.',
    placement: 'top',
  },
];

// Invoices tour
export const invoicesTour: TourStep[] = [
  {
    target: '[data-tour="invoice-filter"]',
    title: 'Filter Invoices',
    content: 'Filter by payment status to quickly find paid or unpaid invoices.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="invoices-table"]',
    title: 'Invoice Management',
    content: 'View all invoices, mark as paid, and track payment status.',
    placement: 'top',
  },
];

// Shipping tour
export const shippingTour: TourStep[] = [
  {
    target: '[data-tour="shipment-filter"]',
    title: 'Filter Shipments',
    content: 'Filter by delivery status - label created, shipped, or delivered.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="shipments-table"]',
    title: 'Shipment Tracking',
    content: 'Track all shipments, update delivery status, and view tracking numbers.',
    placement: 'top',
  },
];

// Transactions tour
export const transactionsTour: TourStep[] = [
  {
    target: '[data-tour="transaction-filter"]',
    title: 'Filter by Type',
    content: 'Filter transactions by entity type to audit specific areas.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="transactions-log"]',
    title: 'Audit Trail',
    content: 'Complete audit trail of all system changes with timestamps and user information.',
    placement: 'top',
  },
];

// Tour ID mapping
export const tourIds = {
  initial: 'initial-tour',
  dashboardHome: 'dashboard-home-tour',
  workOrders: 'work-orders-tour',
  customers: 'customers-tour',
  inventory: 'inventory-tour',
  personnel: 'personnel-tour',
  templates: 'templates-tour',
  stationWork: 'station-work-tour',
  operators: 'operators-tour',
  admin: 'admin-tour',
  insights: 'insights-tour',
  invoices: 'invoices-tour',
  shipping: 'shipping-tour',
  transactions: 'transactions-tour',
} as const;

// Map page paths to tours
export const pageTours: Record<string, { id: string; steps: TourStep[] }> = {
  '/dashboard': { id: tourIds.dashboardHome, steps: dashboardHomeTour },
  '/dashboard/work-orders': { id: tourIds.workOrders, steps: workOrdersTour },
  '/dashboard/customers': { id: tourIds.customers, steps: customersTour },
  '/dashboard/inventory': { id: tourIds.inventory, steps: inventoryTour },
  '/dashboard/personnel': { id: tourIds.personnel, steps: personnelTour },
  '/dashboard/templates': { id: tourIds.templates, steps: templatesTour },
  '/dashboard/station': { id: tourIds.stationWork, steps: stationWorkTour },
  '/dashboard/operators': { id: tourIds.operators, steps: operatorsTour },
  '/dashboard/admin': { id: tourIds.admin, steps: adminTour },
  '/dashboard/insights': { id: tourIds.insights, steps: insightsTour },
  '/dashboard/invoices': { id: tourIds.invoices, steps: invoicesTour },
  '/dashboard/shipping': { id: tourIds.shipping, steps: shippingTour },
  '/dashboard/transactions': { id: tourIds.transactions, steps: transactionsTour },
};
