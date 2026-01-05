'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowInstance,
  BackgroundVariant,
  MarkerType,
  SelectionMode,
  ConnectionLineType,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Box, Button, Typography, Alert, CircularProgress, Chip } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import OperationNode from './OperationNode';
import OperationsSidebar from './OperationsSidebar';
import NodeEditModal from './NodeEditModal';
import {
  getRoutingWithGraph,
  createRoutingNode,
  updateRoutingNode,
  deleteRoutingNode,
  createRoutingEdge,
  deleteRoutingEdge,
} from '@/utils/routingsAccess';
import type {
  RoutingWithGraph,
  OperationNodeData,
  RoutingNodeFormData,
} from '@/types/routings';
import {
  toFlowElements as convertToFlowElements,
  calculateRoutingTime as calcTime,
  formatTime as fmtTime,
} from '@/types/routings';

// Define custom node types
const nodeTypes: NodeTypes = {
  operation: OperationNode,
};

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

/**
 * Apply dagre auto-layout to position nodes.
 */
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

interface RoutingWorkflowBuilderProps {
  routingId: string;
  companyId: string;
  onRoutingUpdate?: () => void;
}

/**
 * Visual workflow builder for routing operations using React Flow.
 * Supports drag-and-drop from sidebar, connecting operations, and editing.
 */
