'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FlowNode, FlowEdge, MaterialConsumption } from '@/types';

interface WorkflowEditorProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onSave: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  stations: Array<{ id: string; name: string }>;
  materials: Array<{ id: string; partName: string }>;
}

type NodeType = 'station' | 'merge' | 'split';

interface CanvasNode extends FlowNode {
  isSelected: boolean;
}

export default function WorkflowEditor({ nodes: initialNodes, edges: initialEdges, onSave, stations, materials }: WorkflowEditorProps) {
  const [nodes, setNodes] = useState<CanvasNode[]>(
    initialNodes.map(n => ({ ...n, isSelected: false }))
  );
  const [edges, setEdges] = useState<FlowEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add-station' | 'add-split' | 'add-merge' | 'connect'>('select');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState({
    label: '',
    stationId: '',
    materials: [] as MaterialConsumption[]
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'select' || draggedNode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: mode === 'add-station' ? 'station' : mode === 'add-split' ? 'split' : 'merge',
      position: { x, y },
      data: {
        label: mode === 'add-station' ? 'New Station' : mode === 'add-split' ? 'Split' : 'Merge',
        materials: []
      },
      isSelected: false
    };

    if (mode === 'add-station') {
      newNode.stationId = stations[0]?.id || '';
    }

    setNodes([...nodes, newNode]);
    setMode('select');
  }, [mode, nodes, stations, draggedNode]);

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (mode === 'connect') {
      if (connectingFrom === null) {
        setConnectingFrom(nodeId);
      } else if (connectingFrom !== nodeId) {
        // Create edge
        const newEdge: FlowEdge = {
          id: `edge-${Date.now()}`,
          source: connectingFrom,
          target: nodeId
        };
        setEdges([...edges, newEdge]);
        setConnectingFrom(null);
        setMode('select');
      }
      return;
    }

    setSelectedNode(nodeId);
    setNodes(nodes.map(n => ({ ...n, isSelected: n.id === nodeId })));
  }, [mode, connectingFrom, edges, nodes]);

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (mode !== 'select') return;
    e.stopPropagation();

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y
    });
  }, [mode, nodes]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setNodes(nodes.map(n =>
      n.id === draggedNode
        ? { ...n, position: { x: Math.max(0, Math.min(x, 800 - 120)), y: Math.max(0, Math.min(y, 600 - 80)) } }
        : n
    ));
  }, [draggedNode, dragOffset, nodes]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes(nodes.filter(n => n.id !== selectedNode));
    setEdges(edges.filter(e => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
  }, [selectedNode, nodes, edges]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(edges.filter(e => e.id !== edgeId));
  }, [edges]);

  const handleEditNode = useCallback(() => {
    if (!selectedNode) return;

    const node = nodes.find(n => n.id === selectedNode);
    if (!node) return;

    setEditingNode(selectedNode);
    setNodeForm({
      label: node.data.label,
      stationId: node.stationId || '',
      materials: node.data.materials || []
    });
  }, [selectedNode, nodes]);

  const handleSaveNodeEdit = useCallback(() => {
    if (!editingNode) return;

    setNodes(nodes.map(n =>
      n.id === editingNode
        ? {
            ...n,
            stationId: nodeForm.stationId || n.stationId,
            data: {
              ...n.data,
              label: nodeForm.label,
              materials: nodeForm.materials
            }
          }
        : n
    ));

    setEditingNode(null);
  }, [editingNode, nodes, nodeForm]);

  const handleAddMaterial = useCallback(() => {
    setNodeForm({
      ...nodeForm,
      materials: [
        ...nodeForm.materials,
        { materialId: materials[0]?.id || '', quantity: 1 }
      ]
    });
  }, [nodeForm, materials]);

  const handleRemoveMaterial = useCallback((index: number) => {
    setNodeForm({
      ...nodeForm,
      materials: nodeForm.materials.filter((_, i) => i !== index)
    });
  }, [nodeForm]);

  const handleMaterialChange = useCallback((index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setNodeForm({
      ...nodeForm,
      materials: nodeForm.materials.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    });
  }, [nodeForm]);

  const handleSaveWorkflow = useCallback(() => {
    const finalNodes: FlowNode[] = nodes.map(({ isSelected, ...n }) => n);
    onSave(finalNodes, edges);
  }, [nodes, edges, onSave]);

  // Get node style based on type
  const getNodeStyle = (node: CanvasNode) => {
    const baseStyle = 'absolute cursor-pointer border-2 rounded-lg p-3 text-center transition-all';
    const selectedStyle = node.isSelected ? 'ring-4 ring-blue-400' : '';

    if (node.type === 'station') {
      return `${baseStyle} bg-blue-500 text-white border-blue-600 w-28 ${selectedStyle}`;
    } else if (node.type === 'split') {
      return `${baseStyle} bg-yellow-500 text-white border-yellow-600 w-24 ${selectedStyle}`;
    } else {
      return `${baseStyle} bg-green-500 text-white border-green-600 w-24 ${selectedStyle}`;
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Toolbar */}
      <div className="w-48 bg-white/5 rounded-lg p-4 space-y-3">
        <h3 className="text-white font-semibold mb-4">Tools</h3>

        <button
          onClick={() => setMode('select')}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            mode === 'select'
              ? 'bg-[#4682B4] text-white'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          ✋ Select
        </button>

        <button
          onClick={() => setMode('add-station')}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            mode === 'add-station'
              ? 'bg-[#4682B4] text-white'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          📍 Add Station
        </button>

        <button
          onClick={() => setMode('add-split')}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            mode === 'add-split'
              ? 'bg-[#4682B4] text-white'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          🔀 Add Split
        </button>

        <button
          onClick={() => setMode('add-merge')}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            mode === 'add-merge'
              ? 'bg-[#4682B4] text-white'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          🔃 Add Merge
        </button>

        <button
          onClick={() => {
            setMode('connect');
            setConnectingFrom(null);
          }}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            mode === 'connect'
              ? 'bg-[#4682B4] text-white'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          🔗 Connect
        </button>

        <div className="border-t border-white/10 pt-3 mt-3">
          {selectedNode && (
            <>
              <button
                onClick={handleEditNode}
                className="w-full px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors mb-2"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDeleteNode}
                className="w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>

        <div className="border-t border-white/10 pt-3 mt-3">
          <button
            onClick={handleSaveWorkflow}
            className="w-full gradient-button px-4 py-2 rounded-lg text-white font-medium"
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white/5 rounded-lg relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full relative"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* Draw edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const x1 = sourceNode.position.x + 60;
              const y1 = sourceNode.position.y + 40;
              const x2 = targetNode.position.x + 60;
              const y2 = targetNode.position.y + 40;

              return (
                <g key={edge.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#4682B4"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle
                    cx={(x1 + x2) / 2}
                    cy={(y1 + y2) / 2}
                    r="8"
                    fill="red"
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEdge(edge.id);
                    }}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    ×
                  </text>
                </g>
              );
            })}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#4682B4" />
              </marker>
            </defs>
          </svg>

          {/* Draw nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={getNodeStyle(node)}
              style={{
                left: node.position.x,
                top: node.position.y
              }}
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            >
              <div className="text-xs font-bold">{node.data.label}</div>
              {node.type === 'station' && node.stationId && (
                <div className="text-xs opacity-75 mt-1">
                  {stations.find(s => s.id === node.stationId)?.name || 'Unknown'}
                </div>
              )}
              {connectingFrom === node.id && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </div>
          ))}

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-3 rounded-lg max-w-xs">
            {mode === 'select' && <p>Click and drag nodes to reposition them</p>}
            {mode === 'add-station' && <p>Click anywhere to add a station node</p>}
            {mode === 'add-split' && <p>Click anywhere to add a split node (for parallel paths)</p>}
            {mode === 'add-merge' && <p>Click anywhere to add a merge node (to join parallel paths)</p>}
            {mode === 'connect' && connectingFrom === null && <p>Click the first node to start connection</p>}
            {mode === 'connect' && connectingFrom !== null && <p>Click the second node to complete connection</p>}
          </div>
        </div>
      </div>

      {/* Edit Node Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f3a] rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Edit Node</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#B0B3B8] mb-2 text-sm">Label</label>
                <input
                  type="text"
                  value={nodeForm.label}
                  onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                />
              </div>

              {nodes.find(n => n.id === editingNode)?.type === 'station' && (
                <>
                  <div>
                    <label className="block text-[#B0B3B8] mb-2 text-sm">Station</label>
                    <select
                      value={nodeForm.stationId}
                      onChange={(e) => setNodeForm({ ...nodeForm, stationId: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    >
                      {stations.map(station => (
                        <option key={station.id} value={station.id} className="bg-[#1a1f3a]">
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[#B0B3B8] text-sm">Materials Required</label>
                      <button
                        onClick={handleAddMaterial}
                        className="px-3 py-1 bg-[#4682B4] text-white text-sm rounded hover:bg-[#3a6a94] transition-colors"
                      >
                        + Add Material
                      </button>
                    </div>
                    <div className="space-y-2">
                      {nodeForm.materials.map((material, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            value={material.materialId}
                            onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                          >
                            {materials.map(mat => (
                              <option key={mat.id} value={mat.id} className="bg-[#1a1f3a]">
                                {mat.partName}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={material.quantity}
                            onChange={(e) => handleMaterialChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                            min="1"
                          />
                          <button
                            onClick={() => handleRemoveMaterial(index)}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setEditingNode(null)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNodeEdit}
                className="flex-1 gradient-button px-4 py-3 rounded-lg text-white font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
