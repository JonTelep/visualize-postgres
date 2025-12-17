/**
 * ER Diagram viewer component using ReactFlow.
 */

import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TableNode } from './TableNode';
import { convertSchemaToGraph, getLayoutedElements } from '../utils/layoutEngine';
import type { Schema } from '../types/schema';

interface DiagramViewProps {
  schema: Schema | null;
  isLoading?: boolean;
}

const nodeTypes = {
  tableNode: TableNode,
};

export function DiagramView({ schema, isLoading = false }: DiagramViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update diagram when schema changes
  useEffect(() => {
    if (!schema || schema.tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      // Convert schema to graph
      const { nodes: initialNodes, edges: initialEdges } = convertSchemaToGraph(schema);

      // Apply auto-layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        schema,
        'TB' // Top to bottom layout
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Error building diagram:', error);
      setNodes([]);
      setEdges([]);
    }
  }, [schema, setNodes, setEdges]);

  // Custom edge styling
  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: { strokeWidth: 2, stroke: '#3b82f6' },
    }),
    []
  );

  // Empty state
  if (!schema || schema.tables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Diagram to Display
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {isLoading
              ? 'Parsing DDL...'
              : 'Enter PostgreSQL DDL in the editor to visualize your schema'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background
          gap={16}
          size={1}
          className="bg-gray-50 dark:bg-gray-900"
        />
        <Controls
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        />
        <MiniMap
          nodeClassName={(node) =>
            node.type === 'tableNode' ? 'minimap-table-node' : ''
          }
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
