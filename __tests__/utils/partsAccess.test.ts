import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Part, PartFormData } from '@/types/part';

// Use vi.hoisted to define mock variables before vi.mock is called
const { mockQueryBuilder, mockSupabase } = vi.hoisted(() => {
  // Create a chainable mock query builder
  const builder: Record<string, ReturnType<typeof vi.fn> | unknown> = {};

  const chainMethods = [
    'from',
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'ilike',
    'or',
    'is',
    'in',
    'order',
    'range',
    'single',
    'limit',
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockImplementation(() => builder);
  });

  // Terminal values
  builder.data = null;
  builder.error = null;
  builder.count = null;

  const supabase = {
    from: vi.fn().mockImplementation(() => builder),
  };

  return { mockQueryBuilder: builder, mockSupabase: supabase };
});

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => mockSupabase,
  createClient: () => mockSupabase,
  supabase: mockSupabase,
}));

// Import functions after mock setup
import {
  getAllParts,
  getPart,
  getPartWithRelations,
  checkPartNumberExists,
  createPart,
  updatePart,
  deletePart,
  bulkDeleteParts,
} from '@/utils/partsAccess';

describe('partsAccess utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => mockQueryBuilder);
    Object.keys(mockQueryBuilder).forEach((key) => {
      const value = mockQueryBuilder[key];
      if (typeof value === 'function' && 'mockClear' in value) {
        (value as ReturnType<typeof vi.fn>).mockClear();
        (value as ReturnType<typeof vi.fn>).mockImplementation(() => mockQueryBuilder);
      }
    });
    mockQueryBuilder.data = null;
    mockQueryBuilder.error = null;
    mockQueryBuilder.count = null;
  });

  const mockPart: Part = {
    id: 'part-1',
    company_id: 'company-1',
    customer_id: 'customer-1',
    part_number: 'PART001',
    description: 'Test Part',
    pricing: [
      { qty: 1, price: 10.0 },
      { qty: 10, price: 8.5 },
    ],
    material_cost: 5.0,
    notes: 'Test notes',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    customer: {
      id: 'customer-1',
      name: 'Test Customer',
      customer_code: 'CUST001',
    },
  };

  const mockGenericPart: Part = {
    ...mockPart,
    id: 'part-2',
    customer_id: null,
    part_number: 'GENERIC001',
    customer: null,
  };

  describe('getAllParts', () => {
    it('returns parts for a company with customer data', async () => {
      mockQueryBuilder.data = [mockPart, mockGenericPart];
      mockQueryBuilder.error = null;

      const result = await getAllParts('company-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        '*, customers!left(id, name, customer_code)'
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('company_id', 'company-1');
      expect(result).toHaveLength(2);
    });

    it('filters by customer ID', async () => {
      mockQueryBuilder.data = [mockPart];
      mockQueryBuilder.error = null;

      await getAllParts('company-1', 'customer-1');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
    });

    it('filters generic parts using .is() for null', async () => {
      mockQueryBuilder.data = [mockGenericPart];
      mockQueryBuilder.error = null;

      await getAllParts('company-1', 'generic');

      expect(mockQueryBuilder.is).toHaveBeenCalledWith('customer_id', null);
    });

    it('applies search filter correctly', async () => {
      mockQueryBuilder.data = [mockPart];
      mockQueryBuilder.error = null;

      await getAllParts('company-1', undefined, 'PART001');

      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        'part_number.ilike.%PART001%,description.ilike.%PART001%'
      );
    });

    it('throws error when Supabase query fails', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { message: 'Database connection failed', code: '500' };

      await expect(getAllParts('company-1')).rejects.toEqual({
        message: 'Database connection failed',
        code: '500',
      });
    });
  });

  describe('getPart', () => {
    it('returns single part by ID with customer data', async () => {
      mockQueryBuilder.data = mockPart;
      mockQueryBuilder.error = null;

      const result = await getPart('part-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'part-1');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockPart);
    });

    it('returns null when part not found', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { code: 'PGRST116', message: 'Not found' };

      const result = await getPart('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPartWithRelations', () => {
    it('returns part with customer and counts', async () => {
      const partWithCounts = {
        ...mockPart,
        quotes_count: 5,
        jobs_count: 3,
      };
      mockQueryBuilder.data = partWithCounts;
      mockQueryBuilder.error = null;

      const result = await getPartWithRelations('part-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(result).toEqual(partWithCounts);
    });
  });

  describe('checkPartNumberExists', () => {
    it('returns true when part number exists for customer', async () => {
      mockQueryBuilder.data = [{ id: 'existing-part' }];
      mockQueryBuilder.error = null;

      const result = await checkPartNumberExists('company-1', 'PART001', 'customer-1');

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('part_number', 'PART001');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
      expect(result).toBe(true);
    });

    it('uses .is() for null customer_id (generic parts)', async () => {
      mockQueryBuilder.data = [{ id: 'generic-part' }];
      mockQueryBuilder.error = null;

      const result = await checkPartNumberExists('company-1', 'GENERIC001', null);

      expect(mockQueryBuilder.is).toHaveBeenCalledWith('customer_id', null);
      expect(result).toBe(true);
    });

    it('returns false when part number does not exist', async () => {
      mockQueryBuilder.data = [];
      mockQueryBuilder.error = null;

      const result = await checkPartNumberExists('company-1', 'NONEXISTENT', 'customer-1');

      expect(result).toBe(false);
    });

    it('excludes specified ID in edit mode', async () => {
      mockQueryBuilder.data = [];
      mockQueryBuilder.error = null;

      await checkPartNumberExists('company-1', 'PART001', 'customer-1', 'exclude-this-id');

      expect(mockQueryBuilder.neq).toHaveBeenCalledWith('id', 'exclude-this-id');
    });
  });

  describe('createPart', () => {
    const mockFormData: PartFormData = {
      part_number: 'NEW001',
      customer_id: 'customer-1',
      description: 'New Part',
      pricing: [
        { qty: 1, price: 15.0 },
        { qty: 50, price: 12.0 },
      ],
      material_cost: '7.50',
      notes: 'New part notes',
    };

    it('inserts part and returns data', async () => {
      const mockCreatedPart: Part = {
        id: 'new-part-uuid',
        company_id: 'company-1',
        customer_id: 'customer-1',
        part_number: 'NEW001',
        description: 'New Part',
        pricing: [
          { qty: 1, price: 15.0 },
          { qty: 50, price: 12.0 },
        ],
        material_cost: 7.5,
        notes: 'New part notes',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQueryBuilder.data = mockCreatedPart;
      mockQueryBuilder.error = null;

      const result = await createPart('company-1', mockFormData);

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedPart);
    });

    it('converts empty customer_id to null for generic parts', async () => {
      const genericFormData: PartFormData = {
        ...mockFormData,
        customer_id: '',
      };

      mockQueryBuilder.data = mockGenericPart;
      mockQueryBuilder.error = null;

      await createPart('company-1', genericFormData);

      // Check that insert was called with customer_id: null
      const insertCall = (mockQueryBuilder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(insertCall.customer_id).toBeNull();
    });

    it('throws error when insert fails', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { message: 'Insert failed', code: '23505' };

      await expect(createPart('company-1', mockFormData)).rejects.toEqual({
        message: 'Insert failed',
        code: '23505',
      });
    });
  });

  describe('updatePart', () => {
    const mockFormData: PartFormData = {
      part_number: 'PART001',
      customer_id: 'customer-1',
      description: 'Updated Part',
      pricing: [{ qty: 1, price: 20.0 }],
      material_cost: '10.00',
      notes: 'Updated notes',
    };

    it('updates part and returns data', async () => {
      const mockUpdatedPart: Part = {
        ...mockPart,
        description: 'Updated Part',
        pricing: [{ qty: 1, price: 20.0 }],
        material_cost: 10.0,
        notes: 'Updated notes',
      };

      mockQueryBuilder.data = mockUpdatedPart;
      mockQueryBuilder.error = null;

      const result = await updatePart('part-1', mockFormData);

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'part-1');
      expect(result).toEqual(mockUpdatedPart);
    });
  });

  describe('deletePart', () => {
    it('deletes part by ID', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = null;

      await deletePart('part-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'part-1');
    });

    it('throws user-friendly error on FK constraint violation', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { message: 'FK violation', code: '23503' };

      await expect(deletePart('part-1')).rejects.toThrow(
        'Cannot delete this part because it is referenced by quotes or jobs. Remove those references first.'
      );
    });
  });

  describe('bulkDeleteParts', () => {
    it('deletes multiple parts by IDs', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = null;

      await bulkDeleteParts(['part-1', 'part-2', 'part-3']);

      expect(mockSupabase.from).toHaveBeenCalledWith('parts');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', ['part-1', 'part-2', 'part-3']);
    });

    it('throws user-friendly error on FK constraint violation', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { message: 'FK violation', code: '23503' };

      await expect(bulkDeleteParts(['part-1'])).rejects.toThrow(
        'Cannot delete these parts because some are referenced by quotes or jobs. Remove those references first.'
      );
    });
  });
});
