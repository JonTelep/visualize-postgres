/**
 * DDL Editor component using Monaco Editor.
 */

import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { ParseError } from '../types/schema';

interface DDLEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: ParseError[];
  isDark?: boolean;
}

// Example DDL template
export const EXAMPLE_DDL = `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE posts ADD CONSTRAINT check_title_length
    CHECK (length(title) > 5);`;

export function DDLEditor({ value, onChange, errors = [], isDark = false }: DDLEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  // Configure Monaco editor options
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    tabSize: 4,
    wordWrap: 'on',
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    matchBrackets: 'always',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoIndent: 'full',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
  };

  // Update error markers when errors change
  React.useEffect(() => {
    if (!editorRef.current) return;

    const monaco = (window as any).monaco;
    if (!monaco) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    // Clear previous markers
    monaco.editor.setModelMarkers(model, 'sql-parser', []);

    if (errors.length > 0) {
      // Add new error markers
      const markers = errors.map((error) => ({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: error.line || 1,
        startColumn: error.column || 1,
        endLineNumber: error.line || 1,
        endColumn: error.column + 1 || 100,
        message: error.message,
      }));

      monaco.editor.setModelMarkers(model, 'sql-parser', markers);
    }
  }, [errors]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={isDark ? 'vs-dark' : 'vs-light'}
        options={editorOptions}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
