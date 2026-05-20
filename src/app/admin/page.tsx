'use client';
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface KnowledgeFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  extracted_text: string;
  source: 'upload' | 'google_drive';
  description: string;
  created_at: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [description, setDescription] = useState('');
  const [showDriveInput, setShowDriveInput] = useState(false);

  // Initialize Supabase client for direct client-side upload
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
    const validTypes = ['pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validTypes.includes(fileExtension)) {
      alert('نوع الملف غير مدعوم. يرجى رفع ملف PDF فقط');
      return;
    }

    if (!description.trim()) {
      alert('يرجى إدخال وصف الملف');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Extract text from PDF
      setUploadProgress(20);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileExtension);

      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract text');
      }

      const extractData = await extractResponse.json();
      setUploadProgress(40);

      // Step 2: Upload directly to Supabase Storage from client
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(`files/${fileName}`, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload to Supabase Storage');
      }

      setUploadProgress(70);

      // Step 3: Get public URL
      const { data: urlData } = supabase.storage
        .from('knowledge-base')
        .getPublicUrl(`files/${fileName}`);

      setUploadProgress(85);

      // Step 4: Save metadata to database via API
      const saveResponse = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          file_type: file.type,
          file_url: urlData.publicUrl,
          extracted_text: extractData.extractedText,
          description,
          source: 'upload',
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save file metadata');
      }

      setUploadProgress(100);
      await loadFiles();
      setDescription('');
      alert(`تم رفع الملف بنجاح: ${file.name}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`فشل رفع الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDriveImport = async () => {
    if (!driveUrl.trim()) {
      alert('يرجى إدخال رابط Google Drive');
      return;
    }

    if (!description.trim()) {
      alert('يرجى إدخال وصف الملف');
      return;
    }

    setImporting(true);

    try {
      // Function to convert Google Drive link to direct download link
      const convertToDirectDownloadLink = (url: string): string => {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        // If not a Google Drive link, return as is
        return url;
      };

      // Convert the link before saving
      const directDownloadUrl = convertToDirectDownloadLink(driveUrl);

      // Save Google Drive link directly to database without downloading the file
      const saveResponse = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `Google Drive File - ${description}`,
          file_type: 'google_drive',
          file_url: directDownloadUrl,
          extracted_text: `ملف من Google Drive: ${directDownloadUrl}`,
          description,
          source: 'google_drive',
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save Google Drive link');
      }

      await loadFiles();
      setDriveUrl('');
      setDescription('');
      setShowDriveInput(false);
      alert('تم حفظ رابط Google Drive بنجاح');
    } catch (error) {
      console.error('Import error:', error);
      alert(`فشل حفظ الرابط: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
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
        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-gold" />
            رفع الملفات
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-right">وصف الملف *</label>
              <input
                type="text"
                placeholder="مثال: شيت السلامة المهنية للفصل الثاني"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg input-field"
                disabled={uploading || importing}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => document.getElementById('pdf-upload')?.click()}
                disabled={uploading || importing || !description.trim()}
                className="flex-1 btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                رفع ملف PDF
              </button>
              <input
                type="file"
                id="pdf-upload"
                className="hidden"
                accept=".pdf"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) handleFileUpload(files[0]);
                }}
                disabled={uploading || importing}
              />

              <button
                onClick={() => setShowDriveInput(!showDriveInput)}
                disabled={uploading || importing || !description.trim()}
                className="flex-1 btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                إضافة رابط Google Drive
              </button>
            </div>

            {showDriveInput && (
              <div className="space-y-3 pt-2">
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
            )}

            {uploadProgress > 0 && (
              <div className="pt-2">
                <div className="w-full bg-navy-elevated rounded-full h-2">
                  <div
                    className="bg-gold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">{uploadProgress}%</p>
              </div>
            )}
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
                      <p className="text-sm text-muted-foreground mt-1 truncate">{file.description}</p>
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
