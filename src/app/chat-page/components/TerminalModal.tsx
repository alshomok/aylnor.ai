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

// CMD Window Component - VS Code 2008 style
function CMDWindow({ 
  title = "C:\\Windows\\System32\\cmd.exe",
  code,
  output,
  stdin,
  showCode = true,
  showOutput = true,
  isExecuting,
  onExecute,
  onStdinChange,
  onKeyDown
}: {
  title?: string;
  code?: string;
  output?: string;
  stdin?: string;
  showCode?: boolean;
  showOutput?: boolean;
  isExecuting?: boolean;
  onExecute?: () => void;
  onStdinChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const [displayedOutput, setDisplayedOutput] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typing effect for output
  useEffect(() => {
    if (output && showOutput) {
      setDisplayedOutput("");
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index < output.length) {
          setDisplayedOutput(output.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 15);
      return () => clearInterval(interval);
    }
  }, [output, showOutput]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayedOutput]);

  return (
    <div className="bg-black rounded-none overflow-hidden shadow-2xl border border-neutral-700 w-full">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-royal-blue to-gold px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4">
            <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
              <rect width="16" height="16" fill="#0c0c0c"/>
              <text x="2" y="12" fontSize="10" fill="#ccc" fontFamily="Consolas">C:</text>
            </svg>
          </div>
          <span className="text-white text-xs font-mono">{title}</span>
        </div>
        <div className="flex">
          <button className="w-11 h-6 hover:bg-white/10 text-white/70 text-xs flex items-center justify-center">
            ─
          </button>
          <button className="w-11 h-6 hover:bg-white/10 text-white/70 text-xs flex items-center justify-center">
            □
          </button>
          <button className="w-11 h-6 hover:bg-red-600 text-white/70 hover:text-white text-xs flex items-center justify-center">
            ✕
          </button>
        </div>
      </div>

      {/* CMD Content */}
      <div
        ref={outputRef}
        className="p-3 min-h-[300px] max-h-[500px] overflow-y-auto"
        style={{ 
          backgroundColor: "#0c0c0c",
          fontFamily: "'Consolas', 'Courier New', monospace"
        }}
      >
        {/* Display Code */}
        {showCode && code && (
          <div className="mb-4">
            <div className="text-neutral-500 text-xs mb-1">
              C:\Users\User\Desktop&gt;type program.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'cpp'}
            </div>
            <pre className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
              {code}
            </pre>
            <div className="text-neutral-500 text-xs mt-3">
              C:\Users\User\Desktop&gt;program.exe
            </div>
          </div>
        )}

        {/* Display Output */}
        {showOutput && output && (
          <div>
            {!showCode && (
              <div className="text-neutral-500 text-xs mb-2">
                C:\Users\User\Desktop&gt;program.exe
              </div>
            )}
            <pre className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
              {displayedOutput}
            </pre>
          </div>
        )}

        {/* Cursor */}
        <div className="flex items-center mt-2">
          <span className="text-neutral-500 text-sm">
            {!isTyping && "C:\\Users\\User\\Desktop>"}
          </span>
          {onStdinChange && (
            <input
              ref={inputRef}
              type="text"
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white text-sm font-mono ml-1"
              placeholder="Enter input..."
              style={{
                direction: 'ltr' as const,
                textAlign: 'left' as const,
                unicodeBidi: 'bidi-override' as const,
              }}
            />
          )}
          {!onStdinChange && (
            <span
              className={`w-2 h-4 bg-neutral-300 ml-0.5 inline-block ${
                showCursor ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TerminalModal({ isOpen, onClose, code, language }: TerminalModalProps) {
  const [output, setOutput] = useState('');
  const [stdin, setStdin] = useState('');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [isExecuting, setIsExecuting] = useState(false);

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
      <div className="w-full max-w-4xl flex flex-col max-h-[80vh] relative">
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-neutral-800 text-white p-2 rounded-md md:hidden"
        >
          <X size={20} />
        </button>

        {/* CMD Window */}
        <CMDWindow
          title={`C:\\Windows\\System32\\cmd.exe - ${language.toUpperCase()} Compiler`}
          code={code}
          output={output}
          stdin={stdin}
          showCode={true}
          showOutput={!!output}
          isExecuting={isExecuting}
          onStdinChange={setStdin}
          onKeyDown={handleKeyDown}
        />

        {/* Execute Button */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className="px-4 py-2 bg-gradient-to-r from-royal-blue to-gold text-white rounded-lg hover:shadow-lg hover:shadow-royal-blue/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isExecuting ? 'جاري التنفيذ...' : 'تشغيل'}
          </button>
        </div>
      </div>
    </div>
  );
}
