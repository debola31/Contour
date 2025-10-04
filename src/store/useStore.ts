import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  Personnel,
  Customer,
  Material,
  Station,
  WorkOrderTemplate,
  WorkOrder,
  Invoice,
  Shipment,
  Transaction,
  AuthUser,
  TransactionType,
  PersonnelRole,
} from '@/types';
import { generateSampleData } from '@/data/sampleData';

interface StoreActions {
  // Auth
  login: (email: string, password: string) => AuthUser | null;
  loginOperator: (qrCode: string, stationId: string) => AuthUser | null;
  logout: () => void;

  // Personnel
  addPersonnel: (person: Personnel) => void;
  updatePersonnel: (id: string, updates: Partial<Personnel>) => void;
  deletePersonnel: (id: string) => void;

  // Customers
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Materials
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  // Stations
  addStation: (station: Station) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  deleteStation: (id: string) => void;

  // Templates
  addTemplate: (template: WorkOrderTemplate) => void;
  updateTemplate: (id: string, updates: Partial<WorkOrderTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Work Orders
  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  approveWorkOrder: (id: string, ownerId: string) => void;
  rejectWorkOrder: (id: string, ownerId: string, reason?: string) => void;
  startWorkOrderAtStation: (workOrderId: string, stationId: string, operatorId: string) => void;
  completeStationWork: (workOrderId: string, stationId: string, materialsUsed?: any, notes?: string) => void;
  failQualityCheck: (workOrderId: string, sendBackToStationId: string, notes: string) => void;

  // Invoices
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  markInvoicePaid: (id: string) => void;

  // Shipments
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;

  // Transactions
  logTransaction: (
    objectType: Transaction['objectType'],
    objectId: string,
    action: TransactionType,
    description: string,
    changes?: Record<string, any>
  ) => void;

  // Settings
  updateSettings: (settings: Partial<Pick<AppState, 'operatorAutoLogoutMinutes'>>) => void;

  // Data Management
  exportData: (objectType?: string) => any;
  importData: (data: any) => void;
  resetToSampleData: () => void;
}

type Store = AppState & StoreActions;

const initialData = generateSampleData();

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
      personnel: initialData.personnel,
      customers: initialData.customers,
      materials: initialData.materials,
      stations: initialData.stations,
      templates: [],
      workOrders: [],
      invoices: [],
      shipments: [],
      transactions: [],
      operatorAutoLogoutMinutes: 600, // 10 hours

      // Auth actions
      login: (email: string, password: string) => {
        // Simple login - in production this would validate password
        const person = get().personnel.find(
          (p) => p.email === email && (p.role === 'owner' || p.role === 'salesperson')
        );
        if (person) {
          const user: AuthUser = {
            id: person.id,
            firstName: person.firstName,
            lastName: person.lastName,
            email: person.email,
            role: person.role,
          };
          set({ currentUser: user, isAuthenticated: true });
          return user;
        }
        return null;
      },

      loginOperator: (qrCode: string, stationId: string) => {
        const operator = get().personnel.find(
          (p) => p.role === 'operator' && (p as any).qrCode === qrCode
        );
        if (operator) {
          // Update operator status
          get().updatePersonnel(operator.id, {
            ...operator,
            currentStation: stationId,
            isLoggedIn: true,
            lastLoginTime: new Date().toISOString(),
          } as any);

          const user: AuthUser = {
            id: operator.id,
            firstName: operator.firstName,
            lastName: operator.lastName,
            email: operator.email,
            role: 'operator',
          };
          set({ currentUser: user, isAuthenticated: true });
          return user;
        }
        return null;
      },

      logout: () => {
        const currentUser = get().currentUser;
        if (currentUser?.role === 'operator') {
          // Update operator status
          get().updatePersonnel(currentUser.id, {
            currentStation: null,
            isLoggedIn: false,
          } as any);
        }
        set({ currentUser: null, isAuthenticated: false });
      },

      // Personnel actions
      addPersonnel: (person: Personnel) => {
        set((state) => ({ personnel: [...state.personnel, person] }));
        get().logTransaction('personnel', person.id, 'create', `Added ${person.role} ${person.firstName} ${person.lastName}`);
      },

