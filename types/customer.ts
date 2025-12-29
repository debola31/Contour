export interface Customer {
  id: string;
  company_id: string;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  customer_code: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  notes: string;
}

export type CustomerFilter = 'all' | 'active' | 'inactive';

export interface CustomerWithRelations extends Customer {
  quotes_count: number;
  jobs_count: number;
}

export interface CustomerImportRow {
  customer_code: string;
  name: string;
  [key: string]: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export const EMPTY_CUSTOMER_FORM: CustomerFormData = {
  customer_code: '',
  name: '',
  phone: '',
  email: '',
  website: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'USA',
  notes: '',
};

export function customerToFormData(customer: Customer): CustomerFormData {
  return {
    customer_code: customer.customer_code,
    name: customer.name,
    phone: customer.phone || '',
    email: customer.email || '',
    website: customer.website || '',
    contact_name: customer.contact_name || '',
    contact_phone: customer.contact_phone || '',
    contact_email: customer.contact_email || '',
    address_line1: customer.address_line1 || '',
    address_line2: customer.address_line2 || '',
    city: customer.city || '',
    state: customer.state || '',
    postal_code: customer.postal_code || '',
    country: customer.country || 'USA',
    notes: customer.notes || '',
  };
}
