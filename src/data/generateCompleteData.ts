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

  // More realistic distribution: 10% requested, 15% approved, 20% in_progress, 50% finished, 5% rejected, 0% cancelled
  const statusWeights = [
    { status: 'requested' as const, weight: 10, count: 0 },
    { status: 'approved' as const, weight: 15, count: 0 },
    { status: 'in_progress' as const, weight: 20, count: 0 },
    { status: 'finished' as const, weight: 50, count: 0 },
    { status: 'rejected' as const, weight: 5, count: 0 },
  ];

  const totalOrders = 150; // Increased from 100

  // Calculate target counts
  statusWeights.forEach(sw => {
    sw.count = Math.floor((sw.weight / 100) * totalOrders);
  });

  // Generate orders by status to ensure proper distribution
  let orderIndex = 0;
  statusWeights.forEach(({ status, count }) => {
    for (let i = 0; i < count; i++) {
      const template = templates[orderIndex % templates.length];
      const requestedDate = getRandomDate(new Date(2024, 0, 1), new Date());
      const quantity = 500 + Math.floor(Math.random() * 4500); // 500-5000 rounds

      const workOrder: WorkOrder = {
        id: generateId('wo', orderIndex),
        orderNumber: `WO-${String(orderIndex + 1).padStart(3, '0')}`,
        templateId: template.id,
        customerId: customerIds[orderIndex % customerIds.length],
        salesPersonId: salesPersonIds[orderIndex % salesPersonIds.length],
        status,
        currentStations: status === 'in_progress' ? [template.flow.nodes[Math.floor(Math.random() * 3)].stationId || ''] : [],
        stationHistory: [],
        estimatedPrice: template.estimatedCost * quantity,
        requestedAt: formatDate(requestedDate),
        activeFlowPositions: status === 'in_progress' ? [template.flow.nodes[Math.floor(Math.random() * template.flow.nodes.length)].id] : [],
      };

      if (status === 'approved' || status === 'in_progress' || status === 'finished') {
        const approvalDelay = 3600000 + Math.random() * 82800000; // 1-24 hours
        workOrder.approvedAt = formatDate(new Date(requestedDate.getTime() + approvalDelay));
        workOrder.approvedBy = ownerIds[orderIndex % ownerIds.length];
      }

      if (status === 'rejected') {
        const rejectionDelay = 3600000 + Math.random() * 172800000; // 1-48 hours
        workOrder.rejectedAt = formatDate(new Date(requestedDate.getTime() + rejectionDelay));
        workOrder.rejectedBy = ownerIds[orderIndex % ownerIds.length];
        const reasons = [
          'Insufficient materials in stock',
          'Customer credit check failed',
          'Template requires safety review',
          'Quantity exceeds production capacity',
          'Customer requested cancellation',
        ];
        workOrder.rejectionReason = reasons[orderIndex % reasons.length];
      }

      if (status === 'in_progress') {
        // Add some station history for in-progress orders
        const completedStations = Math.floor(Math.random() * (template.flow.nodes.length / 2));
        workOrder.stationHistory = [];
        for (let j = 0; j < completedStations; j++) {
          const node = template.flow.nodes[j];
          if (node.stationId) {
            workOrder.stationHistory.push({
              stationId: node.stationId,
              startedAt: formatDate(new Date(requestedDate.getTime() + (j * 3600000))),
              completedAt: formatDate(new Date(requestedDate.getTime() + ((j + 1) * 3600000))),
              operatorId: `opr-${String(Math.floor(Math.random() * 5)).padStart(4, '0')}`,
            });
          }
        }
      }

      if (status === 'finished') {
        const completionTime = 86400000 + Math.random() * 259200000; // 1-4 days
        workOrder.finishedAt = formatDate(new Date(requestedDate.getTime() + completionTime));
        workOrder.actualPrice = workOrder.estimatedPrice * (0.95 + Math.random() * 0.15); // -5% to +10% variance

        // Add complete station history
        workOrder.stationHistory = template.flow.nodes
          .filter(node => node.stationId)
          .map((node, idx) => ({
            stationId: node.stationId!,
            startedAt: formatDate(new Date(requestedDate.getTime() + (idx * 7200000))),
            completedAt: formatDate(new Date(requestedDate.getTime() + ((idx + 1) * 7200000))),
            operatorId: `opr-${String(Math.floor(Math.random() * 10)).padStart(4, '0')}`,
          }));
      }

      workOrders.push(workOrder);
      orderIndex++;
    }
  });

  // Sort by requested date (most recent first)
  return workOrders.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
};

