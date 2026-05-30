'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

interface InteractiveInputProps {
  onInput: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  multiline?: boolean;
}

export default function InteractiveInput({ onInput, onClose, placeholder = 'أدخل قيمة...', multiline = false }: InteractiveInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      onInput(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">إدخال بيانات</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted-foreground/10 transition-colors"
            title="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full min-h-[100px] px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-royal-blue/50"
              autoFocus
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/50"
              autoFocus
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-royal-blue hover:bg-royal-blue/90 disabled:bg-royal-blue/50 text-white text-sm font-medium rounded transition-colors"
            >
              <Send size={14} />
              إرسال
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="px-4 py-2 bg-muted/50 border-t border-border">
          <p className="text-xs text-muted-foreground">
            اضغط Enter لإرسال • Escape للإغلاق
          </p>
        </div>
      </div>
    </div>
  );
}
