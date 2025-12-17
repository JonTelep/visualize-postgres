/**
 * Custom ReactFlow node component for displaying database tables.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { TableNodeData } from '../types/schema';

export const TableNode = memo(({ data }: NodeProps<TableNodeData>) => {
  const { tableName, columns } = data;

  return (
    <div className="table-node bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 min-w-[250px]">
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary-500 !w-3 !h-3 !border-2 !border-white dark:!border-gray-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary-500 !w-3 !h-3 !border-2 !border-white dark:!border-gray-800"
      />

      {/* Table header */}
      <div className="bg-primary-600 dark:bg-primary-700 text-white px-4 py-3 rounded-t-md">
        <h3 className="font-bold text-lg tracking-wide">{tableName}</h3>
      </div>

      {/* Columns list */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {columns.map((column) => (
          <div
            key={column.name}
            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              {/* Primary key icon */}
              {column.primaryKey && (
                <span className="text-yellow-500" title="Primary Key">
                  🔑
                </span>
              )}

              {/* Unique constraint icon */}
              {column.unique && !column.primaryKey && (
                <span className="text-blue-500" title="Unique">
                  ⚡
                </span>
              )}

              {/* Column name */}
              <span
                className={`font-mono font-semibold ${
                  column.primaryKey
                    ? 'text-yellow-700 dark:text-yellow-400'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {column.name}
              </span>

              {/* NOT NULL indicator */}
              {!column.nullable && (
                <span
                  className="text-xs text-red-600 dark:text-red-400"
                  title="NOT NULL"
                >
                  *
                </span>
              )}
            </div>

            {/* Data type */}
            <div className="ml-6 text-xs text-gray-500 dark:text-gray-400 font-mono">
              {column.type}
              {column.autoIncrement && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  AUTO
                </span>
              )}
              {column.default && (
                <span className="ml-2 text-purple-600 dark:text-purple-400">
                  DEFAULT
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with column count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-b-md text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
        {columns.length} {columns.length === 1 ? 'column' : 'columns'}
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';
