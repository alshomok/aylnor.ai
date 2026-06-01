'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';

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

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-gold" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <TerminalIcon className="w-4 h-4 text-royal-blue-light" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'جاري التنفيذ...';
      case 'success':
        return 'تم التنفيذ بنجاح';
      case 'error':
        return 'حدث خطأ';
      default:
        return 'جاهز';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0a0f1a] rounded-xl border border-royal-blue/30 shadow-2xl shadow-royal-blue/20 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-royal-blue/30 bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-5 h-5 text-royal-blue-light" />
            <h2 className="text-sm font-semibold text-white">Aylnor Code Execution Engine</h2>
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/50 border border-royal-blue/20">
              {getStatusIcon()}
              <span className="text-xs text-muted-foreground">{getStatusText()}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Output Area */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/50"
            style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'bidi-override' as const }}
          >
            {output ? (
              <pre
                className={`whitespace-pre-wrap break-words ${
                  status === 'error' ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {output}
              </pre>
            ) : (
              <div className="text-muted-foreground">
                <p className="text-xs mb-2">Aylnor Terminal v1.0.0</p>
                <p className="text-xs">Ready to execute code...</p>
                <p className="text-xs mt-2">Enter your input below and press Enter to run.</p>
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-royal-blue/30 bg-[#0d1424]">
            <span className="text-green-400 font-mono text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter input (e.g., 5 10 15)..."
              disabled={isExecuting}
              className="flex-1 bg-transparent text-white placeholder-muted-foreground text-sm font-mono focus:outline-none"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
            <button
              onClick={handleRunCode}
              disabled={isExecuting}
              className="px-4 py-1.5 rounded-lg bg-royal-blue hover:bg-royal-blue/80 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
