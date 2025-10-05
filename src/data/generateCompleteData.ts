import { WorkOrder, Invoice, Shipment, Transaction, WorkOrderTemplate, Customer } from '@/types';

const generateId = (prefix: string, index: number) => `${prefix}-${String(index).padStart(4, '0')}`;

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDate = (date: Date) => date.toISOString();

export const generateWorkOrders = (
  templates: WorkOrderTemplate[],
  customerIds: string[],
  salesPersonIds: string[],
  ownerIds: string[]
): WorkOrder[] => {
  const workOrders: WorkOrder[] = [];
  const statuses: WorkOrder['status'][] = ['requested', 'approved', 'in_progress', 'finished', 'rejected'];

  for (let i = 0; i < 100; i++) {
    const template = templates[i % templates.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const requestedDate = getRandomDate(new Date(2024, 0, 1), new Date());

    const workOrder: WorkOrder = {
      id: generateId('wo', i),
      orderNumber: `WO-${2024}-${String(i + 1).padStart(5, '0')}`,
      templateId: template.id,
      customerId: customerIds[i % customerIds.length],
      salesPersonId: salesPersonIds[i % salesPersonIds.length],
      status,
      currentStations: status === 'in_progress' ? [template.flow.nodes[Math.floor(Math.random() * 3)].stationId || ''] : [],
      stationHistory: [],
      estimatedPrice: template.estimatedCost * (1000 + Math.floor(Math.random() * 4000)),
      requestedAt: formatDate(requestedDate),
      activeFlowPositions: status === 'in_progress' ? [template.flow.nodes[0].id] : [],
    };

    if (status === 'approved' || status === 'in_progress' || status === 'finished') {
      workOrder.approvedAt = formatDate(new Date(requestedDate.getTime() + 86400000));
      workOrder.approvedBy = ownerIds[i % ownerIds.length];
    }

    if (status === 'rejected') {
      workOrder.rejectedAt = formatDate(new Date(requestedDate.getTime() + 86400000));
      workOrder.rejectedBy = ownerIds[i % ownerIds.length];
      workOrder.rejectionReason = ['Insufficient materials', 'Customer credit issue', 'Template needs revision'][i % 3];
    }

    if (status === 'finished') {
      workOrder.finishedAt = formatDate(new Date(requestedDate.getTime() + 172800000));
      workOrder.actualPrice = workOrder.estimatedPrice * (0.95 + Math.random() * 0.1);
    }

    workOrders.push(workOrder);
  }

  return workOrders;
};

export const generateInvoices = (workOrders: WorkOrder[], customerIds: string[]): Invoice[] => {
  const invoices: Invoice[] = [];
  const finishedOrders = workOrders.filter(wo => wo.status === 'finished');

  finishedOrders.forEach((wo, i) => {
    const issuedDate = new Date(wo.finishedAt!);
    const isPaid = Math.random() > 0.3;

    const invoice: Invoice = {
      id: generateId('inv', i),
      invoiceNumber: `INV-${2024}-${String(i + 1).padStart(5, '0')}`,
      workOrderId: wo.id,
      customerId: wo.customerId,
      amount: wo.actualPrice || wo.estimatedPrice,
      status: isPaid ? 'paid' : 'unpaid',
      issuedAt: formatDate(issuedDate),
      dueDate: formatDate(new Date(issuedDate.getTime() + 2592000000)), // 30 days
    };

    if (isPaid) {
      invoice.paidAt = formatDate(new Date(issuedDate.getTime() + Math.random() * 2592000000));
    }

    invoices.push(invoice);
  });

  return invoices;
};

export const generateShipments = (workOrders: WorkOrder[], customerIds: string[], customers: Customer[]): Shipment[] => {
  const shipments: Shipment[] = [];
  const finishedOrders = workOrders.filter(wo => wo.status === 'finished');

  finishedOrders.forEach((wo, i) => {
    const customer = customers.find(c => c.id === wo.customerId);
    const createdDate = new Date(wo.finishedAt!);
    const statuses: Shipment['deliveryStatus'][] = ['label_created', 'shipped', 'delivered'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const shipment: Shipment = {
      id: generateId('ship', i),
      trackingNumber: `TRK${String(i + 1).padStart(10, '0')}`,
      workOrderId: wo.id,
      customerId: wo.customerId,
      deliveryStatus: status,
      createdAt: formatDate(createdDate),
      shippingAddress: customer?.type === 'business' ? customer.address : `${Math.floor(Math.random() * 9000) + 1000} Main St, City, ST 12345`,
    };

    if (status === 'shipped' || status === 'delivered') {
      shipment.shippedAt = formatDate(new Date(createdDate.getTime() + 86400000));
    }

    if (status === 'delivered') {
      shipment.deliveredAt = formatDate(new Date(createdDate.getTime() + 259200000));
    }

    shipments.push(shipment);
  });

  return shipments;
};

export const generateTransactions = (
  workOrders: WorkOrder[],
  invoices: Invoice[],
  shipments: Shipment[],
  personnelIds: string[]
): Transaction[] => {
  const transactions: Transaction[] = [];
  let txId = 0;

  // Work order transactions
  workOrders.forEach(wo => {
    transactions.push({
      id: generateId('txn', txId++),
      timestamp: wo.requestedAt,
      userId: wo.salesPersonId,
      userRole: 'salesperson',
      objectType: 'workorder',
      objectId: wo.id,
      action: 'create',
      description: `Created work order ${wo.orderNumber}`,
    });

    if (wo.approvedAt && wo.approvedBy) {
      transactions.push({
        id: generateId('txn', txId++),
        timestamp: wo.approvedAt,
        userId: wo.approvedBy,
        userRole: 'owner',
        objectType: 'workorder',
        objectId: wo.id,
        action: 'approve',
        description: `Approved work order ${wo.orderNumber}`,
      });
    }

    if (wo.rejectedAt && wo.rejectedBy) {
      transactions.push({
        id: generateId('txn', txId++),
        timestamp: wo.rejectedAt,
        userId: wo.rejectedBy,
        userRole: 'owner',
        objectType: 'workorder',
        objectId: wo.id,
        action: 'reject',
        description: `Rejected work order ${wo.orderNumber}: ${wo.rejectionReason}`,
      });
    }
  });

  // Invoice transactions
  invoices.forEach(inv => {
    transactions.push({
      id: generateId('txn', txId++),
      timestamp: inv.issuedAt,
      userId: personnelIds[0],
      userRole: 'owner',
      objectType: 'invoice',
      objectId: inv.id,
      action: 'create',
      description: `Generated invoice ${inv.invoiceNumber}`,
    });

    if (inv.paidAt) {
      transactions.push({
        id: generateId('txn', txId++),
        timestamp: inv.paidAt,
        userId: personnelIds[0],
        userRole: 'owner',
        objectType: 'invoice',
        objectId: inv.id,
        action: 'update',
        description: `Marked invoice ${inv.invoiceNumber} as paid`,
      });
    }
  });

  // Shipment transactions
  shipments.forEach(ship => {
    transactions.push({
      id: generateId('txn', txId++),
      timestamp: ship.createdAt,
      userId: personnelIds[0],
      userRole: 'owner',
      objectType: 'shipment',
      objectId: ship.id,
      action: 'create',
      description: `Created shipment ${ship.trackingNumber}`,
    });
  });

  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
