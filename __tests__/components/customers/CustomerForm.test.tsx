import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, routerMocks, resetRouterMocks } from '../../test-utils';
import CustomerForm from '@/components/customers/CustomerForm';
import { EMPTY_CUSTOMER_FORM } from '@/types/customer';
import type { CustomerFormData, Customer } from '@/types/customer';

// Mock customerAccess utilities
const mockCreateCustomer = vi.fn();
const mockUpdateCustomer = vi.fn();
const mockSoftDeleteCustomer = vi.fn();
const mockCheckCustomerCodeExists = vi.fn();

vi.mock('@/utils/customerAccess', () => ({
  createCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
  updateCustomer: (...args: unknown[]) => mockUpdateCustomer(...args),
  softDeleteCustomer: (...args: unknown[]) => mockSoftDeleteCustomer(...args),
  checkCustomerCodeExists: (...args: unknown[]) => mockCheckCustomerCodeExists(...args),
}));

describe('CustomerForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    resetRouterMocks();
    // Default: customer code doesn't exist (validation passes)
    mockCheckCustomerCodeExists.mockResolvedValue(false);
  });

  describe('Validation', () => {
    it('shows error when customer_code is empty on submit', async () => {
      render(
        <CustomerForm
          mode="create"
          initialData={{ ...EMPTY_CUSTOMER_FORM, name: 'Test Company' }}
        />
      );

      // Verify the Customer Code field exists and is empty
      const customerCodeInput = screen.getByLabelText(/customer code/i);
      expect(customerCodeInput).toHaveValue('');

      // Submit the form directly using fireEvent to bypass HTML5 validation
      // (HTML5 required attribute blocks button click in jsdom when fields are empty)
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      // Should show validation error in the helper text
      expect(await screen.findByText(/customer code is required/i)).toBeInTheDocument();

      // Should not have called createCustomer
      expect(mockCreateCustomer).not.toHaveBeenCalled();
    });

    it('shows error when name is empty on submit', async () => {
      render(
        <CustomerForm
          mode="create"
          initialData={{ ...EMPTY_CUSTOMER_FORM, customer_code: 'TEST001' }}
        />
      );

      // Verify the Company Name field exists and is empty
      const nameInput = screen.getByLabelText(/company name/i);
      expect(nameInput).toHaveValue('');

      // Submit the form directly using fireEvent to bypass HTML5 validation
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      // Should show validation error in the helper text
      expect(await screen.findByText(/company name is required/i)).toBeInTheDocument();

      // Should not have called createCustomer
      expect(mockCreateCustomer).not.toHaveBeenCalled();
    });
  });

  describe('Create mode', () => {
    const validFormData: CustomerFormData = {
      ...EMPTY_CUSTOMER_FORM,
      customer_code: 'NEW001',
      name: 'New Test Company',
    };

    it('creates customer and redirects on success', async () => {
      const mockCustomer: Customer = {
        id: 'new-customer-uuid',
        company_id: 'test-company-id',
        customer_code: 'NEW001',
        name: 'New Test Company',
        phone: null,
        email: null,
        website: null,
        contact_name: null,
        contact_phone: null,
        contact_email: null,
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        postal_code: null,
        country: 'USA',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockCreateCustomer.mockResolvedValue(mockCustomer);

      render(<CustomerForm mode="create" initialData={validFormData} />);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Wait for form submission
      await waitFor(() => {
        expect(mockCheckCustomerCodeExists).toHaveBeenCalledWith(
          'test-company-id',
          'NEW001',
          undefined
        );
      });

      await waitFor(() => {
        expect(mockCreateCustomer).toHaveBeenCalledWith(
          'test-company-id',
          validFormData
        );
      });

      // Should redirect to customer detail page
      await waitFor(() => {
        expect(routerMocks.push).toHaveBeenCalledWith(
          '/dashboard/test-company-id/customers/new-customer-uuid'
        );
      });
    });

    it('shows error for duplicate customer_code', async () => {
      // Customer code already exists
      mockCheckCustomerCodeExists.mockResolvedValue(true);

      render(<CustomerForm mode="create" initialData={validFormData} />);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show duplicate error
      await waitFor(() => {
        expect(screen.getByText(/customer code already exists/i)).toBeInTheDocument();
      });

      // Should not have called createCustomer
      expect(mockCreateCustomer).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    const existingCustomerData: CustomerFormData = {
      customer_code: 'EXIST001',
      name: 'Existing Company',
      phone: '555-1234',
      email: 'contact@existing.com',
      website: 'https://existing.com',
      contact_name: 'John Doe',
      contact_phone: '555-5678',
      contact_email: 'john@existing.com',
      address_line1: '123 Main St',
      address_line2: 'Suite 100',
      city: 'Springfield',
      state: 'IL',
      postal_code: '62701',
      country: 'USA',
      notes: 'Important customer',
    };

    it('pre-fills form with existing customer data', () => {
      render(
        <CustomerForm
          mode="edit"
          initialData={existingCustomerData}
          customerId="existing-customer-uuid"
        />
      );

      // Check that form fields are pre-filled
      expect(screen.getByLabelText(/customer code/i)).toHaveValue('EXIST001');
      expect(screen.getByLabelText(/company name/i)).toHaveValue('Existing Company');
      expect(screen.getByLabelText(/contact name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/city/i)).toHaveValue('Springfield');

      // Delete button should be visible in edit mode
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });
});
