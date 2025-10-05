'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Material } from '@/types';

export default function InventoryPage() {
  const materials = useStore((state) => state.materials);
  const updateMaterial = useStore((state) => state.updateMaterial);
  const addMaterial = useStore((state) => state.addMaterial);
  const deleteMaterial = useStore((state) => state.deleteMaterial);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editQuantityModal, setEditQuantityModal] = useState<Material | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);

  // New material form state
  const [newMaterial, setNewMaterial] = useState({
    partName: '',
    source: '',
    unitOfMeasurement: '',
    quantityInStock: 0,
    pricePerUnit: 0,
  });

  const filteredMaterials = materials.filter((m) =>
    m.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockMaterials = materials.filter(
    (m) => m.minimumQuantity && m.quantityInStock <= m.minimumQuantity
  );

  const handleUpdateStock = (id: string, change: number) => {
    const material = materials.find((m) => m.id === id);
    if (material) {
      updateMaterial(id, {
        quantityInStock: Math.max(0, material.quantityInStock + change),
      });
    }
  };

  const handleEditQuantity = () => {
    if (editQuantityModal) {
      const newQuantity = Math.max(0, editQuantityModal.quantityInStock + quantityChange);
      updateMaterial(editQuantityModal.id, {
        quantityInStock: newQuantity,
      });
      setEditQuantityModal(null);
      setQuantityChange(0);
    }
  };

  const handleAddMaterial = () => {
    addMaterial({
      id: `mat-${Date.now()}`,
      ...newMaterial,
      createdAt: new Date().toISOString(),
    });
    setShowAddModal(false);
    setNewMaterial({
      partName: '',
      source: '',
      unitOfMeasurement: '',
      quantityInStock: 0,
      pricePerUnit: 0,
    });
  };

  // Find similar materials when typing part name
  const similarMaterials = newMaterial.partName.length >= 3
    ? materials.filter((m) =>
        m.partName.toLowerCase().includes(newMaterial.partName.toLowerCase()) ||
        newMaterial.partName.toLowerCase().includes(m.partName.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen">
      <Header title="Inventory Management" />

      <div className="p-6">
        {/* Alerts */}
        {lowStockMaterials.length > 0 && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-yellow-500 font-semibold mb-1">Low Stock Alert</h3>
                <p className="text-white/80 text-sm">
                  {lowStockMaterials.length} item(s) are at or below minimum stock levels
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Items</div>
            <div className="text-3xl font-bold text-white">{materials.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Low Stock Items</div>
            <div className="text-3xl font-bold text-yellow-500">{lowStockMaterials.length}</div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-button px-6 py-3 rounded-lg text-white font-medium"
          >
            + New Material
          </button>
        </div>

        {/* Materials Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Part Name</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Source</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">In Stock</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Unit</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Price Per Unit</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => {
                  const isLowStock = material.minimumQuantity && material.quantityInStock <= material.minimumQuantity;
                  return (
                    <tr
                      key={material.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        isLowStock ? 'bg-yellow-500/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isLowStock && <span className="text-yellow-500">⚠️</span>}
                          <span className="text-white font-medium">{material.partName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">{material.source}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${isLowStock ? 'text-yellow-500' : 'text-white'}`}>
                          {material.quantityInStock.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">{material.unitOfMeasurement}</td>
                      <td className="p-4 text-white">${material.pricePerUnit.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditQuantityModal(material);
                              setQuantityChange(0);
                            }}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
                            title="Edit Quantity"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(material)}
                            className="px-3 py-2 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 rounded transition-colors"
                            title="Delete Material"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Quantity Modal */}
        {editQuantityModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Edit Quantity</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-[#B0B3B8] mb-2">Material</div>
                  <div className="text-white font-medium">{editQuantityModal.partName}</div>
                </div>

                <div>
                  <div className="text-[#B0B3B8] mb-2">Current Stock</div>
                  <div className="text-white font-medium">{editQuantityModal.quantityInStock.toLocaleString()} {editQuantityModal.unitOfMeasurement}</div>
                </div>

                <div>
                  <label className="block text-[#B0B3B8] mb-2">Quantity to {quantityChange >= 0 ? 'Add' : 'Remove'} ({editQuantityModal.unitOfMeasurement})</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quantityChange === 0 ? '' : Math.abs(quantityChange)}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setQuantityChange(quantityChange >= 0 ? val : -val);
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setQuantityChange(Math.abs(quantityChange))}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                        quantityChange >= 0
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => setQuantityChange(-Math.abs(quantityChange))}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                        quantityChange < 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      − Remove
                    </button>
                  </div>
                </div>

                <div className={`rounded-lg p-3 border ${
                  quantityChange >= 0
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="text-[#B0B3B8] text-sm mb-1">
                    {quantityChange >= 0 ? 'Adding' : 'Removing'} {Math.abs(quantityChange).toLocaleString()} {editQuantityModal.unitOfMeasurement}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#B0B3B8]">{editQuantityModal.quantityInStock.toLocaleString()}</span>
                    <span className={quantityChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {quantityChange >= 0 ? '+' : ''}{quantityChange.toLocaleString()}
                    </span>
                    <span className="text-white">→</span>
                    <span className={`text-xl font-semibold ${
                      editQuantityModal.quantityInStock + quantityChange < 0 ? 'text-red-400' : 'text-white'
                    }`}>
                      {Math.max(0, editQuantityModal.quantityInStock + quantityChange).toLocaleString()} {editQuantityModal.unitOfMeasurement}
                    </span>
                  </div>
                  {editQuantityModal.quantityInStock + quantityChange < 0 && (
                    <div className="text-red-400 text-xs mt-1">⚠️ Cannot have negative stock</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditQuantityModal(null);
                    setQuantityChange(0);
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditQuantity}
                  disabled={editQuantityModal.quantityInStock + quantityChange < 0}
                  className="flex-1 gradient-button px-4 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add New Material Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-2xl border border-white/10 my-8">
              <h2 className="text-xl font-semibold text-white mb-4">New Material</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[#B0B3B8] mb-2">Part Name *</label>
                  <input
                    type="text"
                    value={newMaterial.partName}
                    onChange={(e) => setNewMaterial({ ...newMaterial, partName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    placeholder="e.g., Brass Casing"
                  />
                </div>

                {/* Similar Materials Warning */}
                {similarMaterials.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div className="flex-1">
                        <h3 className="text-yellow-500 font-semibold mb-2">Similar Materials Found</h3>
                        <p className="text-white/80 text-sm mb-3">
                          The following materials already exist with similar names:
                        </p>
                        <div className="space-y-2">
                          {similarMaterials.map((mat) => (
                            <div key={mat.id} className="bg-white/5 rounded p-2 text-sm">
                              <div className="text-white font-medium">{mat.partName}</div>
                              <div className="text-[#B0B3B8]">
                                {mat.quantityInStock} {mat.unitOfMeasurement} • ${mat.pricePerUnit.toFixed(2)}/unit • {mat.source}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Source *</label>
                    <input
                      type="text"
                      value={newMaterial.source}
                      onChange={(e) => setNewMaterial({ ...newMaterial, source: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="e.g., Supplier XYZ"
                    />
                  </div>

                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Unit of Measurement *</label>
                    <input
                      type="text"
                      value={newMaterial.unitOfMeasurement}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unitOfMeasurement: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="e.g., kg, units, liters"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Initial Quantity *</label>
                    <input
                      type="number"
                      value={newMaterial.quantityInStock}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantityInStock: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Price Per Unit *</label>
                    <input
                      type="number"
                      value={newMaterial.pricePerUnit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, pricePerUnit: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewMaterial({
                      partName: '',
                      source: '',
                      unitOfMeasurement: '',
                      quantityInStock: 0,
                      pricePerUnit: 0,
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaterial}
                  disabled={!newMaterial.partName || !newMaterial.source || !newMaterial.unitOfMeasurement}
                  className="flex-1 gradient-button px-4 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Material
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Delete Material</h2>

              <p className="text-[#B0B3B8] mb-2">
                Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirm.partName}</span>?
              </p>
              <p className="text-[#B0B3B8] text-sm mb-6">
                Current stock: {deleteConfirm.quantityInStock.toLocaleString()} {deleteConfirm.unitOfMeasurement}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteMaterial(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  Delete Material
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
