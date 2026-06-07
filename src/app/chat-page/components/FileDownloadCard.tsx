'use client';

import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Convert Google Drive view link to direct download link
  const convertToDirectDownload = (url: string): string => {
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([^\/]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    return url;
  };

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

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Convert Google Drive link to direct download link
    const downloadLink = convertToDirectDownload(downloadUrl);

    // Force native browser download using anchor tag
    const a = document.createElement('a');
    a.href = downloadLink;
    a.setAttribute('download', '');
    a.setAttribute('target', '_blank');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Set loading states to false immediately
    setIsLoading(false);
    setIsComplete(true);

    // Reset completion state after 2 seconds
    setTimeout(() => {
      setIsComplete(false);
    }, 2000);
  };

  return (
    <div className="my-3 w-full max-w-sm">
      {/* البطاقة الرئيسية */}
      <div className="bg-zinc-950/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        {/* الرأس بتدرج أزرق ملكي وذهبي */}
        <div className="h-16 bg-gradient-to-r from-royal-blue to-gold relative overflow-hidden">
          {/* عناصر ديكورية متحركة */}
          <div className="absolute top-1 right-2 w-8 h-8 bg-gold/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 left-2 w-6 h-6 bg-gold/20 rounded-full animate-pulse delay-75"></div>
        </div>
        
        {/* محتوى البطاقة */}
        <div className="p-4">
          {/* أيقونة الملف */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-royal-blue/20 to-gold/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-gold" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* معلومات الملف */}
          <div className="text-center mb-3">
            <h3 className="text-base font-bold text-zinc-100 mb-1 truncate">
              {fileName}
            </h3>
            <div className="flex justify-center gap-2 text-xs text-zinc-400">
              <span className="bg-white/5 px-2 py-0.5 rounded-full font-medium">
                {getFileTypeLabel()}
              </span>
              <span className="bg-white/5 px-2 py-0.5 rounded-full">
                {fileSize}
              </span>
            </div>
          </div>
          
          {/* مؤشر التقدم */}
          {isLoading && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-zinc-400">
                  جاري التحميل...
                </span>
                <span className="text-xs font-bold text-gold">
                  ٧٥%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-royal-blue to-gold rounded-full animate-loading"
                  style={{
                    width: '75%',
                  }}
                ></div>
              </div>
            </div>
          )}
          
          {isComplete && (
            <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-xs font-semibold text-green-400">
                ✓ تم التحميل بنجاح
              </p>
            </div>
          )}
          
          {/* زر التحميل */}
          <button
            onClick={handleDownload}
            disabled={isLoading || isComplete}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              isLoading
                ? 'bg-white/5 text-zinc-400 cursor-wait'
                : isComplete
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-royal-blue to-gold text-white hover:shadow-lg hover:shadow-royal-blue/30 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                جاري المعالجة...
              </>
            ) : isComplete ? (
              <>
                <span className="text-base">✓</span>
                تم بنجاح
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                تحميل الملف
              </>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        
        .animate-loading {
          animation: shimmer 1.5s infinite;
        }
        
        .delay-75 {
          animation-delay: 0.75s;
        }
      `}</style>
    </div>
  );
};
