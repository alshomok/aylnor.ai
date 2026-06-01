'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export default function TerminalModal({ isOpen, onClose, code, language }: TerminalModalProps) {
  const [output, setOutput] = useState('');
  const [stdin, setStdin] = useState('');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setStatus('running');
    setOutput('');

    try {
      // Map language names for Hugging Face Space
      const languageMap: Record<string, string> = {
        python: 'python',
        javascript: 'javascript',
        typescript: 'javascript',
        cpp: 'cpp',
        'c++': 'cpp',
        c: 'c',
        java: 'java',
        go: 'go',
        rust: 'rust',
        php: 'php',
        ruby: 'ruby',
        bash: 'bash',
        sql: 'sql',
      };

      const mappedLanguage = languageMap[language] || language;

      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: mappedLanguage,
          stdin: stdin || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      const result = await response.json();

      if (result.isError) {
        setStatus('error');
        setOutput(result.output);
      } else {
        setStatus('success');
        setOutput(result.output || 'تم التنفيذ بنجاح');
      }
    } catch (error) {
      setStatus('error');
      setOutput(error instanceof Error ? error.message : 'Failed to execute code');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRunCode();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-black rounded-lg border border-gray-800 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span className="text-xs text-gray-400 font-mono">Console Window - CMD</span>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Output Area - Classic Black Console */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#0c0c0c] h-[300px]"
            style={{
              direction: 'ltr' as const,
              textAlign: 'left' as const,
              unicodeBidi: 'bidi-override' as const,
            }}
          >
            {output ? (
              <div
                className={`${
                  status === 'error' ? 'text-red-400' : 'text-[#00ff00]'
                }`}
                style={{
                  direction: 'ltr' as const,
                  textAlign: 'left' as const,
                  unicodeBidi: 'bidi-override' as const,
                }}
              >
                {output.split('\n').map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-white"
                style={{
                  direction: 'ltr' as const,
                  textAlign: 'left' as const,
                  unicodeBidi: 'bidi-override' as const,
                }}
              >
                <p className="text-xs mb-2">Microsoft Windows [Version 10.0.19045.4291]</p>
                <p className="text-xs">(c) Aylnor Corporation. All rights reserved.</p>
                <p className="text-xs mt-4">Aylnor Console v1.0.0</p>
                <p className="text-xs mt-2">Ready to execute code...</p>
                <p className="text-xs mt-2">Enter input below and press Enter to run.</p>
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="flex items-center px-4 py-2 bg-gray-900 border-t border-gray-800">
            <span className="text-[#00ff00] font-mono text-sm mr-2">C:&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter input (e.g., 5 10 15)..."
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-gray-600 text-sm font-mono w-full"
              style={{
                direction: 'ltr' as const,
                textAlign: 'left' as const,
                unicodeBidi: 'bidi-override' as const,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