export const generateInvoices = (workOrders: WorkOrder[], customerIds: string[]): Invoice[] => {
  const invoices: Invoice[] = [];
  const finishedOrders = workOrders.filter(wo => wo.status === 'finished');

  finishedOrders.forEach((wo, i) => {
    const issuedDate = new Date(wo.finishedAt!);
    // 70% paid, 30% unpaid - more realistic for manufacturing
    const isPaid = Math.random() > 0.3;

    // Payment terms: NET 30 days
    const dueDate = new Date(issuedDate.getTime() + 2592000000); // 30 days
    const daysSinceIssued = (new Date().getTime() - issuedDate.getTime()) / 86400000;

    const invoice: Invoice = {
      id: generateId('inv', i),
      invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
      workOrderId: wo.id,
      customerId: wo.customerId,
      amount: wo.actualPrice || wo.estimatedPrice,
      status: isPaid ? 'paid' : 'unpaid',
      issuedAt: formatDate(issuedDate),
      dueDate: formatDate(dueDate),
    };

    if (isPaid) {
      // Paid invoices: most paid within 30 days, some early, some late
      const paymentDelay = Math.random() < 0.7
        ? Math.random() * 2592000000 // 0-30 days (70% of paid invoices)
        : 2592000000 + Math.random() * 1296000000; // 30-45 days (30% paid late)

      const paidDate = new Date(issuedDate.getTime() + paymentDelay);
      // Only set paidAt if the payment date is in the past
      if (paidDate.getTime() < new Date().getTime()) {
        invoice.paidAt = formatDate(paidDate);
      }
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
    const daysSinceFinished = (new Date().getTime() - createdDate.getTime()) / 86400000;

    // Realistic status distribution based on time since completion
    let status: Shipment['deliveryStatus'];
    if (daysSinceFinished < 1) {
      status = 'label_created'; // Just finished, label created
    } else if (daysSinceFinished < 3) {
      status = Math.random() > 0.3 ? 'shipped' : 'label_created'; // 70% shipped after 1 day
    } else {
      status = Math.random() > 0.2 ? 'delivered' : 'shipped'; // 80% delivered after 3 days
    }

    // Generate realistic shipping address
    const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
    const cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Philadelphia', 'Chicago', 'Columbus', 'Atlanta', 'Charlotte', 'Detroit'];
    const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Washington Blvd', 'Commerce Dr', 'Industrial Way'];

    const randomIndex = i % states.length;
    const shippingAddress = customer?.type === 'business' && customer.address
      ? customer.address
      : `${Math.floor(Math.random() * 9000) + 1000} ${streetNames[i % streetNames.length]}, ${cities[randomIndex]}, ${states[randomIndex]} ${String(Math.floor(Math.random() * 90000) + 10000)}`;

    const shipment: Shipment = {
      id: generateId('ship', i),
      trackingNumber: `1Z999AA1${String(i + 1).padStart(8, '0')}`, // UPS-style tracking number
      workOrderId: wo.id,
      customerId: wo.customerId,
      deliveryStatus: status,
      createdAt: formatDate(createdDate),
      shippingAddress,
    };

    if (status === 'shipped' || status === 'delivered') {
      // Ship 1-2 days after completion
      const shipDelay = 86400000 + Math.random() * 86400000; // 1-2 days
      shipment.shippedAt = formatDate(new Date(createdDate.getTime() + shipDelay));
    }

    if (status === 'delivered') {
      // Deliver 2-5 days after shipping
      const deliveryDelay = 172800000 + Math.random() * 259200000; // 2-5 days
      const shippedTime = new Date(shipment.shippedAt!).getTime();
      shipment.deliveredAt = formatDate(new Date(shippedTime + deliveryDelay));
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
