import { Personnel, Customer, Material, Station, WorkOrderTemplate, WorkOrder, Invoice, Shipment, Transaction } from '@/types';
import personnelData from './json/personnel.json';
import customersData from './json/customers.json';
import materialsData from './json/materials.json';
import stationsData from './json/stations.json';
import { generateWorkOrderTemplates } from './generateTemplates';
import { generateWorkOrders, generateInvoices, generateShipments, generateTransactions } from './generateCompleteData';

let cachedData: any = null;

export const loadSampleData = () => {
  if (cachedData) return cachedData;

  const personnel = personnelData as Personnel[];
  const customers = customersData as Customer[];
  const materials = materialsData as Material[];
  const stations = stationsData as Station[];

  // Generate templates
  const stationIds = stations.map(s => s.id);
  const materialIds = materials.map(m => m.id);
  const templates = generateWorkOrderTemplates(stationIds, materialIds);

  // Generate work orders
  const customerIds = customers.map(c => c.id);
  const salesPersonIds = personnel.filter(p => p.role === 'salesperson').map(p => p.id);
  const ownerIds = personnel.filter(p => p.role === 'owner').map(p => p.id);
  const workOrders = generateWorkOrders(templates, customerIds, salesPersonIds, ownerIds);

  // Generate invoices and shipments
  const invoices = generateInvoices(workOrders, customerIds);
  const shipments = generateShipments(workOrders, customerIds, customers);

  // Generate transactions
  const personnelIds = personnel.map(p => p.id);
  const transactions = generateTransactions(workOrders, invoices, shipments, personnelIds);

  cachedData = {
    personnel,
    customers,
    materials,
    stations,
    templates,
    workOrders,
    invoices,
    shipments,
    transactions,
  };

  return cachedData;
};
