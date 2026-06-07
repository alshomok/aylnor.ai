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
    
    // استخدام iframe مخفي للتحميل دون فتح صفحة جديدة
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.src = convertToDirectDownload(downloadUrl);
    document.body.appendChild(iframe);
    
    // محاكاة عملية التحميل
    setTimeout(() => {
      setIsLoading(false);
      setIsComplete(true);
      
      // تنظيف iframe بعد التحميل
      setTimeout(() => {
        document.body.removeChild(iframe);
        setIsComplete(false);
      }, 2000);
    }, 1500);
  };

  const directDownloadUrl = convertToDirectDownload(downloadUrl);

  return (
    <div className="my-3 w-full max-w-sm">
      {/* البطاقة الرئيسية */}
      <div className="bg-[#0b1329] backdrop-blur-md border border-blue-600/30 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-300">
        {/* محتوى البطاقة */}
        <div className="p-4">
          {/* أيقونة الملف */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
              <FileText className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* معلومات الملف */}
          <div className="text-center mb-3">
            <h3 className="text-base font-bold text-zinc-100 mb-1 truncate">
              {fileName}
            </h3>
            <div className="flex justify-center gap-2 text-xs">
              <span className="bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full font-medium text-amber-400">
                {getFileTypeLabel()}
              </span>
              <span className="bg-white/5 px-2 py-0.5 rounded-full text-zinc-400">
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
                <span className="text-xs font-bold text-amber-400">
                  ٧٥%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-amber-400 rounded-full animate-loading"
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
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-600/30 active:scale-95'
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
      `}</style>
    </div>
  );
};
