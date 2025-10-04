import { Personnel, Customer, Material, Station } from '@/types';
import personnelData from './json/personnel.json';
import customersData from './json/customers.json';
import materialsData from './json/materials.json';
import stationsData from './json/stations.json';

export const loadSampleData = () => {
  return {
    personnel: personnelData as Personnel[],
    customers: customersData as Customer[],
    materials: materialsData as Material[],
    stations: stationsData as Station[],
    templates: [],
    workOrders: [],
    invoices: [],
    shipments: [],
    transactions: [],
  };
};
