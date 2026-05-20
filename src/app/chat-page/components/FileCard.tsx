'use client';
import React from 'react';
import { FileText, Download } from 'lucide-react';

interface FileCardProps {
  filename: string;
  file_type: string;
  file_url: string;
  description: string;
}

export default function FileCard({ filename, file_type, file_url, description }: FileCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('فشل تحميل الملف');
    }
  };

  return (
    <div className="bg-navy-elevated border border-border rounded-xl p-4 my-2 max-w-md">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gold/10 text-gold shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{filename}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <button
            onClick={handleDownload}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-gold text-navy-dark rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            تحميل الملف ⬇
          </button>
        </div>
      </div>
    </div>
  );
}
