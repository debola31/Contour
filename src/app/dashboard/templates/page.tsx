'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { WorkOrderTemplate, FlowNode, FlowEdge } from '@/types';
import WorkflowEditor from '@/components/WorkflowEditor';

export default function TemplatesPage() {
  const templates = useStore((state) => state.templates);
  const stations = useStore((state) => state.stations);
  const materials = useStore((state) => state.materials);
  const addTemplate = useStore((state) => state.addTemplate);
  const updateTemplate = useStore((state) => state.updateTemplate);
  const deleteTemplate = useStore((state) => state.deleteTemplate);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkOrderTemplate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedCost: 0,
  });

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMaterialName = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.partName || materialId;
  };

  const handleAdd = () => {
    const newTemplate: WorkOrderTemplate = {
      id: `template-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      estimatedCost: formData.estimatedCost,
      flow: {
        nodes: [],
        edges: []
      },
      createdAt: new Date().toISOString(),
    };

    addTemplate(newTemplate);
    setShowAddModal(false);
    setFormData({ name: '', description: '', estimatedCost: 0 });
    setSelectedTemplate(newTemplate);
    setEditingWorkflow(true);
  };

  const handleSaveWorkflow = (nodes: FlowNode[], edges: FlowEdge[]) => {
    if (!selectedTemplate) return;

    updateTemplate(selectedTemplate.id, {
      flow: { nodes, edges }
    });

    // Update local state
    setSelectedTemplate({
      ...selectedTemplate,
      flow: { nodes, edges }
    });

    setEditingWorkflow(false);
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;

    if (confirm(`Are you sure you want to delete "${selectedTemplate.name}"?`)) {
      deleteTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Work Order Templates" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Templates</div>
            <div className="text-3xl font-bold text-white">{templates.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Stations</div>
            <div className="text-3xl font-bold text-[#4682B4]">{stations.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Avg Steps per Template</div>
            <div className="text-3xl font-bold text-white">
              {templates.length > 0
                ? (templates.reduce((sum, t) => sum + t.flow.nodes.length, 0) / templates.length).toFixed(1)
                : 0}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-button px-6 py-3 rounded-lg text-white font-medium"
            data-tour="new-template"
          >
            + New Template
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Templates List */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" data-tour="templates-list">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Templates</h2>
            </div>
            <div className="p-4 max-h-[700px] overflow-y-auto">
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'bg-[#4682B4]/20 border-[#4682B4]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{template.name}</h3>
                        <p className="text-[#B0B3B8] text-sm">{template.description}</p>
                      </div>
                      <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#B0B3B8]">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {template.flow.nodes.length} steps
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Details */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" data-tour="workflow-viewer">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {selectedTemplate ? 'Workflow Details' : 'Select a Template'}
              </h2>
            </div>
            {selectedTemplate ? (
              <div className="p-4 max-h-[700px] overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedTemplate.name}</h3>
                  <p className="text-[#B0B3B8] mb-4">Product: {selectedTemplate.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-[#B0B3B8] text-xs mb-1">Estimated Time</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-[#B0B3B8] text-xs mb-1">Total Steps</div>
                      <div className="text-white font-semibold">{selectedTemplate.flow.nodes.length}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3" data-tour="edit-workflow">
                    <button
                      onClick={() => setEditingWorkflow(true)}
                      className="flex-1 px-4 py-3 bg-[#4682B4] hover:bg-[#3a6a94] text-white rounded-lg transition-colors font-medium"
                    >
                      Edit Workflow
                    </button>
                    <button
                      onClick={handleDeleteTemplate}
                      className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium"
                    >
                      Delete Template
                    </button>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Workflow Steps
                  </h4>
                  {selectedTemplate.flow.nodes
                    .sort((a, b) => a.position.y - b.position.y)
                    .map((node, index) => {
                      const station = stations.find(s => s.id === node.stationId);
                      const nextNodes = selectedTemplate.flow.edges
                        .filter(e => e.source === node.id)
                        .map(e => selectedTemplate.flow.nodes.find(n => n.id === e.target));

                      return (
                        <div key={node.id} className="relative">
                          {index > 0 && (
                            <div className="absolute left-6 -top-4 h-4 w-px bg-[#4682B4]"></div>
                          )}
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#4682B4] flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-semibold mb-1">{node.data.label}</div>
                                <div className="text-[#B0B3B8] text-sm mb-2">
                                  Station: {station ? station.name : 'Unknown'}
                                </div>
                                {node.data.label === 'Quality Check' && (
                                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-400 mb-2">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Quality checkpoint: Pass/Fail routing
                                  </div>
                                )}
                                {node.data.materials && node.data.materials.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-[#B0B3B8] text-xs mb-1">Materials Required:</div>
                                    <div className="space-y-1">
                                      {node.data.materials.map((mat: any, i: number) => (
                                        <div key={i} className="text-xs text-white bg-white/5 rounded px-2 py-1 inline-block mr-2">
                                          {getMaterialName(mat.materialId)} × {mat.quantity}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {nextNodes.length > 0 && (
                                  <div className="mt-2 flex items-center gap-2 text-xs text-[#B0B3B8]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    Next: {nextNodes.map(n => n?.data.label).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-[#B0B3B8]">Select a template from the list to view its workflow details</p>
              </div>
            )}
          </div>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center mt-6">
            <svg className="w-16 h-16 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[#B0B3B8]">No templates found matching your search.</p>
          </div>
        )}
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f3a] rounded-xl border border-white/10 max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Create New Template</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#B0B3B8] mb-2 text-sm">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                  placeholder="e.g., Standard Widget Assembly"
                />
              </div>
              <div>
                <label className="block text-[#B0B3B8] mb-2 text-sm">Product Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                  placeholder="e.g., Widget Model XJ-2000"
                />
              </div>
              <div>
                <label className="block text-[#B0B3B8] mb-2 text-sm">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-[#B0B3B8]">
                Note: After creating the template, you can edit it to add workflow steps and stations.
              </p>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', description: '', estimatedCost: 0 });
                }}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.name || !formData.description}
                className="flex-1 gradient-button px-4 py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Editor Modal */}
      {editingWorkflow && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f3a] rounded-xl border border-white/10 w-full max-w-7xl h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Workflow: {selectedTemplate.name}</h2>
                <p className="text-[#B0B3B8] text-sm mt-1">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setEditingWorkflow(false)}
                className="text-white/60 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-6 overflow-hidden">
              <WorkflowEditor
                nodes={selectedTemplate.flow.nodes}
                edges={selectedTemplate.flow.edges}
                onSave={handleSaveWorkflow}
                stations={stations}
                materials={materials}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
