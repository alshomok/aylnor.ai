'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Check, X, AlertTriangle, ExternalLink } from 'lucide-react';

interface CodeExecutionProps {
  code: string;
  language: string;
}

// Language mapping for Piston API
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '*' },
  typescript: { language: 'typescript', version: '*' },
  python: { language: 'python', version: '3.12.0' },
  rust: { language: 'rust', version: '*' },
  go: { language: 'go', version: '*' },
  c: { language: 'c', version: '*' },
  'c++': { language: 'c++', version: '*' },
  cpp: { language: 'c++', version: '*' },
  java: { language: 'java', version: '*' },
  csharp: { language: 'csharp', version: '*' },
  'c#': { language: 'csharp', version: '*' },
  swift: { language: 'swift', version: '*' },
  kotlin: { language: 'kotlin', version: '*' },
  ruby: { language: 'ruby', version: '*' },
  php: { language: 'php', version: '*' },
  scala: { language: 'scala', version: '*' },
  haskell: { language: 'haskell', version: '*' },
  elixir: { language: 'elixir', version: '*' },
  clojure: { language: 'clojure', version: '*' },
  julia: { language: 'julia', version: '*' },
  r: { language: 'r', version: '*' },
  matlab: { language: 'octave', version: '*' }, // Octave as MATLAB alternative
  lua: { language: 'lua', version: '*' },
  dart: { language: 'dart', version: '*' },
  html: { language: 'html', version: '*' },
  css: { language: 'css', version: '*' },
};

export default function CodeExecution({ code, language }: CodeExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    const langConfig = LANGUAGE_MAP[langKey];

    if (!langConfig) {
      setError(`Language "${language}" is not supported for execution.`);
      setIsExecuting(false);
      return;
    }

    try {
      // Handle HTML/CSS with iframe
      if (langKey === 'html') {
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(code);
            doc.close();
            setOutput('HTML rendered in preview below');
            setShowOutput(true);
          }
        }
        setIsExecuting(false);
        return;
      }

      if (langKey === 'css') {
        setError('CSS execution requires HTML context. Please use HTML with embedded CSS.');
        setIsExecuting(false);
        return;
      }

      // Use Piston API for other languages
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [
            {
              content: code,
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.run) {
        if (data.run.stdout) {
          setOutput(data.run.stdout);
        }
        if (data.run.stderr) {
          setError(data.run.stderr);
        }
        if (data.run.code !== 0 && !data.run.stderr) {
          setError(`Execution failed with exit code ${data.run.code}`);
        }
      } else if (data.message) {
        setError(data.message);
      } else {
        setOutput('Code executed successfully (no output)');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsExecuting(false);
    }
  };

  const langConfig = LANGUAGE_MAP[language.toLowerCase()];

  if (!langConfig) {
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

      {/* API Attribution */}
      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        <a
          href="https://emkc.org/api/v2/piston"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink size={12} />
          Powered by Piston API
        </a>
      </div>
    </div>
  );
}
