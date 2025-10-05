import { WorkOrderTemplate } from '@/types';

const generateId = (prefix: string, index: number) => `${prefix}-${String(index).padStart(4, '0')}`;

export const generateWorkOrderTemplates = (stationIds: string[], materialIds: string[]): WorkOrderTemplate[] => {
  const templates: WorkOrderTemplate[] = [];

  // Template 1: 9mm FMJ Production (Simple Linear Flow)
  templates.push({
    id: generateId('tpl', 0),
    name: '9mm FMJ 115gr Ammunition',
    description: 'Standard 9mm full metal jacket rounds, 115 grain',
    flow: {
      nodes: [
        { id: 'node-1', type: 'station', stationId: stationIds[0], position: { x: 100, y: 100 }, data: { label: 'Case Cleaning' } },
        { id: 'node-2', type: 'station', stationId: stationIds[1], position: { x: 300, y: 100 }, data: { label: 'Case Inspection' } },
        { id: 'node-3', type: 'station', stationId: stationIds[2], position: { x: 500, y: 100 }, data: { label: 'Decapping' } },
        { id: 'node-4', type: 'station', stationId: stationIds[3], position: { x: 700, y: 100 }, data: { label: 'Case Sizing' } },
        { id: 'node-5', type: 'station', stationId: stationIds[4], position: { x: 900, y: 100 }, data: { label: 'Priming', materials: [{ materialId: materialIds[60], quantity: 1 }] } },
        { id: 'node-6', type: 'station', stationId: stationIds[5], position: { x: 1100, y: 100 }, data: { label: 'Powder Charging', materials: [{ materialId: materialIds[40], quantity: 5 }] } },
        { id: 'node-7', type: 'station', stationId: stationIds[6], position: { x: 1300, y: 100 }, data: { label: 'Bullet Seating', materials: [{ materialId: materialIds[20], quantity: 1 }] } },
        { id: 'node-8', type: 'station', stationId: stationIds[7], position: { x: 1500, y: 100 }, data: { label: 'Crimping' } },
        { id: 'node-9', type: 'station', stationId: stationIds[9], position: { x: 1700, y: 100 }, data: { label: 'Quality Testing (Final)' } },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
        { id: 'edge-3', source: 'node-3', target: 'node-4' },
        { id: 'edge-4', source: 'node-4', target: 'node-5' },
        { id: 'edge-5', source: 'node-5', target: 'node-6' },
        { id: 'edge-6', source: 'node-6', target: 'node-7' },
        { id: 'edge-7', source: 'node-7', target: 'node-8' },
        { id: 'edge-8', source: 'node-8', target: 'node-9' },
      ],
    },
    estimatedCost: 0.35,
    createdAt: new Date(2024, 0, 15).toISOString(),
  });

  // Template 2: .223 Rem Production (with parallel packaging)
  templates.push({
    id: generateId('tpl', 1),
    name: '.223 Remington 55gr',
    description: '.223 Remington ammunition with 55 grain bullets',
    flow: {
      nodes: [
        { id: 'node-1', type: 'station', stationId: stationIds[14], position: { x: 100, y: 200 }, data: { label: 'Batch Preparation' } },
        { id: 'node-2', type: 'station', stationId: stationIds[0], position: { x: 300, y: 200 }, data: { label: 'Case Cleaning' } },
        { id: 'node-3', type: 'station', stationId: stationIds[2], position: { x: 500, y: 200 }, data: { label: 'Decapping' } },
        { id: 'node-4', type: 'station', stationId: stationIds[3], position: { x: 700, y: 200 }, data: { label: 'Case Sizing' } },
        { id: 'node-5', type: 'station', stationId: stationIds[4], position: { x: 900, y: 200 }, data: { label: 'Priming', materials: [{ materialId: materialIds[61], quantity: 1 }] } },
        { id: 'node-6', type: 'station', stationId: stationIds[5], position: { x: 1100, y: 200 }, data: { label: 'Powder Charging', materials: [{ materialId: materialIds[41], quantity: 25 }] } },
        { id: 'node-7', type: 'station', stationId: stationIds[6], position: { x: 1300, y: 200 }, data: { label: 'Bullet Seating', materials: [{ materialId: materialIds[21], quantity: 1 }] } },
        { id: 'node-8', type: 'split', position: { x: 1500, y: 200 }, data: { label: 'Split for QC & Packaging' } },
        { id: 'node-9', type: 'station', stationId: stationIds[9], position: { x: 1700, y: 100 }, data: { label: 'Quality Testing' } },
        { id: 'node-10', type: 'station', stationId: stationIds[10], position: { x: 1700, y: 300 }, data: { label: 'Packaging', materials: [{ materialId: materialIds[80], quantity: 0.02 }] } },
        { id: 'node-11', type: 'merge', position: { x: 1900, y: 200 }, data: { label: 'Final Merge' } },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
        { id: 'edge-3', source: 'node-3', target: 'node-4' },
        { id: 'edge-4', source: 'node-4', target: 'node-5' },
        { id: 'edge-5', source: 'node-5', target: 'node-6' },
        { id: 'edge-6', source: 'node-6', target: 'node-7' },
        { id: 'edge-7', source: 'node-7', target: 'node-8' },
        { id: 'edge-8', source: 'node-8', target: 'node-9' },
        { id: 'edge-9', source: 'node-8', target: 'node-10' },
        { id: 'edge-10', source: 'node-9', target: 'node-11' },
        { id: 'edge-11', source: 'node-10', target: 'node-11' },
      ],
    },
    estimatedCost: 0.42,
    createdAt: new Date(2024, 1, 1).toISOString(),
  });

  // Template 3: .45 ACP Production
  templates.push({
    id: generateId('tpl', 2),
    name: '.45 ACP 230gr JHP',
    description: '.45 ACP jacketed hollow point, 230 grain - Premium defensive rounds',
    flow: {
      nodes: [
        { id: 'node-1', type: 'station', stationId: stationIds[0], position: { x: 100, y: 100 }, data: { label: 'Case Cleaning' } },
        { id: 'node-2', type: 'station', stationId: stationIds[1], position: { x: 300, y: 100 }, data: { label: 'Case Inspection' } },
        { id: 'node-3', type: 'station', stationId: stationIds[2], position: { x: 500, y: 100 }, data: { label: 'Decapping' } },
        { id: 'node-4', type: 'station', stationId: stationIds[4], position: { x: 700, y: 100 }, data: { label: 'Priming', materials: [{ materialId: materialIds[63], quantity: 1 }] } },
        { id: 'node-5', type: 'station', stationId: stationIds[5], position: { x: 900, y: 100 }, data: { label: 'Powder Charging', materials: [{ materialId: materialIds[42], quantity: 7 }] } },
        { id: 'node-6', type: 'station', stationId: stationIds[6], position: { x: 1100, y: 100 }, data: { label: 'Bullet Seating', materials: [{ materialId: materialIds[23], quantity: 1 }] } },
        { id: 'node-7', type: 'station', stationId: stationIds[9], position: { x: 1300, y: 100 }, data: { label: 'Quality Testing (Final)' } },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
        { id: 'edge-3', source: 'node-3', target: 'node-4' },
        { id: 'edge-4', source: 'node-4', target: 'node-5' },
        { id: 'edge-5', source: 'node-5', target: 'node-6' },
        { id: 'edge-6', source: 'node-6', target: 'node-7' },
      ],
    },
    estimatedCost: 0.55,
    createdAt: new Date(2024, 1, 15).toISOString(),
  });

  // Add 7 more templates to make 10 total
  const additionalTemplateNames = [
    '.308 Winchester 168gr Match',
    '7.62x39mm 123gr FMJ',
    '.357 Magnum 158gr JSP',
    '.40 S&W 180gr FMJ',
    '5.56 NATO 62gr Green Tip',
    '.38 Special 130gr FMJ',
    '10mm Auto 180gr JHP'
  ];

  additionalTemplateNames.forEach((name, idx) => {
    templates.push({
      id: generateId('tpl', idx + 3),
      name,
      description: `Production template for ${name}`,
      flow: {
        nodes: [
          { id: 'node-1', type: 'station', stationId: stationIds[0], position: { x: 100, y: 100 }, data: { label: 'Case Cleaning' } },
          { id: 'node-2', type: 'station', stationId: stationIds[2], position: { x: 300, y: 100 }, data: { label: 'Decapping' } },
          { id: 'node-3', type: 'station', stationId: stationIds[4], position: { x: 500, y: 100 }, data: { label: 'Priming' } },
          { id: 'node-4', type: 'station', stationId: stationIds[5], position: { x: 700, y: 100 }, data: { label: 'Powder Charging' } },
          { id: 'node-5', type: 'station', stationId: stationIds[6], position: { x: 900, y: 100 }, data: { label: 'Bullet Seating' } },
          { id: 'node-6', type: 'station', stationId: stationIds[9], position: { x: 1100, y: 100 }, data: { label: 'Quality Testing (Final)' } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
          { id: 'edge-2', source: 'node-2', target: 'node-3' },
          { id: 'edge-3', source: 'node-3', target: 'node-4' },
          { id: 'edge-4', source: 'node-4', target: 'node-5' },
          { id: 'edge-5', source: 'node-5', target: 'node-6' },
        ],
      },
      estimatedCost: 0.40 + (idx * 0.05),
      createdAt: new Date(2024, 2 + idx, 1).toISOString(),
    });
  });

  return templates;
};
