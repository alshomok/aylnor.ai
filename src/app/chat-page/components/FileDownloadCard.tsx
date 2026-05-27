'use client';

import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface FileDownloadCardProps {
  fileName: string;
  fileSize?: string;
  fileType?: 'pdf' | 'excel' | 'word' | 'zip' | 'general';
  downloadUrl: string;
}

export const FileDownloadCard: React.FC<FileDownloadCardProps> = ({
  fileName = "شيت المادة الأكاديمية",
  fileSize = "غير معروف",
  fileType = "pdf",
  downloadUrl
}) => {

  // تحديد نوع الملف للعرض
  const getFileTypeLabel = () => {
    switch(fileType) {
      case 'pdf': return 'PDF';
      case 'excel': return 'Excel';
      case 'word': return 'Word';
      case 'zip': return 'ZIP';
      default: return 'ملف';
    }
  };

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
      className="my-3 block w-full max-w-sm bg-zinc-950/60 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-amber-500/40 transition-all duration-200 dir-rtl group"
    >
      <div className="flex items-center justify-between gap-4">
        {/* أيقونة الملف مع خلفية ذهبية */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <FileText size={20} />
          </div>

          {/* تفاصيل الملف */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-semibold text-zinc-100 truncate">
              {fileName}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {getFileTypeLabel()} • الحجم: {fileSize}
            </p>
          </div>
        </div>

        {/* زر التحميل */}
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 transition-all duration-200 shrink-0">
          <Download size={16} className="text-zinc-400 group-hover:text-amber-500 transition-colors" />
        </div>
      </div>
    </a>
  );
};
