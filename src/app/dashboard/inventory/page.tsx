'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Material } from '@/types';

export default function InventoryPage() {
  const materials = useStore((state) => state.materials);
  const updateMaterial = useStore((state) => state.updateMaterial);
  const addMaterial = useStore((state) => state.addMaterial);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Items</div>
            <div className="text-3xl font-bold text-white">{materials.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Low Stock Items</div>
            <div className="text-3xl font-bold text-yellow-500">{lowStockMaterials.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Value</div>
            <div className="text-3xl font-bold text-white">
              ${materials.reduce((sum, m) => sum + m.quantityInStock * m.pricePerUnit, 0).toLocaleString()}
            </div>
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
            + Add Material
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
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Price</th>
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
                        {material.minimumQuantity && (
                          <span className="text-[#B0B3B8] text-sm ml-2">/ {material.minimumQuantity}</span>
                        )}
                      </td>
                      <td className="p-4 text-[#B0B3B8]">{material.unitOfMeasurement}</td>
                      <td className="p-4 text-white">${material.pricePerUnit.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStock(material.id, -10)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors text-sm"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleUpdateStock(material.id, 10)}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors text-sm"
                          >
                            +10
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
      </div>
    </div>
  );
}
