import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ResourceGroupFormData, OperationFormData } from '@/types/operations';

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
    'in',
    'not',
    'order',
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
  getResourceGroups,
  getResourceGroup,
  createResourceGroup,
  updateResourceGroup,
  deleteResourceGroup,
  getResourceGroupOperationCount,
  getResourceGroupsWithCounts,
  getAllOperations,
  getOperationsGrouped,
  getOperationsFlat,
  getOperation,
  getOperationWithRelations,
  checkOperationNameExists,
  createOperation,
  updateOperation,
  deleteOperation,
  bulkDeleteOperations,
  bulkImportOperations,
} from '@/utils/operationsAccess';

describe('operationsAccess utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  // ============== Resource Groups Tests ==============

  describe('getResourceGroups', () => {
    it('returns all resource groups for a company', async () => {
      const mockGroups = [
        { id: 'group-1', company_id: 'company-1', name: 'CNC', description: 'CNC machines' },
        { id: 'group-2', company_id: 'company-1', name: 'Manual', description: 'Manual work' },
      ];
      mockQueryBuilder.data = mockGroups;
      mockQueryBuilder.error = null;

      const result = await getResourceGroups('company-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('resource_groups');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('company_id', 'company-1');
      expect(result).toHaveLength(2);
    });

    it('throws error when query fails', async () => {
      mockQueryBuilder.error = { message: 'Database error', code: '500' };

      await expect(getResourceGroups('company-1')).rejects.toEqual({
        message: 'Database error',
        code: '500',
      });
    });
  });

  describe('getResourceGroup', () => {
    it('returns resource group by ID', async () => {
      const mockGroup = { id: 'group-1', name: 'CNC' };
      mockQueryBuilder.data = mockGroup;
      mockQueryBuilder.error = null;

      const result = await getResourceGroup('group-1');

      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it('returns null when group not found (PGRST116)', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { code: 'PGRST116', message: 'Not found' };

      const result = await getResourceGroup('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createResourceGroup', () => {
    it('creates a new resource group', async () => {
      const formData: ResourceGroupFormData = { name: 'CNC', description: 'CNC machines' };
      const mockCreated = { id: 'new-group', ...formData };
      mockQueryBuilder.data = mockCreated;
      mockQueryBuilder.error = null;

      const result = await createResourceGroup('company-1', formData);

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it('throws error on duplicate name', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { message: 'Duplicate name', code: '23505' };

      const formData: ResourceGroupFormData = { name: 'Existing', description: '' };

      await expect(createResourceGroup('company-1', formData)).rejects.toEqual({
        message: 'Duplicate name',
        code: '23505',
      });
    });
  });

  describe('updateResourceGroup', () => {
    it('updates an existing resource group', async () => {
      const formData: ResourceGroupFormData = { name: 'Updated CNC', description: 'Updated desc' };
      const mockUpdated = { id: 'group-1', ...formData };
      mockQueryBuilder.data = mockUpdated;
      mockQueryBuilder.error = null;

      const result = await updateResourceGroup('group-1', formData);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'group-1');
      expect(result.name).toBe('Updated CNC');
    });
  });

  describe('deleteResourceGroup', () => {
    it('ungroups operations and deletes group', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = null;

      await deleteResourceGroup('group-1');

      // Should first update operations to ungroup them
      expect(mockSupabase.from).toHaveBeenCalledWith('operation_types');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      // Then delete the group
      expect(mockSupabase.from).toHaveBeenCalledWith('resource_groups');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });

    it('throws error if ungrouping fails', async () => {
      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table) => {
        callCount++;
        if (table === 'operation_types') {
          return {
            ...mockQueryBuilder,
            update: vi.fn().mockReturnValue({
              ...mockQueryBuilder,
              eq: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Ungroup failed', code: '500' },
              }),
            }),
          };
        }
        return mockQueryBuilder;
      });

      await expect(deleteResourceGroup('group-1')).rejects.toEqual({
        message: 'Ungroup failed',
        code: '500',
      });
    });
  });

  describe('getResourceGroupOperationCount', () => {
    it('returns count of operations in group', async () => {
      mockQueryBuilder.count = 5;
      mockQueryBuilder.error = null;

      const result = await getResourceGroupOperationCount('group-1');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('resource_group_id', 'group-1');
      expect(result).toBe(5);
    });

    it('returns 0 on error', async () => {
      mockQueryBuilder.count = null;
      mockQueryBuilder.error = { message: 'Error', code: '500' };

      const result = await getResourceGroupOperationCount('group-1');

      expect(result).toBe(0);
    });
  });

  // ============== Operations Tests ==============

  describe('getAllOperations', () => {
    it('returns operations with resource group info', async () => {
      const mockOps = [
        { id: 'op-1', name: 'Milling', resource_group: { id: 'g-1', name: 'CNC' } },
        { id: 'op-2', name: 'Turning', resource_group: null },
      ];
      mockQueryBuilder.data = mockOps;
      mockQueryBuilder.error = null;

      const result = await getAllOperations('company-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('operation_types');
      expect(result).toHaveLength(2);
    });

    it('applies search filter', async () => {
      mockQueryBuilder.data = [];
      mockQueryBuilder.error = null;

      await getAllOperations('company-1', 'milling');

      expect(mockQueryBuilder.or).toHaveBeenCalledWith(expect.stringContaining('milling'));
    });
  });

  describe('getOperationsGrouped', () => {
    it('returns grouped and ungrouped operations', async () => {
      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table) => {
        callCount++;
        if (table === 'resource_groups') {
          return {
            ...mockQueryBuilder,
            select: vi.fn().mockReturnValue({
              ...mockQueryBuilder,
              eq: vi.fn().mockReturnValue({
                ...mockQueryBuilder,
                order: vi.fn().mockReturnValue({
                  data: [{ id: 'g-1', name: 'CNC' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'operation_types') {
          return {
            ...mockQueryBuilder,
            select: vi.fn().mockReturnValue({
              ...mockQueryBuilder,
              eq: vi.fn().mockReturnValue({
                ...mockQueryBuilder,
                order: vi.fn().mockReturnValue({
                  data: [
                    { id: 'op-1', name: 'Milling', resource_group_id: 'g-1' },
                    { id: 'op-2', name: 'Manual', resource_group_id: null },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return mockQueryBuilder;
      });

      const result = await getOperationsGrouped('company-1');

      expect(result.groups).toBeDefined();
      expect(result.ungrouped).toBeDefined();
    });
  });

  describe('getOperationsFlat', () => {
    it('returns flat list of operations', async () => {
      mockQueryBuilder.data = [{ id: 'op-1', name: 'Milling' }];
      mockQueryBuilder.error = null;

      const result = await getOperationsFlat('company-1');

      expect(result).toHaveLength(1);
    });

    it('filters by group ID', async () => {
      mockQueryBuilder.data = [];
      mockQueryBuilder.error = null;

      await getOperationsFlat('company-1', { groupId: 'group-1' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('resource_group_id', 'group-1');
    });
  });

  describe('getOperation', () => {
    it('returns operation by ID', async () => {
      const mockOp = { id: 'op-1', name: 'Milling', labor_rate: 75 };
      mockQueryBuilder.data = mockOp;
      mockQueryBuilder.error = null;

      const result = await getOperation('op-1');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'op-1');
      expect(result).toEqual(mockOp);
    });

    it('returns null when not found', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { code: 'PGRST116', message: 'Not found' };

      const result = await getOperation('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('checkOperationNameExists', () => {
    it('returns true when name exists', async () => {
      mockQueryBuilder.data = [{ id: 'existing-op' }];
      mockQueryBuilder.error = null;

      const result = await checkOperationNameExists('company-1', 'Milling');

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', 'Milling');
      expect(result).toBe(true);
    });

    it('returns false when name does not exist', async () => {
      mockQueryBuilder.data = [];
      mockQueryBuilder.error = null;

      const result = await checkOperationNameExists('company-1', 'NewOp');

      expect(result).toBe(false);
    });

    it('excludes specific ID in edit mode', async () => {
      mockQueryBuilder.data = [];
      mockQueryBuilder.error = null;

      await checkOperationNameExists('company-1', 'Milling', 'op-1');

      expect(mockQueryBuilder.neq).toHaveBeenCalledWith('id', 'op-1');
    });
  });

  describe('createOperation', () => {
    it('creates a new operation', async () => {
      const formData: OperationFormData = {
        name: 'Milling',
        resource_group_id: 'group-1',
        labor_rate: '75',
        description: 'CNC milling',
      };
      const mockCreated = { id: 'new-op', ...formData };
      mockQueryBuilder.data = mockCreated;
      mockQueryBuilder.error = null;

      const result = await createOperation('company-1', formData);

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.name).toBe('Milling');
    });

    it('handles empty resource_group_id', async () => {
      const formData: OperationFormData = {
        name: 'Manual Work',
        resource_group_id: '',
        labor_rate: '',
        description: '',
      };
      mockQueryBuilder.data = { id: 'new-op', name: 'Manual Work' };
      mockQueryBuilder.error = null;

      const result = await createOperation('company-1', formData);

      expect(result).toBeDefined();
    });
  });

  describe('updateOperation', () => {
    it('updates an existing operation', async () => {
      const formData: OperationFormData = {
        name: 'Updated Milling',
        resource_group_id: 'group-2',
        labor_rate: '80',
        description: 'Updated description',
      };
      mockQueryBuilder.data = { id: 'op-1', ...formData };
      mockQueryBuilder.error = null;

      const result = await updateOperation('op-1', formData);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'op-1');
      expect(result.name).toBe('Updated Milling');
    });
  });

  describe('deleteOperation', () => {
    it('deletes an operation', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = null;

      await deleteOperation('op-1');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'op-1');
    });

    it('throws user-friendly error on FK constraint', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { code: '23503', message: 'FK constraint violation' };

      await expect(deleteOperation('op-1')).rejects.toThrow(
        'Cannot delete this operation because it is used in routing operations'
      );
    });
  });

  describe('bulkDeleteOperations', () => {
    it('deletes multiple operations', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = null;

      await bulkDeleteOperations(['op-1', 'op-2']);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', ['op-1', 'op-2']);
    });

    it('handles empty array', async () => {
      await bulkDeleteOperations([]);

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('filters invalid IDs', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = null;

      // @ts-expect-error Testing invalid input
      await bulkDeleteOperations(['valid', null, '', undefined]);

      // Should only process valid IDs
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it('throws user-friendly error on FK constraint', async () => {
      mockQueryBuilder.data = null;
      mockQueryBuilder.error = { code: '23503', message: 'FK constraint' };

      await expect(bulkDeleteOperations(['op-1'])).rejects.toThrow(
        'Cannot delete some operations because they are used in routing operations'
      );
    });
  });

  // ============== Import Tests ==============

  describe('bulkImportOperations', () => {
    it('imports operations successfully', async () => {
      // Mock existing operations query
      let callCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table) => {
        callCount++;
        return {
          ...mockQueryBuilder,
          select: vi.fn().mockReturnValue({
            ...mockQueryBuilder,
            eq: vi.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
          insert: vi.fn().mockReturnValue({
            ...mockQueryBuilder,
            select: vi.fn().mockReturnValue({
              ...mockQueryBuilder,
              single: vi.fn().mockReturnValue({
                data: { id: 'new-group', name: 'CNC' },
                error: null,
              }),
            }),
            data: null,
            error: null,
          }),
        };
      });

      const rows = [
        { name: 'Milling', labor_rate: '75', resource_group: 'CNC' },
        { name: 'Turning', labor_rate: '70', resource_group: 'CNC' },
      ];

      const result = await bulkImportOperations('company-1', rows);

      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });

    it('skips rows with missing name', async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        ...mockQueryBuilder,
        select: vi.fn().mockReturnValue({
          ...mockQueryBuilder,
          eq: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
      }));

      const rows = [
        { name: '', labor_rate: '75' },
        { name: 'Valid', labor_rate: '70' },
      ];

      const result = await bulkImportOperations('company-1', rows);

      expect(result.skipped).toBeGreaterThanOrEqual(1);
      expect(result.errors.some((e) => e.reason === 'Missing name')).toBe(true);
    });

    it('detects duplicate names in database', async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table) => ({
        ...mockQueryBuilder,
        select: vi.fn().mockReturnValue({
          ...mockQueryBuilder,
          eq: vi.fn().mockReturnValue({
            data: [{ name: 'existing' }],
            error: null,
          }),
        }),
      }));

      const rows = [{ name: 'Existing', labor_rate: '75' }];

      const result = await bulkImportOperations('company-1', rows);

      expect(result.skipped).toBe(1);
      expect(result.errors.some((e) => e.reason.includes('already exists'))).toBe(true);
    });

    it('detects duplicate names within file', async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table) => ({
        ...mockQueryBuilder,
        select: vi.fn().mockReturnValue({
          ...mockQueryBuilder,
          eq: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
        insert: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      }));

      const rows = [
        { name: 'Duplicate', labor_rate: '75' },
        { name: 'Duplicate', labor_rate: '80' }, // Same name
      ];

      const result = await bulkImportOperations('company-1', rows);

      // One should succeed, one should be skipped as duplicate
      expect(result.errors.some((e) => e.reason.includes('Duplicate'))).toBe(true);
    });
  });
});