export default function RoutingWorkflowBuilder({
  routingId,
  companyId,
  onRoutingUpdate,
}: RoutingWorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // State
  const [routing, setRouting] = useState<RoutingWithGraph | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OperationNodeData | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Miro-style navigation: spacebar + drag to pan
  const [spacebarPressed, setSpacebarPressed] = useState(false);

  // Keyboard listener for spacebar pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        // Only prevent default if we're focused on the canvas area
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setSpacebarPressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacebarPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Load routing data
  useEffect(() => {
    async function loadRouting() {
      try {
        const data = await getRoutingWithGraph(routingId);
        if (data) {
          setRouting(data);
          const { nodes: flowNodes, edges: flowEdges } = convertToFlowElements(
            data.nodes,
            data.edges
          );
          // Apply auto-layout
          const layouted = getLayoutedElements(flowNodes, flowEdges);
          setNodes(layouted.nodes);
          setEdges(layouted.edges);
        }
      } catch (err) {
        console.error('Failed to load routing:', err);
        setError('Failed to load routing data');
      } finally {
        setLoading(false);
      }
    }
    loadRouting();
  }, [routingId, setNodes, setEdges]);

  // Calculate time totals
  const timeTotals = useMemo(() => {
    if (!routing) return null;
    return calcTime(routing.nodes);
  }, [routing]);

  // Handle new edge connection
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        // Create edge in database
        const newEdge = await createRoutingEdge(
          routingId,
          connection.source,
          connection.target
        );

        // Add to React Flow
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: newEdge.id,
              type: 'smoothstep',
              animated: false,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#4682B4' },
            },
            eds
          )
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create connection';
        setError(message);
      }
    },
    [routingId, setEdges]
  );

  // Handle dropping new operation from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (type !== 'operation') return;

      const operationTypeId = event.dataTransfer.getData('operationTypeId');
      const operationName = event.dataTransfer.getData('operationName');
      const laborRateStr = event.dataTransfer.getData('laborRate');
      const laborRate = laborRateStr ? parseFloat(laborRateStr) : null;

      if (!operationTypeId || !reactFlowInstance || !reactFlowWrapper.current) return;

      // Calculate drop position
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      try {
        // Create node in database
        const newNode = await createRoutingNode(routingId, {
          operation_type_id: operationTypeId,
          setup_time: '',
          run_time_per_unit: '',
          instructions: '',
        });

        // Add to React Flow
        const flowNode: Node = {
          id: newNode.id,
          type: 'operation',
          position,
          data: {
            nodeId: newNode.id,
            operationTypeId,
            operationName,
            resourceGroupName: null,
            setupTime: null,
            runTimePerUnit: null,
            instructions: null,
            laborRate,
          } as OperationNodeData,
        };

        setNodes((nds) => [...nds, flowNode]);

        // Update routing data for time calculations
        if (routing) {
          setRouting({
            ...routing,
            nodes: [
              ...routing.nodes,
              {
                ...newNode,
                operation_type: {
                  id: operationTypeId,
                  name: operationName,
                  labor_rate: laborRate,
                  resource_group_id: null,
                },
              },
            ],
          });
        }
      } catch (err) {
        console.error('Failed to create node:', err);
        setError('Failed to add operation');
      }
    },
    [reactFlowInstance, routingId, routing, setNodes]
  );

  // Handle node edit
  const handleNodeEdit = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.data) {
        setEditingNode(node.data as OperationNodeData);
        setEditingNodeId(nodeId);
        setEditModalOpen(true);
      }
    },
    [nodes]
  );

  // Handle node delete
  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      try {
        await deleteRoutingNode(nodeId);
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        // Also remove connected edges
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

        // Update routing data
        if (routing) {
          setRouting({
            ...routing,
            nodes: routing.nodes.filter((n) => n.id !== nodeId),
            edges: routing.edges.filter(
              (e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId
            ),
          });
        }
      } catch (err) {
        console.error('Failed to delete node:', err);
        setError('Failed to delete operation');
      }
    },
    [routing, setNodes, setEdges]
  );

  // Handle edge delete
  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      for (const edge of edgesToDelete) {
        try {
          await deleteRoutingEdge(edge.id);
        } catch (err) {
          console.error('Failed to delete edge:', err);
        }
      }
    },
    []
  );

  // Handle node update from modal
  const handleNodeSave = useCallback(
    async (formData: RoutingNodeFormData) => {
      if (!editingNodeId) return;

      try {
        await updateRoutingNode(editingNodeId, formData);

        // Update React Flow node
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === editingNodeId) {
              const data = n.data as OperationNodeData;
              return {
                ...n,
                data: {
                  ...data,
                  setupTime: formData.setup_time ? parseFloat(formData.setup_time) : null,
                  runTimePerUnit: formData.run_time_per_unit
                    ? parseFloat(formData.run_time_per_unit)
                    : null,
                  instructions: formData.instructions || null,
                } as OperationNodeData,
              };
            }
            return n;
          })
        );

        // Update routing data for time calculations
        if (routing) {
          setRouting({
            ...routing,
            nodes: routing.nodes.map((n) => {
              if (n.id === editingNodeId) {
                return {
                  ...n,
                  setup_time: formData.setup_time ? parseFloat(formData.setup_time) : null,
                  run_time_per_unit: formData.run_time_per_unit
                    ? parseFloat(formData.run_time_per_unit)
                    : null,
                  instructions: formData.instructions || null,
                };
              }
              return n;
            }),
          });
        }

        onRoutingUpdate?.();
      } catch (err) {
        console.error('Failed to update node:', err);
        throw err;
      }
    },
    [editingNodeId, routing, setNodes, onRoutingUpdate]
  );

  // Apply auto-layout
  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes(layouted.nodes);
  }, [nodes, edges, setNodes]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 500 }}>
      {/* Operations Sidebar */}
      <OperationsSidebar
        companyId={companyId}
        onDragStart={() => {}}
      />

      {/* Workflow Canvas */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ m: 1, mb: 0 }}
          >
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: 'rgba(17, 20, 57, 0.95)',
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixHighIcon />}
            onClick={handleAutoLayout}
          >
            Auto Layout
          </Button>

          <Box sx={{ flex: 1 }} />

          {/* Time Summary */}
          {timeTotals && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Setup: ${fmtTime(timeTotals.setupTime)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Run: ${fmtTime(timeTotals.runTime)}/unit`}
                size="small"
                variant="outlined"
              />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            {nodes.length} operation{nodes.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* React Flow Canvas */}
        <Box
          ref={reactFlowWrapper}
          sx={{
            flex: 1,
            // Style React Flow controls for dark theme
            '& .react-flow__controls': {
              backgroundColor: 'rgba(17, 20, 57, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
            },
            '& .react-flow__controls-button': {
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(70, 130, 180, 0.3)',
              },
              '&:last-child': {
                borderBottom: 'none',
              },
              '& svg': {
                fill: '#fff',
              },
            },
            // Edge selection and hover styles
            '& .react-flow__edge.selected .react-flow__edge-path': {
              stroke: '#ef4444',
              strokeWidth: 3,
            },
            '& .react-flow__edge:hover .react-flow__edge-path': {
              stroke: '#6ba3d1',
              strokeWidth: 3,
              cursor: 'pointer',
            },
            // Selection box styling
            '& .react-flow__selection': {
              backgroundColor: 'rgba(70, 130, 180, 0.15)',
              border: '1px dashed #4682B4',
            },
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            onNodeDoubleClick={(_, node) => handleNodeEdit(node.id)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            // Miro-style navigation: spacebar + drag to pan, otherwise drag to select
            panOnDrag={spacebarPressed}
            selectionOnDrag={!spacebarPressed}
            selectionMode={SelectionMode.Partial}
            selectNodesOnDrag={true}
            // Trackpad support: two-finger scroll pans, pinch zooms
            panOnScroll={true}
            zoomOnScroll={false}
            zoomOnPinch={true}
            // Connection line styling
            connectionLineStyle={{ stroke: '#4682B4', strokeWidth: 2 }}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#4682B4', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#4682B4' },
              selectable: true,
            }}
            style={{
              backgroundColor: '#0a0c1a',
              cursor: spacebarPressed ? 'grab' : 'default',
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Controls />
            <MiniMap
              style={{
                backgroundColor: 'rgba(17, 20, 57, 0.9)',
              }}
              nodeColor="#4682B4"
              maskColor="rgba(0, 0, 0, 0.5)"
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
          </ReactFlow>
        </Box>

        {/* Empty state */}
        {nodes.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No operations yet
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Drag operations from the sidebar to build your workflow
            </Typography>
          </Box>
        )}
      </Box>

      {/* Edit Modal */}
      <NodeEditModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingNode(null);
          setEditingNodeId(null);
        }}
        onSave={handleNodeSave}
        nodeData={editingNode}
      />
    </Box>
  );
}
