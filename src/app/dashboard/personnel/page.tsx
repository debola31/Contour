'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Personnel } from '@/types';

export default function PersonnelPage() {
  const personnel = useStore((state) => state.personnel);
  const addPersonnel = useStore((state) => state.addPersonnel);
  const updatePersonnel = useStore((state) => state.updatePersonnel);
  const deletePersonnel = useStore((state) => state.deletePersonnel);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'salesperson' | 'operator'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Personnel | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'operator' as 'owner' | 'salesperson' | 'operator',
  });

  const filteredPersonnel = personnel.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.role === 'operator' && p.qrCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || p.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const owners = personnel.filter((p) => p.role === 'owner').length;
  const salespeople = personnel.filter((p) => p.role === 'salesperson').length;
  const operators = personnel.filter((p) => p.role === 'operator').length;

  const generateQRCode = () => {
    const operatorCount = personnel.filter(p => p.role === 'operator').length;
    return `op-${String(operatorCount).padStart(4, '0')}`;
  };

  const handleAdd = () => {
    const basePerson = {
      id: `person-${Date.now()}`,
      ...formData,
      qrCode: formData.role === 'operator' ? generateQRCode() : '',
    };

    const newPerson = formData.role === 'operator'
      ? {
          ...basePerson,
          role: 'operator' as const,
          currentStation: null,
          isLoggedIn: false,
          lastLoginTime: null,
          stats: {
            totalOrders: 0,
            accuracy: 0,
            avgTimePerOrder: 0,
            currentStreak: 0,
            badges: []
          }
        }
      : basePerson as Personnel;

    addPersonnel(newPerson);
    setShowAddModal(false);
    setFormData({ firstName: '', lastName: '', email: '', role: 'operator' });
  };

  const handleEdit = () => {
    if (editingPerson) {
      updatePersonnel(editingPerson.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
      });
      setEditingPerson(null);
      setFormData({ firstName: '', lastName: '', email: '', role: 'operator' });
    }
  };

  const openEditModal = (person: Personnel) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      role: person.role,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'salesperson': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'operator': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'salesperson':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'operator':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Personnel Management" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" data-tour="role-filter">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Personnel</div>
            <div className="text-3xl font-bold text-white">{personnel.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Owners</div>
            <div className="text-3xl font-bold text-yellow-400">{owners}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Salespeople</div>
            <div className="text-3xl font-bold text-blue-400">{salespeople}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Operators</div>
            <div className="text-3xl font-bold text-green-400">{operators}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or QR code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owners</option>
            <option value="salesperson">Salespeople</option>
            <option value="operator">Operators</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-button px-6 py-3 rounded-lg text-white font-medium"
            data-tour="add-personnel"
          >
            + Add Personnel
          </button>
        </div>

        {/* Personnel Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" data-tour="personnel-list">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Name</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Email</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Role</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">QR Code</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {person.firstName} {person.lastName}
                      </div>
                    </td>
                    <td className="p-4 text-[#B0B3B8]">{person.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(person.role)}`}>
                        {getRoleIcon(person.role)}
                        {person.role === 'owner' ? 'Owner' : person.role === 'salesperson' ? 'Salesperson' : 'Operator'}
                      </span>
                    </td>
                    <td className="p-4">
                      {person.role === 'operator' ? (
                        <span className="font-mono text-white bg-white/10 px-3 py-1 rounded">
                          {person.qrCode}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(person)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(person)}
                          className="px-3 py-2 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPersonnel.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center mt-6">
            <svg className="w-16 h-16 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-[#B0B3B8]">No personnel found matching your search.</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingPerson) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingPerson ? 'Edit Personnel' : 'Add New Personnel'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#B0B3B8] mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#B0B3B8] mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    placeholder="john.doe@contour.com"
                  />
                </div>

                <div>
                  <label className="block text-[#B0B3B8] mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    disabled={!!editingPerson}
                  >
                    <option value="operator">Operator</option>
                    <option value="salesperson">Salesperson</option>
                    <option value="owner">Owner</option>
                  </select>
                  {editingPerson && (
                    <p className="text-xs text-yellow-500 mt-1">Role cannot be changed after creation</p>
                  )}
                </div>

                {formData.role === 'operator' && !editingPerson && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="text-green-400 text-sm font-medium mb-1">QR Code will be generated</div>
                    <div className="text-white/80 text-xs">
                      New QR code: <span className="font-mono">{generateQRCode()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPerson(null);
                    setFormData({ firstName: '', lastName: '', email: '', role: 'operator' });
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPerson ? handleEdit : handleAdd}
                  disabled={!formData.firstName || !formData.lastName || !formData.email}
                  className="flex-1 gradient-button px-4 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPerson ? 'Update' : 'Add'} Personnel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Delete Personnel</h2>

              <p className="text-[#B0B3B8] mb-6">
                Are you sure you want to delete{' '}
                <span className="text-white font-semibold">
                  {deleteConfirm.firstName} {deleteConfirm.lastName}
                </span>
                ?
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
                    deletePersonnel(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  Delete Personnel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
