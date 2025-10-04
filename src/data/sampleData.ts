import {
  Owner,
  SalesPerson,
  Operator,
  BusinessCustomer,
  IndividualCustomer,
  Material,
  Station,
  WorkOrderTemplate,
  WorkOrder,
  Invoice,
  Shipment,
  Transaction,
  Personnel,
  Customer,
} from '@/types';

// Helper to generate IDs
const generateId = (prefix: string, index: number) => `${prefix}-${String(index).padStart(4, '0')}`;

// Helper for dates
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDate = (date: Date) => date.toISOString();

// Generate Owners
export const generateOwners = (): Owner[] => {
  const firstNames = ['John', 'Sarah', 'Michael'];
  const lastNames = ['Smith', 'Johnson', 'Williams'];

  return firstNames.map((firstName, i) => ({
    id: generateId('own', i),
    firstName,
    lastName: lastNames[i],
    email: `${firstName.toLowerCase()}.${lastNames[i].toLowerCase()}@contour.com`,
    role: 'owner' as const,
  }));
};

// Generate Sales People (20)
export const generateSalesPeople = (): SalesPerson[] => {
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
    'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'];
  const lastNames = ['Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
    'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee'];

  return firstNames.map((firstName, i) => ({
    id: generateId('sp', i),
    firstName,
    lastName: lastNames[i],
    email: `${firstName.toLowerCase()}.${lastNames[i].toLowerCase()}@contour.com`,
    role: 'salesperson' as const,
  }));
};

// Generate Operators (77 to make 100 total personnel)
export const generateOperators = (): Operator[] => {
  const firstNames = ['Carlos', 'David', 'Frank', 'George', 'Ivan', 'Jack', 'Kevin', 'Larry', 'Mike', 'Nathan',
    'Oscar', 'Paul', 'Quinn', 'Robert', 'Steve', 'Tom', 'Victor', 'Walter', 'Xavier', 'Yusuf',
    'Aaron', 'Brian', 'Chris', 'Daniel', 'Eric', 'Fred', 'Greg', 'Harold', 'Isaac', 'Justin',
    'Keith', 'Leon', 'Marcus', 'Neil', 'Oliver', 'Peter', 'Raymond', 'Samuel', 'Timothy', 'Vincent',
    'Wesley', 'Andre', 'Bruno', 'Claude', 'Diego', 'Edgar', 'Felix', 'Grant', 'Hugo', 'Ian',
    'Joel', 'Kyle', 'Luis', 'Manuel', 'Nicolas', 'Otto', 'Pablo', 'Rafael', 'Simon', 'Theo',
    'Ulysses', 'Vince', 'Wade', 'Xander', 'Yale', 'Zach', 'Alan', 'Blake', 'Colin', 'Dean',
    'Evan', 'Flynn', 'Glenn', 'Hank', 'Ivan', 'Jake', 'Kurt'];
  const lastNames = ['Baker', 'Carter', 'Cooper', 'Evans', 'Fisher', 'Gray', 'Hayes', 'Hughes', 'King', 'Morris',
    'Nelson', 'Parker', 'Reed', 'Ross', 'Scott', 'Turner', 'Ward', 'Wood', 'Young', 'Allen',
    'Bell', 'Brooks', 'Cook', 'Cox', 'Cruz', 'Diaz', 'Ellis', 'Ford', 'Green', 'Hall',
    'Hill', 'James', 'Kelly', 'Long', 'Morgan', 'Myers', 'Perry', 'Powell', 'Price', 'Ramirez',
    'Reyes', 'Rivera', 'Rogers', 'Russell', 'Sanchez', 'Sanders', 'Shaw', 'Silva', 'Stone', 'Torres',
    'Wagner', 'Walsh', 'Webb', 'Wells', 'West', 'Armstrong', 'Barrett', 'Bennett', 'Bishop', 'Black',
    'Boyd', 'Bradley', 'Bryant', 'Burke', 'Burns', 'Butler', 'Campbell', 'Carroll', 'Chapman', 'Coleman',
    'Collins', 'Crawford', 'Curtis', 'Dixon', 'Duncan', 'Edwards', 'Elliott'];

  const badges = [
    { id: 'badge-001', name: 'Speed Demon', description: 'Completed 10 orders under estimated time', icon: '⚡', earnedAt: '' },
    { id: 'badge-002', name: 'Perfectionist', description: '100% accuracy for 50 orders', icon: '🎯', earnedAt: '' },
    { id: 'badge-003', name: 'Century Club', description: 'Completed 100 orders', icon: '💯', earnedAt: '' },
    { id: 'badge-004', name: 'Hot Streak', description: '10 day work streak', icon: '🔥', earnedAt: '' },
  ];

  return firstNames.map((firstName, i) => ({
    id: generateId('op', i),
    firstName,
    lastName: lastNames[i],
    email: `${firstName.toLowerCase()}.${lastNames[i].toLowerCase()}@contour.com`,
    role: 'operator' as const,
    qrCode: `QR-${generateId('op', i)}`,
    currentStation: i < 20 ? generateId('st', i % 10) : null,
    isLoggedIn: i < 20,
    lastLoginTime: i < 20 ? formatDate(new Date(Date.now() - Math.random() * 28800000)) : null,
    stats: {
      totalOrders: Math.floor(Math.random() * 500) + 50,
      accuracy: Math.floor(Math.random() * 20) + 80,
      avgTimePerOrder: Math.floor(Math.random() * 60) + 30,
      currentStreak: Math.floor(Math.random() * 30),
      badges: i < 30 ? badges.slice(0, Math.floor(Math.random() * 4)).map(b => ({
        ...b,
        earnedAt: formatDate(getRandomDate(new Date(2024, 0, 1), new Date()))
      })) : [],
    },
  }));
};

