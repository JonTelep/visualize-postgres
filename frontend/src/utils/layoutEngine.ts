/**
 * Auto-layout engine for ER diagrams using Dagre.
 */

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { Schema, Table } from '../types/schema';
import type { DiagramNode, DiagramEdge } from '../types/schema';

// Node dimensions (approximate)
const NODE_WIDTH = 250;
const NODE_BASE_HEIGHT = 60;
const COLUMN_HEIGHT = 28;

/**
 * Convert schema to ReactFlow nodes and edges.
 */
export function convertSchemaToGraph(schema: Schema): {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
} {
  const nodes: DiagramNode[] = schema.tables.map((table) => ({
    id: table.name,
    type: 'tableNode',
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    data: {
      tableName: table.name,
      columns: table.columns,
    },
  }));

  const edges: DiagramEdge[] = schema.relationships.map((rel, index) => {
    const label = [];
    if (rel.onDelete) label.push(`ON DELETE ${rel.onDelete}`);
    if (rel.onUpdate) label.push(`ON UPDATE ${rel.onUpdate}`);

    return {
      id: `${rel.fromTable}-${rel.fromColumn}-${rel.toTable}-${rel.toColumn}-${index}`,
      source: rel.fromTable,
      target: rel.toTable,
      label: label.join(', ') || undefined,
      animated: true,
      type: 'smoothstep',
    };
  });

  return { nodes, edges };
}

/**
 * Calculate node height based on number of columns.
 */
function getNodeHeight(table: Table): number {
  return NODE_BASE_HEIGHT + (table.columns.length * COLUMN_HEIGHT);
}

/**
 * Apply Dagre layout algorithm to position nodes.
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  schema: Schema,
  direction: 'TB' | 'LR' = 'TB'
): {
  nodes: Node[];
  edges: Edge[];
} {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre graph with calculated dimensions
  nodes.forEach((node) => {
    const table = schema.tables.find((t) => t.name === node.id);
    const height = table ? getNodeHeight(table) : NODE_BASE_HEIGHT;

    dagreGraph.setNode(node.id, {
      width: isHorizontal ? height : NODE_WIDTH,
      height: isHorizontal ? NODE_WIDTH : height,
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const table = schema.tables.find((t) => t.name === node.id);
    const height = table ? getNodeHeight(table) : NODE_BASE_HEIGHT;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Build a dependency graph to understand table relationships.
 * Returns a map of table name to its dependencies.
 */
export function buildDependencyGraph(schema: Schema): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  // Initialize with all tables
  schema.tables.forEach((table) => {
    graph.set(table.name, new Set());
  });

  // Add dependencies from foreign keys
  schema.relationships.forEach((rel) => {
    const deps = graph.get(rel.fromTable);
    if (deps) {
      deps.add(rel.toTable);
    }
  });

  return graph;
}

/**
 * Get tables in topological order (dependencies first).
 */
export function getTopologicalOrder(schema: Schema): string[] {
  const graph = buildDependencyGraph(schema);
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(tableName: string) {
    if (visited.has(tableName)) return;
    visited.add(tableName);

    const deps = graph.get(tableName);
    if (deps) {
      deps.forEach((dep) => visit(dep));
    }

    result.push(tableName);
  }

  schema.tables.forEach((table) => visit(table.name));

  return result.reverse();
}
