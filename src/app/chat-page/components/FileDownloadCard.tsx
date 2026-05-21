'use client';

import React from 'react';

interface FileDownloadCardProps {
  fileName: string;
  fileSize?: string;
  fileType?: 'pdf' | 'excel' | 'word' | 'zip' | 'general';
  downloadUrl: string;
}

export const FileDownloadCard: React.FC<FileDownloadCardProps> = ({
  fileName = "شيت المادة الأكاديمية",
  fileSize = "Unknown size",
  fileType = "pdf",
  downloadUrl
}) => {
  
  // تحديد الأيقونة واللون بناءً على نوع الملف
  const getFileStyle = () => {
    switch(fileType) {
      case 'pdf':
        return {
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          textColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-100 dark:border-red-900/50',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6" />
            </svg>
          )
        };
      case 'excel':
        return {
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          borderColor: 'border-emerald-100 dark:border-emerald-900/50',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 0v4m0-4h4m-4 0H8m11 4V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2z" />
            </svg>
          )
        };
      default:
        return {
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
          textColor: 'text-indigo-600 dark:text-indigo-400',
          borderColor: 'border-indigo-100 dark:border-indigo-900/50',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )
        };
    }
  };

  const style = getFileStyle();

  return (
    <div className={`my-3 w-full max-w-sm border ${style.borderColor} ${style.bgColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 dir-rtl`}>
      <div className="flex items-center gap-4">
        {/* أيقونة الملف الجذابة */}
        <div className={`p-2.5 rounded-lg bg-white dark:bg-gray-900 shadow-sm ${style.textColor}`}>
          {style.icon}
        </div>

        {/* تفاصيل الملف */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            الحجم: {fileSize}
          </p>
        </div>

        {/* زر التحميل المباشر المكتكت */}
        <a
          href={downloadUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 shadow-sm transition-colors group"
          title="تحميل الشيت مباشرة"
        >
          <svg 
            className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-150 text-indigo-600 dark:text-indigo-400" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>
    </div>
  );
};
