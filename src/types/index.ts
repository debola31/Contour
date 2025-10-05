// Personnel Types
export type PersonnelRole = 'owner' | 'salesperson' | 'operator';

export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner';
}

export interface SalesPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'salesperson';
}

export interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'operator';
  qrCode: string;
  currentStation: string | null;
  isLoggedIn: boolean;
  lastLoginTime: string | null;
  stats: {
    totalOrders: number;
    accuracy: number; // percentage
    avgTimePerOrder: number; // minutes
    currentStreak: number;
    badges: Badge[];
  };
}

export type Personnel = Owner | SalesPerson | Operator;

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

// Customer Types
export interface BusinessCustomer {
  id: string;
  type: 'business';
  name: string;
  address: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  createdAt: string;
}

export interface IndividualCustomer {
  id: string;
  type: 'individual';
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export type Customer = BusinessCustomer | IndividualCustomer;

// Inventory/Material
export interface Material {
  id: string;
  partName: string;
  unitOfMeasurement: string;
  quantityInStock: number;
  minimumQuantity?: number; // optional threshold
  pricePerUnit: number;
  source: string; // providing company
  createdAt: string;
}

// Station
export interface Station {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

// Work Order Template
export interface MaterialConsumption {
  materialId: string;
  quantity: number;
}

export interface FlowNode {
  id: string;
  type: 'station' | 'merge' | 'split';
  stationId?: string; // for station nodes
  position: { x: number; y: number };
  data: {
    label: string;
    materials?: MaterialConsumption[];
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface WorkOrderTemplate {
  id: string;
  name: string; // usually the product name
  description: string;
  flow: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
  estimatedCost: number;
  createdAt: string;
}

// Work Order
export type WorkOrderStatus = 'requested' | 'approved' | 'rejected' | 'in_progress' | 'finished';

export interface StationHistory {
  stationId: string;
  startedAt: string;
  completedAt?: string;
  operatorId: string;
  materialsUsed?: MaterialConsumption[];
  notes?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  templateId: string;
  customerId: string;
  salesPersonId: string;
  status: WorkOrderStatus;
  currentStations: string[]; // can be multiple for parallel paths
  stationHistory: StationHistory[];
  estimatedPrice: number;
  actualPrice?: number;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string; // owner id
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  finishedAt?: string;
  activeFlowPositions: string[]; // current node IDs in the flow
}

// Invoice
export type InvoiceStatus = 'unpaid' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  workOrderId: string;
  customerId: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
  dueDate: string;
}

// Shipment
export type DeliveryStatus = 'label_created' | 'shipped' | 'delivered';

export interface Shipment {
  id: string;
  trackingNumber: string;
  workOrderId: string;
  customerId: string;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingAddress: string;
}

// Transaction Log
export type TransactionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'station_start'
  | 'station_complete'
  | 'quality_fail';

export interface Transaction {
  id: string;
  timestamp: string;
  userId: string; // who made the change
  userRole: PersonnelRole;
  objectType:
    | 'personnel'
    | 'customer'
    | 'material'
    | 'station'
    | 'template'
    | 'workorder'
    | 'invoice'
    | 'shipment';
  objectId: string;
  action: TransactionType;
  changes?: Record<string, any>;
  description: string;
}

// Auth
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: PersonnelRole;
}

// App State
export interface AppState {
  // Auth
  currentUser: AuthUser | null;
  isAuthenticated: boolean;

  // Data
  personnel: Personnel[];
  customers: Customer[];
  materials: Material[];
  stations: Station[];
  templates: WorkOrderTemplate[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  shipments: Shipment[];
  transactions: Transaction[];

  // Settings
  operatorAutoLogoutMinutes: number;

  // Actions will be defined in the store
}

// AI Insights
export interface AIInsight {
  id: string;
  type: 'warning' | 'recommendation' | 'insight';
  category: 'inventory' | 'operations' | 'revenue' | 'personnel';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  isActive: boolean;
}

// Chart Config
export interface ChartConfig {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  dataSource: string;
  config: Record<string, any>;
  createdAt: string;
}
