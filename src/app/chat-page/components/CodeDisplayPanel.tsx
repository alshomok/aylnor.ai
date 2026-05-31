'use client';
import React, { useState } from 'react';
import { X, Copy, Check, Play, Download, Code2, Terminal, FileText } from 'lucide-react';

interface CodeDisplayPanelProps {
  codeBlock: { language: string; code: string } | null;
  onClose: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  sql: 'SQL',
  bash: 'Bash',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
};

const EXAMPLE_OUTPUTS: Record<string, string> = {
  python: `$ python solution.py
[1, 3, 4, 5, 6, 7, 8]
<Node: value=4>
None

Process finished with exit code 0`,
  javascript: `> node solution.js
{ result: [1, 3, 5, 7, 8, 9], metadata: { count: 6, min: 1, max: 9 } }`,
  default: `تم تنفيذ البرنامج بنجاح.
النتيجة: انظر أعلاه.
كود الخروج: 0`,
};

const GUIDANCE_ITEMS = [
  {
    id: 'guide-structure',
    icon: FileText,
    title: 'هيكل الكود',
    desc: 'بدّل إلى وضع المتأمل واطلب من aylnor شرح الكود سطراً بسطر، أو اطلب وصفاً للمخطط الانسيابي.',
  },
  {
    id: 'guide-run',
    icon: Play,
    title: 'تشغيل الكود',
    desc: 'انسخ الكود والصقه في بيئتك المحلية. اسأل aylnor عن المكتبات التي تحتاج تثبيتها أولاً.',
  },
  {
    id: 'guide-debug',
    icon: Terminal,
    title: 'تصحيح الأخطاء',
    desc: 'الصق رسائل الخطأ مباشرة في المحادثة. aylnor في وضع البرمجة سيشخص المشكلة ويصلحها.',
  },
  {
    id: 'guide-extend',
    icon: Code2,
    title: 'توسيع الكود',
    desc: 'اطلب من aylnor "أضف معالجة الأخطاء"، "اجعل هذا غير متزامن"، أو "اكتب اختبارات وحدة لهذه الدالة".',
  },
];