      updatePersonnel: (id: string, updates: Partial<Personnel>) => {
        set((state) => ({
          personnel: state.personnel.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deletePersonnel: (id: string) => {
        const person = get().personnel.find((p) => p.id === id);
        set((state) => ({ personnel: state.personnel.filter((p) => p.id !== id) }));
        if (person) {
          get().logTransaction('personnel', id, 'delete', `Deleted ${person.role} ${person.firstName} ${person.lastName}`);
        }
      },

      // Customer actions
      addCustomer: (customer: Customer) => {
        set((state) => ({ customers: [...state.customers, customer] }));
        get().logTransaction('customer', customer.id, 'create', `Added customer ${customer.type === 'business' ? customer.name : customer.name}`);
      },

      updateCustomer: (id: string, updates: Partial<Customer>) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        get().logTransaction('customer', id, 'update', `Updated customer`, updates);
      },

      deleteCustomer: (id: string) => {
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
        get().logTransaction('customer', id, 'delete', `Deleted customer`);
      },

      // Material actions
      addMaterial: (material: Material) => {
        set((state) => ({ materials: [...state.materials, material] }));
        get().logTransaction('material', material.id, 'create', `Added material ${material.partName}`);
      },

      updateMaterial: (id: string, updates: Partial<Material>) => {
        set((state) => ({
          materials: state.materials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
        get().logTransaction('material', id, 'update', `Updated material`, updates);
      },

      deleteMaterial: (id: string) => {
        set((state) => ({ materials: state.materials.filter((m) => m.id !== id) }));
        get().logTransaction('material', id, 'delete', `Deleted material`);
      },

      // Station actions
      addStation: (station: Station) => {
        set((state) => ({ stations: [...state.stations, station] }));
        get().logTransaction('station', station.id, 'create', `Added station ${station.name}`);
      },

      updateStation: (id: string, updates: Partial<Station>) => {
        set((state) => ({
          stations: state.stations.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
        get().logTransaction('station', id, 'update', `Updated station`, updates);
      },

      deleteStation: (id: string) => {
        set((state) => ({ stations: state.stations.filter((s) => s.id !== id) }));
        get().logTransaction('station', id, 'delete', `Deleted station`);
      },

      // Template actions
      addTemplate: (template: WorkOrderTemplate) => {
        set((state) => ({ templates: [...state.templates, template] }));
        get().logTransaction('template', template.id, 'create', `Added template ${template.name}`);
      },

      updateTemplate: (id: string, updates: Partial<WorkOrderTemplate>) => {
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
        get().logTransaction('template', id, 'update', `Updated template`, updates);
      },

      deleteTemplate: (id: string) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
        get().logTransaction('template', id, 'delete', `Deleted template`);
      },

      // Work Order actions
      addWorkOrder: (workOrder: WorkOrder) => {
        set((state) => ({ workOrders: [...state.workOrders, workOrder] }));
        get().logTransaction('workorder', workOrder.id, 'create', `Created work order ${workOrder.orderNumber}`);
      },

      updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => {
        set((state) => ({
          workOrders: state.workOrders.map((wo) => (wo.id === id ? { ...wo, ...updates } : wo)),
        }));
      },

      approveWorkOrder: (id: string, ownerId: string) => {
        const updates = {
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          approvedBy: ownerId,
        };
        get().updateWorkOrder(id, updates);
        get().logTransaction('workorder', id, 'approve', `Approved work order`);
      },

      rejectWorkOrder: (id: string, ownerId: string, reason?: string) => {
        const updates = {
          status: 'rejected' as const,
          rejectedAt: new Date().toISOString(),
          rejectedBy: ownerId,
          rejectionReason: reason,
        };
        get().updateWorkOrder(id, updates);
        get().logTransaction('workorder', id, 'reject', `Rejected work order: ${reason || 'No reason provided'}`);
      },

      startWorkOrderAtStation: (workOrderId: string, stationId: string, operatorId: string) => {
        const workOrder = get().workOrders.find((wo) => wo.id === workOrderId);
        if (workOrder) {
          const newHistory = {
            stationId,
            startedAt: new Date().toISOString(),
            operatorId,
          };
          get().updateWorkOrder(workOrderId, {
            status: 'in_progress',
            currentStations: [...workOrder.currentStations.filter(s => s !== stationId), stationId],
            stationHistory: [...workOrder.stationHistory, newHistory],
          });
          get().logTransaction('workorder', workOrderId, 'station_start', `Started at station ${stationId}`);
        }
      },

      completeStationWork: (workOrderId: string, stationId: string, materialsUsed?: any, notes?: string) => {
        const workOrder = get().workOrders.find((wo) => wo.id === workOrderId);
        if (workOrder) {
          const updatedHistory = workOrder.stationHistory.map((h) =>
            h.stationId === stationId && !h.completedAt
              ? { ...h, completedAt: new Date().toISOString(), materialsUsed, notes }
              : h
          );
          get().updateWorkOrder(workOrderId, {
            stationHistory: updatedHistory,
            currentStations: workOrder.currentStations.filter(s => s !== stationId),
          });
          get().logTransaction('workorder', workOrderId, 'station_complete', `Completed work at station ${stationId}`);
        }
      },

      failQualityCheck: (workOrderId: string, sendBackToStationId: string, notes: string) => {
        const workOrder = get().workOrders.find((wo) => wo.id === workOrderId);
        if (workOrder) {
          get().updateWorkOrder(workOrderId, {
            currentStations: [sendBackToStationId],
          });
          get().logTransaction('workorder', workOrderId, 'quality_fail', `Quality check failed, sent back to station ${sendBackToStationId}: ${notes}`);
        }
      },

      // Invoice actions
      addInvoice: (invoice: Invoice) => {
        set((state) => ({ invoices: [...state.invoices, invoice] }));
        get().logTransaction('invoice', invoice.id, 'create', `Created invoice ${invoice.invoiceNumber}`);
      },

      updateInvoice: (id: string, updates: Partial<Invoice>) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
        }));
      },

      markInvoicePaid: (id: string) => {
        get().updateInvoice(id, {
          status: 'paid',
          paidAt: new Date().toISOString(),
        });
        get().logTransaction('invoice', id, 'update', `Marked invoice as paid`);
      },

      // Shipment actions
      addShipment: (shipment: Shipment) => {
        set((state) => ({ shipments: [...state.shipments, shipment] }));
        get().logTransaction('shipment', shipment.id, 'create', `Created shipment ${shipment.trackingNumber}`);
      },

      updateShipment: (id: string, updates: Partial<Shipment>) => {
        set((state) => ({
          shipments: state.shipments.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
        get().logTransaction('shipment', id, 'update', `Updated shipment`, updates);
      },

      // Transaction log
      logTransaction: (
        objectType: Transaction['objectType'],
        objectId: string,
        action: TransactionType,
        description: string,
        changes?: Record<string, any>
      ) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const transaction: Transaction = {
          id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userRole: currentUser.role,
          objectType,
          objectId,
          action,
          description,
          changes,
        };
        set((state) => ({ transactions: [...state.transactions, transaction] }));
      },

      // Settings
      updateSettings: (settings) => {
        set(settings);
      },

      // Data management
      exportData: (objectType?: string) => {
        const state = get();
        if (objectType) {
          return { [objectType]: (state as any)[objectType] };
        }
        return {
          personnel: state.personnel,
          customers: state.customers,
          materials: state.materials,
          stations: state.stations,
          templates: state.templates,
          workOrders: state.workOrders,
          invoices: state.invoices,
          shipments: state.shipments,
          transactions: state.transactions,
        };
      },

      importData: (data: any) => {
        set((state) => ({
          ...state,
          ...data,
        }));
      },

      resetToSampleData: () => {
        const freshData = generateSampleData();
        set({
          personnel: freshData.personnel,
          customers: freshData.customers,
          materials: freshData.materials,
          stations: freshData.stations,
          templates: [],
          workOrders: [],
          invoices: [],
          shipments: [],
          transactions: [],
        });
      },
    }),
    {
      name: 'contour-erp-storage',
    }
  )
);
