import { generateSampleData } from './sampleData';
import * as fs from 'fs';
import * as path from 'path';

const data = generateSampleData();

const dataDir = path.join(process.cwd(), 'src/data/json');

// Create directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Export each data type to separate JSON files
fs.writeFileSync(
  path.join(dataDir, 'personnel.json'),
  JSON.stringify(data.personnel, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'customers.json'),
  JSON.stringify(data.customers, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'materials.json'),
  JSON.stringify(data.materials, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'stations.json'),
  JSON.stringify(data.stations, null, 2)
);

console.log('Sample data exported to src/data/json/');
