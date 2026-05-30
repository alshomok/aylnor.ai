'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Check, AlertTriangle, ExternalLink } from 'lucide-react';

interface CodeExecutionProps {
  code: string;
  language: string;
}

// Supported languages with client-side execution
const SUPPORTED_LANGUAGES = [
  'javascript', 'js', 'typescript', 'ts',
  'html', 'css',
  'python', 'py',
  'c', 'cpp', 'c++'
];

export default function CodeExecution({ code, language }: CodeExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pyodideRef = useRef<any>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeCode = async () => {
    setIsExecuting(true);
    setError('');
    setOutput('');

    const langKey = language.toLowerCase();
    console.log('Executing code for language:', langKey);

    if (!SUPPORTED_LANGUAGES.includes(langKey)) {
      setError(`Language "${language}" is not supported. Supported: JavaScript, TypeScript, Python, C, C++, HTML, CSS.`);
      setIsExecuting(false);
      return;
    }

    try {
      // Handle HTML with iframe using srcDoc
      if (langKey === 'html') {
        console.log('Executing HTML code');
        if (iframeRef.current) {
          iframeRef.current.srcdoc = code;
          setOutput('HTML rendered in preview below');
          setShowOutput(true);
        }
        setIsExecuting(false);
        return;
      }

      // Handle CSS
      if (langKey === 'css') {
        setError('CSS execution requires HTML context. Please use HTML with embedded CSS.');
        setIsExecuting(false);
        return;
      }

      // Handle JavaScript/TypeScript with eval
      if (langKey === 'javascript' || langKey === 'js' || langKey === 'typescript' || langKey === 'ts') {
        console.log('Executing JavaScript/TypeScript code');
        const consoleOutput: string[] = [];
        const originalConsole = { ...console };

        // Override console methods to capture output
        console.log = (...args: any[]) => {
          consoleOutput.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
          originalConsole.log(...args);
        };

        console.error = (...args: any[]) => {
          consoleOutput.push('ERROR: ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
          originalConsole.error(...args);
        };

        console.warn = (...args: any[]) => {
          consoleOutput.push('WARN: ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
          originalConsole.warn(...args);
        };

        try {
          // Remove TypeScript type annotations for execution
          const jsCode = code
            .replace(/:\s*\w+/g, '') // Remove type annotations
            .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
            .replace(/type\s+\w+\s*=[^;]+;/g, '') // Remove type aliases
            .replace(/import\s+.*from\s+['"][^'"]+['"]/g, '') // Remove imports
            .replace(/export\s+(default|const|let|var|function|class)/g, '$1'); // Remove exports

          console.log('Processed JS code:', jsCode);
          
          // Execute the code
          const result = eval(jsCode);
          
          if (result !== undefined) {
            consoleOutput.push(String(result));
          }

          setOutput(consoleOutput.join('\n') || 'Code executed successfully (no output)');
        } catch (e) {
          console.error('JS execution error:', e);
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          // Restore console
          Object.assign(console, originalConsole);
        }
        setIsExecuting(false);
        return;
      }

      // Handle Python with Pyodide (WebAssembly)
      if (langKey === 'python' || langKey === 'py') {
        console.log('Executing Python code');
        try {
          // Load Pyodide if not already loaded
          if (!pyodideRef.current) {
            console.log('Loading Pyodide...');
            const pyodideScript = document.createElement('script');
            pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            document.head.appendChild(pyodideScript);
            
            await new Promise((resolve, reject) => {
              pyodideScript.onload = resolve;
              pyodideScript.onerror = reject;
            });

            pyodideRef.current = await (window as any).loadPyodide();
            console.log('Pyodide loaded successfully');
          }

          const pyodide = pyodideRef.current;
          
          // Capture stdout
          pyodide.setStdout({
            batched: (text: string) => {
              setOutput(prev => prev + text);
            }
          });
          
          pyodide.setStderr({
            batched: (text: string) => {
              setError(prev => prev + text);
            }
          });

          // Run Python code
          await pyodide.runPythonAsync(code);
          
          if (!output && !error) {
            setOutput('Code executed successfully (no output)');
          }
        } catch (e) {
          console.error('Python execution error:', e);
          setError(e instanceof Error ? e.message : String(e));
        }
        setIsExecuting(false);
        return;
      }

      // Handle C and C++ with server-side API
      if (langKey === 'c' || langKey === 'cpp' || langKey === 'c++') {
        console.log('Executing C/C++ code via server API');
        try {
          const response = await fetch('/api/execute-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: langKey === 'c' ? 'cpp' : 'cpp',
              code: code,
              options: {}
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to execute code');
          }

          const result = await response.json();
          
          if (result.errors) {
            setError(result.errors);
          }
          
          setOutput(result.output || 'Code executed successfully (no output)');
          setShowOutput(true);
        } catch (e) {
          console.error('C/C++ execution error:', e);
          setError(e instanceof Error ? e.message : String(e));
        }
        setIsExecuting(false);
        return;
      }
    } catch (e) {
      console.error('Execution error:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsExecuting(false);
    }
  };

  const isSupported = SUPPORTED_LANGUAGES.includes(language.toLowerCase());

  if (!isSupported) {
    return null;
  }

  return (
    <div className="mt-4 border border-border rounded-lg overflow-hidden bg-muted/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
          {showOutput && language === 'html' && (
            <span className="text-xs text-green-600">Preview Mode</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-muted-foreground/10 rounded transition-colors"
            title="نسخ الكود"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          </button>
          <button
            onClick={executeCode}
            disabled={isExecuting}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-xs font-medium rounded transition-colors"
            title="تشغيل الكود"
          >
            {isExecuting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التشغيل...
              </>
            ) : (
              <>
                <Play size={14} />
                تشغيل
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      {(output || error) && (
        <div className={`p-4 text-sm font-mono ${error ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'}`}>
          {error && (
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span className="font-medium">خطأ:</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap break-words">{error || output}</pre>
          <button
            onClick={() => { setOutput(''); setError(''); setShowOutput(false); }}
            className="mt-2 text-xs underline hover:no-underline"
          >
            إخفاء
          </button>
        </div>
      )}

      {/* HTML Preview */}
      {showOutput && language === 'html' && (
        <div className="border-t border-border">
          <iframe
            ref={iframeRef}
            title="HTML Preview"
            className="w-full h-64"
            sandbox="allow-scripts"
          />
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Server-side execution • Powered by Piston API
        </p>
      </div>
    </div>
  );
}