// Generate Business Customers (60)
export const generateBusinessCustomers = (): BusinessCustomer[] => {
  const companies = [
    'Precision Defense Systems', 'Tactical Solutions Inc', 'SecureArms Corp', 'Elite Munitions Ltd',
    'Frontier Armory', 'Apex Defense Group', 'Guardian Security Systems', 'Sentinel Arms Co',
    'Patriot Manufacturing', 'Liberty Defense Corp', 'Eagle Eye Tactical', 'Iron Mountain Arsenal',
    'Vanguard Security Solutions', 'Fortress Defense Systems', 'Ranger Tactical Group',
    'Titan Arms Corporation', 'Summit Defense Industries', 'Pinnacle Security Ltd', 'Nexus Armory',
    'Prime Tactical Solutions', 'Omega Defense Systems', 'Atlas Security Corp', 'Spartan Arms Inc',
    'Centurion Defense Group', 'Triumph Tactical Ltd', 'Victory Defense Systems', 'Crown Security Co',
    'Imperial Arms Corp', 'Royal Defense Industries', 'Sterling Tactical Group', 'Prestige Armory',
    'Elite Guard Systems', 'Prime Security Solutions', 'Apex Tactical Corp', 'Summit Arms Ltd',
    'Pinnacle Defense Group', 'Frontier Security Inc', 'Vanguard Arms Co', 'Guardian Tactical Systems',
    'Sentinel Defense Corp', 'Liberty Security Group', 'Patriot Arms Ltd', 'Eagle Tactical Inc',
    'Iron Defense Systems', 'Mountain Security Co', 'Fortress Arms Corp', 'Ranger Defense Group',
    'Titan Tactical Ltd', 'Summit Security Systems', 'Nexus Defense Inc', 'Prime Arms Co',
    'Omega Tactical Corp', 'Atlas Defense Group', 'Spartan Security Ltd', 'Centurion Arms Inc',
    'Triumph Defense Systems', 'Victory Tactical Co', 'Crown Arms Corp', 'Imperial Security Group',
    'Royal Tactical Ltd', 'Sterling Defense Inc'
  ];

  const streets = ['Main St', 'Oak Ave', 'Industrial Blvd', 'Commerce Dr', 'Business Park Way'];
  const cities = ['Dallas', 'Houston', 'Phoenix', 'Atlanta', 'Denver', 'Nashville', 'Austin', 'Charlotte', 'San Antonio', 'Jacksonville'];
  const contactFirstNames = ['Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Patricia', 'Richard', 'Barbara', 'Joseph', 'Elizabeth'];
  const contactLastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'];

  return companies.map((company, i) => ({
    id: generateId('bc', i),
    type: 'business' as const,
    name: company,
    address: `${Math.floor(Math.random() * 9000) + 1000} ${streets[i % streets.length]}, ${cities[i % cities.length]}, TX ${75000 + i}`,
    contactPersonName: `${contactFirstNames[i % contactFirstNames.length]} ${contactLastNames[i % contactLastNames.length]}`,
    contactPersonPhone: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    contactPersonEmail: `${contactFirstNames[i % contactFirstNames.length].toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
    createdAt: formatDate(getRandomDate(new Date(2023, 0, 1), new Date())),
  }));
};

// Generate Individual Customers (40)
export const generateIndividualCustomers = (): IndividualCustomer[] => {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
    'Ian', 'Julia', 'Kevin', 'Laura', 'Mark', 'Nancy', 'Owen', 'Paula', 'Quincy', 'Rachel',
    'Sam', 'Teresa', 'Uma', 'Victor', 'Wendy', 'Xander', 'Yvonne', 'Zachary', 'Arthur', 'Betty',
    'Carl', 'Donna', 'Eugene', 'Frances', 'Gary', 'Helen', 'Irene', 'Jerry', 'Karen', 'Leo'];
  const lastNames = ['Anderson', 'Baker', 'Clark', 'Davis', 'Evans', 'Foster', 'Green', 'Harris', 'Irving', 'Jackson',
    'Kelly', 'Lewis', 'Mason', 'Nelson', 'O\'Brien', 'Palmer', 'Quinn', 'Roberts', 'Stevens', 'Taylor',
    'Underwood', 'Vincent', 'Walker', 'Xavier', 'Young', 'Zhang', 'Abbott', 'Barnes', 'Collins', 'Drake',
    'Ellis', 'Fletcher', 'Gibson', 'Hayes', 'Ingram', 'Jenkins', 'Knight', 'Lopez', 'Murray', 'Norton'];

  return firstNames.map((firstName, i) => ({
    id: generateId('ic', i),
    type: 'individual' as const,
    name: `${firstName} ${lastNames[i]}`,
    phone: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    email: `${firstName.toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
    createdAt: formatDate(getRandomDate(new Date(2023, 0, 1), new Date())),
  }));
};

// Generate Materials (100)
export const generateMaterials = (): Material[] => {
  const materials = [
    // Brass and metal components
    ...Array.from({ length: 20 }, (_, i) => ({
      partName: `Brass Casing ${['.223', '.308', '9mm', '.45 ACP', '.357 Mag', '7.62mm', '5.56mm', '.40 S&W', '.38 Special', '10mm'][i % 10]}`,
      unitOfMeasurement: 'pieces',
      source: ['Precision Brass Co', 'Metal Works Inc', 'Brass Masters Ltd'][i % 3],
      basePrice: 0.15 + (i * 0.05),
    })),
    // Bullets/Projectiles
    ...Array.from({ length: 20 }, (_, i) => ({
      partName: `${['FMJ', 'HP', 'SP', 'JHP', 'TMJ'][i % 5]} Bullet ${[55, 62, 75, 115, 124, 147, 158, 180, 200, 230][i % 10]}gr`,
      unitOfMeasurement: 'pieces',
      source: ['Projectile Pros', 'Bullet Craft Inc', 'Lead Leaders Ltd'][i % 3],
      basePrice: 0.10 + (i * 0.03),
    })),
    // Powder
    ...Array.from({ length: 15 }, (_, i) => ({
      partName: `${['Fast', 'Medium', 'Slow'][i % 3]} Burn Powder Type ${String.fromCharCode(65 + i)}`,
      unitOfMeasurement: 'grams',
      source: ['Powder Dynamics', 'Propellant Plus', 'Burn Rate Co'][i % 3],
      basePrice: 0.02 + (i * 0.005),
    })),
    // Primers
    ...Array.from({ length: 15 }, (_, i) => ({
      partName: `${['Small', 'Large'][i % 2]} ${['Pistol', 'Rifle', 'Magnum'][Math.floor(i / 2) % 3]} Primer`,
      unitOfMeasurement: 'pieces',
      source: ['Primer Precision', 'Ignition Systems Inc', 'Spark Tech Ltd'][i % 3],
      basePrice: 0.05 + (i * 0.01),
    })),
    // Packaging materials
    ...Array.from({ length: 10 }, (_, i) => ({
      partName: `${['Cardboard', 'Plastic', 'Metal'][i % 3]} Ammo Box ${[20, 50, 100, 250, 500][i % 5]}-round`,
      unitOfMeasurement: 'boxes',
      source: ['Package Solutions', 'Box Makers Inc', 'Container Corp'][i % 3],
      basePrice: 0.50 + (i * 0.25),
    })),
    // Lubricants and chemicals
    ...Array.from({ length: 10 }, (_, i) => ({
      partName: `${['Case', 'Bullet', 'Die'][i % 3]} Lubricant ${i + 1}`,
      unitOfMeasurement: 'ml',
      source: ['Chem Solutions', 'Lube Tech', 'Fluid Dynamics'][i % 3],
      basePrice: 0.01 + (i * 0.005),
    })),
    // Quality control materials
    ...Array.from({ length: 10 }, (_, i) => ({
      partName: `QC ${['Gauge', 'Caliper', 'Scale', 'Tester', 'Meter'][i % 5]} Calibration Set ${i + 1}`,
      unitOfMeasurement: 'sets',
      source: ['Precision Tools Inc', 'QC Masters', 'Measurement Co'][i % 3],
      basePrice: 10.00 + (i * 2),
    })),
  ];

  return materials.map((material, i) => ({
    id: generateId('mat', i),
    partName: material.partName,
    unitOfMeasurement: material.unitOfMeasurement,
    quantityInStock: Math.floor(Math.random() * 10000) + 1000,
    minimumQuantity: i < 80 ? Math.floor(Math.random() * 500) + 100 : undefined,
    pricePerUnit: Math.round(material.basePrice * 100) / 100,
    source: material.source,
    createdAt: formatDate(getRandomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
  }));
};

// Generate Stations (15)
export const generateStations = (): Station[] => {
  const stations = [
    { name: 'Case Cleaning', description: 'Clean and prepare brass casings for reloading' },
    { name: 'Case Inspection', description: 'Visual and measurement inspection of cases' },
    { name: 'Decapping', description: 'Remove spent primers from cases' },
    { name: 'Case Sizing', description: 'Resize cases to proper dimensions' },
    { name: 'Priming', description: 'Insert new primers into cases' },
    { name: 'Powder Charging', description: 'Measure and add powder to cases' },
    { name: 'Bullet Seating', description: 'Seat bullets to proper depth' },
    { name: 'Crimping', description: 'Apply crimp to secure bullet' },
    { name: 'Final Inspection', description: 'Visual inspection of completed rounds' },
    { name: 'Quality Testing', description: 'Test rounds for quality and safety - FINAL STATION' },
    { name: 'Packaging', description: 'Package ammunition in boxes' },
    { name: 'Labeling', description: 'Apply labels and lot numbers' },
    { name: 'Inventory Storage', description: 'Store completed products in inventory' },
    { name: 'Assembly Prep', description: 'Prepare components for assembly' },
    { name: 'Batch Preparation', description: 'Prepare materials in batches' },
  ];

  return stations.map((station, i) => ({
    id: generateId('st', i),
    name: station.name,
    description: station.description,
    createdAt: formatDate(getRandomDate(new Date(2023, 0, 1), new Date(2023, 6, 1))),
  }));
};

// This is a simplified version - the full implementation would have all 100 records
// For brevity, I'm showing the pattern
export const generateSampleData = () => {
  const owners = generateOwners();
  const salesPeople = generateSalesPeople();
  const operators = generateOperators();
  const personnel: Personnel[] = [...owners, ...salesPeople, ...operators];

  const businessCustomers = generateBusinessCustomers();
  const individualCustomers = generateIndividualCustomers();
  const customers: Customer[] = [...businessCustomers, ...individualCustomers];

  const materials = generateMaterials();
  const stations = generateStations();

  return {
    personnel,
    customers,
    materials,
    stations,
    templates: [], // Will be generated separately
    workOrders: [],
    invoices: [],
    shipments: [],
    transactions: [],
  };
};