export default function CodeDisplayPanel({ codeBlock, onClose }: CodeDisplayPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'guide'>('code');
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [executionError, setExecutionError] = useState('');

  const handleCopy = () => {
    if (!codeBlock) return;
    navigator.clipboard.writeText(codeBlock.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    if (!codeBlock) return;
    setIsRunning(true);
    setExecutionOutput('');
    setExecutionError('');

    try {
      // Map language names for Piston API
      const languageMap: Record<string, string> = {
        python: 'python3',
        javascript: 'javascript',
        typescript: 'javascript',
        cpp: 'cpp',
        c: 'c',
        java: 'java',
        go: 'go',
        rust: 'rust',
        php: 'php',
        ruby: 'ruby',
        bash: 'bash',
        sql: 'sqlite3',
      };

      const pistonLanguage = languageMap[codeBlock.language] || codeBlock.language;

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*',
          files: [{ content: codeBlock.code }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      const result = await response.json();
      
      if (result.run?.output) {
        setExecutionOutput(result.run.output);
      }
      
      if (result.run?.stderr || result.compile?.stderr) {
        setExecutionError(result.run?.stderr || result.compile?.stderr || '');
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownload = () => {
    if (!codeBlock) return;
    const ext: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
      cpp: 'cpp',
      sql: 'sql',
    };
    const extension = ext[codeBlock.language] ?? 'txt';
    const blob = new Blob([codeBlock.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aylnor_code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const outputText = codeBlock
    ? (EXAMPLE_OUTPUTS[codeBlock.language] ?? EXAMPLE_OUTPUTS.default)
    : '';

  return (
    <div className="code-panel flex flex-col w-full sm:w-[380px] md:w-[420px] lg:w-[460px] xl:w-[500px] shrink-0 border-r border-border bg-card">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-row-reverse">
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <Code2 size={16} className="text-royal-blue-light" />
          <span className="text-sm font-bold text-foreground">
            {codeBlock ? (LANGUAGE_LABELS[codeBlock.language] ?? codeBlock.language) : 'الكود'} —
            المخرجات
          </span>
          {codeBlock && (
            <span className="badge-green text-2xs px-2 py-0.5 rounded-full font-semibold">
              {codeBlock.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRunCode}
            disabled={!codeBlock || isRunning}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="تشغيل الكود"
          >
            {isRunning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Play size={14} />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            title="نسخ الكود"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            title="تنزيل الملف"
          >
            <Download size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            title="إغلاق لوحة الكود"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 flex-row-reverse">
        {(
          [
            { key: 'code', label: 'الكود', icon: Code2 },
            { key: 'output', label: 'المخرجات', icon: Terminal },
            { key: 'guide', label: 'الدليل', icon: FileText },
          ] as { key: 'code' | 'output' | 'guide'; label: string; icon: React.ElementType }[]
        ).map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={`code-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 ml-4 ${
                activeTab === tab.key
                  ? 'text-gold border-gold'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <TabIcon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {/* CODE tab */}
        {activeTab === 'code' && (
          <div className="h-full overflow-auto scrollbar-thin">
            {codeBlock ? (
              <div className="relative">
                <div className="flex" dir="ltr">
                  {/* Line numbers */}
                  <div className="select-none px-3 py-4 text-right border-r border-border shrink-0">
                    {codeBlock.code.split('\n').map((_, i) => (
                      <div
                        key={`ln-${i + 1}`}
                        className="text-2xs text-muted-foreground leading-6 font-mono tabular-nums"
                        style={{ minWidth: '28px' }}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {/* Code content */}
                  <pre className="code-block flex-1 px-4 py-4 text-xs overflow-x-auto text-green-300 leading-6">
                    <code>{codeBlock.code}</code>
                  </pre>
                </div>
                
                {/* Execution Output Console */}
                {(executionOutput || executionError) && (
                  <div className="mt-2 px-4">
                    <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-green-400">مخرجات التنفيذ</span>
                    </div>
                    <pre
                      className="bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto border border-zinc-800"
                      dir="ltr"
                    >
                      {executionError ? (
                        <span className="text-red-400">{executionError}</span>
                      ) : (
                        executionOutput
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                <Code2 size={32} className="text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm font-semibold text-muted-foreground mb-1">لا يوجد كود بعد</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  بدّل إلى وضع <span className="text-royal-blue-light font-semibold">البرمجة</span>{' '}
                  واطلب من aylnor كتابة كود — سيظهر هنا مع تمييز الصياغة.
                </p>
              </div>
            )}
          </div>
        )}

        {/* OUTPUT tab */}
        {activeTab === 'output' && (
          <div className="h-full overflow-auto scrollbar-thin p-4">
            {codeBlock ? (
              <div>
                <div className="flex items-center gap-2 mb-3 flex-row-reverse">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-green-400">مخرجات محاكاة</span>
                  <span className="text-2xs text-muted-foreground">
                    (شغّل محلياً لرؤية المخرجات الحقيقية)
                  </span>
                </div>
                <pre
                  className="code-block bg-black/60 rounded-xl p-4 text-xs text-green-300 leading-6 overflow-x-auto border border-green-500/15"
                  dir="ltr"
                >
                  {outputText}
                </pre>
                <div className="mt-4 glass-card rounded-xl p-4 border border-gold/15">
                  <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5 flex-row-reverse">
                    <Play size={12} className="text-gold" />
                    كيفية تشغيل هذا الكود
                  </p>
                  <div className="space-y-1.5 text-right">
                    {codeBlock.language === 'python' && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          ١. احفظ الملف باسم{' '}
                          <code className="text-green-300 font-mono" dir="ltr">
                            solution.py
                          </code>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ٢. شغّل:{' '}
                          <code className="text-green-300 font-mono" dir="ltr">
                            python solution.py
                          </code>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ٣. أو استخدم:{' '}
                          <code className="text-green-300 font-mono" dir="ltr">
                            python3 solution.py
                          </code>{' '}
                          على macOS/Linux
                        </p>
                      </>
                    )}
                    {(codeBlock.language === 'javascript' ||
                      codeBlock.language === 'typescript') && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          ١. احفظ الملف باسم{' '}
                          <code className="text-green-300 font-mono" dir="ltr">
                            solution.{codeBlock.language === 'typescript' ? 'ts' : 'js'}
                          </code>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ٢. شغّل:{' '}
                          <code className="text-green-300 font-mono" dir="ltr">
                            node solution.js
                          </code>
                        </p>
                      </>
                    )}
                    {!['python', 'javascript', 'typescript'].includes(codeBlock.language) && (
                      <p className="text-xs text-muted-foreground">
                        اسأل aylnor:{' '}
                        <span className="text-gold italic">
                          &quot;كيف أشغّل كود {codeBlock.language} هذا؟&quot;
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <Terminal size={32} className="text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm font-semibold text-muted-foreground">لا توجد مخرجات للعرض</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ولّد كوداً أولاً لرؤية المخرجات المحاكاة.
                </p>
              </div>
            )}
          </div>
        )}

        {/* GUIDE tab */}
        {activeTab === 'guide' && (
          <div className="h-full overflow-auto scrollbar-thin p-4 space-y-4">
            <div className="mb-2 text-right">
              <h3 className="text-sm font-bold text-foreground mb-1">العمل مع كود aylnor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                aylnor يولّد كوداً بجودة إنتاجية في وضع البرمجة. إليك كيفية الاستفادة القصوى من لوحة
                الكود.
              </p>
            </div>

            {GUIDANCE_ITEMS.map((item) => {
              const GuideIcon = item.icon;
              return (
                <div key={item.id} className="glass-card rounded-xl p-4 border border-border">
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue/15 flex items-center justify-center shrink-0 mt-0.5">
                      <GuideIcon size={14} className="text-royal-blue-light" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Prompt examples */}
            <div className="glass-card rounded-xl p-4 border border-gold/15 mt-2">
              <p className="text-xs font-bold text-gold mb-3 flex items-center gap-1.5 flex-row-reverse">
                <Code2 size={12} />
                قوالب أوامر مفيدة
              </p>
              <div className="space-y-2">
                {[
                  '"أضف التحقق من المدخلات ومعالجة الأخطاء لهذا الكود"',
                  '"حوّل هذا إلى نمط async/await"',
                  '"اكتب اختبارات pytest لجميع الدوال"',
                  '"حسّن هذا ليكون بتعقيد زمني O(n)"',
                  '"أضف تعليقات النوع والتوثيق"',
                  '"أعد هيكلة هذا وفق مبادئ SOLID"',
                ].map((prompt, i) => (
                  <p
                    key={`prompt-template-${i}`}
                    className="text-xs text-muted-foreground italic border-r-2 border-gold/30 pr-3 text-right"
                  >
                    {prompt}
                  </p>
                ))}
              </div>
            </div>

            {/* Language support */}
            <div className="glass-card rounded-xl p-4 border border-border">
              <p className="text-xs font-bold text-foreground mb-3 text-right">اللغات المدعومة</p>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {[
                  'Python',
                  'JavaScript',
                  'TypeScript',
                  'Java',
                  'C++',
                  'C',
                  'Go',
                  'Rust',
                  'SQL',
                  'Bash',
                  'HTML',
                  'CSS',
                  'React',
                  'Swift',
                  'Kotlin',
                  'PHP',
                  'Ruby',
                  'R',
                  'MATLAB',
                ].map((lang) => (
                  <span
                    key={`lang-${lang}`}
                    className="text-2xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-border"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel footer */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between flex-row-reverse">
        <p className="text-2xs text-muted-foreground">
          {codeBlock
            ? `${codeBlock.code.split('\n').length} سطر · ${codeBlock.language}`
            : 'لم يتم تحميل كود'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!codeBlock}
            className="flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            {copied ? 'تم النسخ!' : 'نسخ'}
          </button>
          <span className="text-border">·</span>
          <button
            onClick={handleDownload}
            disabled={!codeBlock}
            className="flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={11} />
            تنزيل
          </button>
        </div>
      </div>
    </div>
  );
}
