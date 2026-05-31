'use client';
import React, { useState } from 'react';
import { Play, Terminal, Code2, X } from 'lucide-react';

interface CodeRunnerProps {
  cppCode: string;
}

export default function CodeRunner({ cppCode }: CodeRunnerProps) {
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasOutput, setHasOutput] = useState(false);

  const handleRunCode = async () => {
    if (!cppCode.trim()) return;

    setIsRunning(true);
    setOutput('');
    setIsError(false);
    setHasOutput(false);

    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: cppCode,
          stdin: stdin,
        }),
      });

      const result = await response.json();

      if (result.output) {
        setOutput(result.output);
        setHasOutput(true);
      }

      setIsError(result.isError || false);
    } catch (error) {
      setOutput('فشل الاتصال بالخادم');
      setIsError(true);
      setHasOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
    setHasOutput(false);
    setIsError(false);
  };

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 size={18} className="text-cyan-400" />
          <span className="text-sm font-bold text-white">C++ Code Runner</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Interactive Execution</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/30 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">الكود المصدري</span>
            <span className="text-xs text-slate-500">C++</span>
          </div>
          <pre className="p-4 overflow-x-auto text-sm text-cyan-300 font-mono leading-6 bg-slate-950/50" dir="ltr">
            <code>{cppCode || 'لا يوجد كود للعرض'}</code>
          </pre>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Terminal size={14} className="text-cyan-400" />
            المدخلات (Inputs) - إن وجدت
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="أدخل المدخلات هنا (مثل: 5 10 15)..."
            className="w-full min-h-[80px] px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none font-mono"
            dir="ltr"
          />
        </div>

        <button
          onClick={handleRunCode}
          disabled={isRunning || !cppCode.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-600 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>جاري التنفيذ...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>تشغيل الكود</span>
            </>
          )}
        </button>

        {hasOutput && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Terminal size={14} className={isError ? 'text-red-400' : 'text-green-400'} />
                المخرجات (Output)
              </label>
              <button
                onClick={handleClearOutput}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <X size={12} />
                مسح
              </button>
            </div>
            <pre
              className={`w-full p-4 rounded-lg text-sm font-mono leading-6 overflow-x-auto ${
                isError
                  ? 'bg-red-950/50 border border-red-900/50 text-red-400'
                  : 'bg-black border border-green-900/50 text-green-400'
              }`}
              dir="ltr"
            >
              {output || 'لا توجد مخرجات'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
