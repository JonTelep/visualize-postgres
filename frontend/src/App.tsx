/**
 * Main application component.
 */

import { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { DDLEditor, EXAMPLE_DDL } from './components/DDLEditor';
import { DiagramView } from './components/DiagramView';
import { SplitPane } from './components/SplitPane';

import { parseDDL } from './utils/api';
import type { Schema, ParseError } from './types/schema';

// LocalStorage keys
const STORAGE_KEY_DDL = 'visualize-postgres:ddl';
const STORAGE_KEY_DARK_MODE = 'visualize-postgres:dark-mode';

// Debounce timeout
const DEBOUNCE_DELAY = 500;

function App() {
  // Load dark mode preference from localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DARK_MODE);
    return saved ? JSON.parse(saved) : false;
  });

  // Load DDL from localStorage or use empty string
  const [ddl, setDdl] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DDL);
    return saved || '';
  });

  const [schema, setSchema] = useState<Schema | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [parseTime, setParseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes] = useState<any[]>([]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(isDark));
  }, [isDark]);

  // Save DDL to localStorage
  useEffect(() => {
    if (ddl) {
      localStorage.setItem(STORAGE_KEY_DDL, ddl);
    }
  }, [ddl]);

  // Parse DDL with debouncing
  useEffect(() => {
    if (!ddl.trim()) {
      setSchema(null);
      setErrors([]);
      setIsValid(null);
      setParseTime(null);
      setNodes([]);
      return;
    }

    setIsLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const result = await parseDDL(ddl);

        if (result.valid) {
          setSchema(result.schema);
          setErrors([]);
          setIsValid(true);
          setParseTime(result.parseTime);
        } else {
          setSchema(null);
          setErrors(result.errors);
          setIsValid(false);
          setParseTime(null);
        }
      } catch (error) {
        console.error('Error parsing DDL:', error);
        setSchema(null);
        setErrors([
          {
            line: 0,
            column: 0,
            message: 'Failed to parse DDL. Please check your connection to the backend.',
          },
        ]);
        setIsValid(false);
        setParseTime(null);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [ddl]);

  // Handle load example
  const handleLoadExample = useCallback(() => {
    setDdl(EXAMPLE_DDL);
    toast.success('Example DDL loaded!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  }, []);

  // Handle dark mode toggle
  const handleToggleDarkMode = useCallback(() => {
    setIsDark((prev: boolean) => !prev);
  }, []);

  // Handle DDL change
  const handleDdlChange = useCallback((value: string) => {
    setDdl(value);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Toolbar
        onLoadExample={handleLoadExample}
        onToggleDarkMode={handleToggleDarkMode}
        isDark={isDark}
        nodes={nodes}
        ddl={ddl}
      />

      <div className="flex-1 overflow-hidden">
        <SplitPane
          left={
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
              <div className="flex-1 overflow-hidden">
                <DDLEditor
                  value={ddl}
                  onChange={handleDdlChange}
                  errors={errors}
                  isDark={isDark}
                />
              </div>
            </div>
          }
          right={
            <DiagramView
              schema={schema}
              isLoading={isLoading}
            />
          }
          defaultSize={50}
          minSize={20}
          maxSize={80}
        />
      </div>

      <StatusBar
        isValid={isValid}
        parseTime={parseTime}
        errors={errors}
        schema={schema}
        isLoading={isLoading}
      />

      <ToastContainer
        position="bottom-right"
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
}

export default App;
