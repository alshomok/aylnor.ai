'use client';
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface KnowledgeFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  extracted_text: string;
  source: 'upload' | 'google_drive';
  created_at: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const validTypes = ['pdf', 'docx', 'txt', 'xlsx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validTypes.includes(fileExtension)) {
      alert('نوع الملف غير مدعوم. يرجى رفع PDF, DOCX, TXT, أو XLSX');
      return;
    }

    setUploading(true);

    try {
      // First extract text
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileExtension);

      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract text');
      }

      const extractData = await extractResponse.json();

      // Then upload file with extracted text
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('extractedText', extractData.extractedText);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      await loadFiles();
      alert('تم رفع الملف بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      alert('فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDriveImport = async () => {
    if (!driveUrl.trim()) {
      alert('يرجى إدخال رابط Google Drive');
      return;
    }

    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      alert('تنسيق الرابط غير صحيح. يجب أن يكون: https://drive.google.com/file/d/{fileId}/view');
      return;
    }

    setImporting(true);

    try {
      // Download file from Drive
      const fileId = fileIdMatch[1];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error('Failed to download file from Google Drive');
      }

      const blob = await response.blob();
      const file = new File([blob], `drive_${fileId}`, { type: blob.type });

      // Determine file type
      const contentType = blob.type || 'application/octet-stream';
      let fileType = 'unknown';
      if (contentType.includes('pdf')) fileType = 'pdf';
      else if (contentType.includes('word') || contentType.includes('docx')) fileType = 'docx';
      else if (contentType.includes('sheet') || contentType.includes('xlsx')) fileType = 'xlsx';
      else if (contentType.includes('text')) fileType = 'txt';

      // Extract text
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract text');
      }

      const extractData = await extractResponse.json();

      // Import with extracted text
      const importResponse = await fetch('/api/import-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveUrl,
          extractedText: extractData.extractedText,
        }),
      });

      if (!importResponse.ok) {
        throw new Error('Failed to import file');
      }

      await loadFiles();
      setDriveUrl('');
      alert('تم استيراد الملف بنجاح');
    } catch (error) {
      console.error('Import error:', error);
      alert('فشل استيراد الملف');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFiles();
        alert('تم حذف الملف بنجاح');
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('فشل حذف الملف');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gold">إدارة قاعدة المعرفة</h1>
        <p className="text-muted-foreground mb-8">رفع وإدارة الملفات للبحث الذكي</p>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Direct Upload */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-gold" />
              رفع ملف مباشر
            </h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragActive
                  ? 'border-gold bg-gold/5'
                  : 'border-border hover:border-gold/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt,.xlsx"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">اسحب الملف هنا أو انقر للاختيار</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, DOCX, TXT, XLSX
                  </p>
                </div>
              </label>
            </div>
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جارٍ الرفع...</span>
              </div>
            )}
          </div>

          {/* Google Drive Import */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-gold" />
              استيراد من Google Drive
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="https://drive.google.com/file/d/{fileId}/view"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-lg input-field"
                disabled={importing}
              />
              <button
                onClick={handleDriveImport}
                disabled={importing || !driveUrl.trim()}
                className="w-full btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جارٍ الاستيراد...
                  </span>
                ) : (
                  'استيراد الملف'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">الملفات المرفوعة</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد ملفات مرفوعة
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-navy-elevated border border-border hover:border-gold/30 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-gold/10 text-gold">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.filename}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="badge-blue px-2 py-0.5 rounded text-xs">
                          {file.file_type.toUpperCase()}
                        </span>
                        <span>{formatDate(file.created_at)}</span>
                        <span className="badge-gold px-2 py-0.5 rounded text-xs">
                          {file.source === 'upload' ? 'رفع مباشر' : 'Google Drive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gold/10 text-gold transition-colors"
                      title="فتح الملف"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
