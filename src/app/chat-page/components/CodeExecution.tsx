'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Check, AlertTriangle, ExternalLink, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import InteractiveInput from './InteractiveInput';
import TerminalModal from './TerminalModal';
import { CMDWindow } from './TerminalModal';

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
  const [showInput, setShowInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputCallback, setInputCallback] = useState<((value: string) => void) | null>(null);
  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isInlineTerminal, setIsInlineTerminal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pyodideRef = useRef<any>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInput = (value: string) => {
    setShowInput(false);
    if (inputCallback) {
      inputCallback(value);
      setInputCallback(null);
    }
  };

  const handleCloseInput = () => {
    setShowInput(false);
    setInputCallback(null);
    if (inputCallback) {
      inputCallback('');
      setInputCallback(null);
    }
  };

  const executeCode = async () => {
    setIsInlineTerminal(true);
    setIsExecuting(true);
    setOutput('');
    setError('');

    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          stdin: stdin || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output || 'تم التنفيذ بنجاح');
      } else {
        setError(data.error || 'حدث خطأ أثناء التنفيذ');
      }
    } catch (err) {
      setError('فشل الاتصال بخادم التنفيذ');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCode();
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
            onClick={() => setIsInlineTerminal(!isInlineTerminal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-royal-blue hover:bg-royal-blue/80 text-white text-xs font-medium rounded transition-colors"
            title="تشغيل الكود"
          >
            <Terminal size={14} />
            تشغيل
          </button>
        </div>
      </div>

      {/* Inline Terminal */}
      {isInlineTerminal && (
        <div className="border-t border-border">
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
            onExecute={executeCode}
            language={language}
          />
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Powered by Hugging Face Space • Click تشغيل to open inline terminal
        </p>
      </div>
    </div>
  );
}
