"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image, FolderOpen, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AylnorLogoUnique } from "@/components/aylnor-logo-unique";

export default function AdminPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    
    try {
      const newFiles = Array.from(uploadedFiles).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        status: 'uploaded'
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId: number) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  const handleViewFile = (file: any) => {
    setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('text/') || type.includes('document')) return FileText;
    return FolderOpen;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AylnorLogoUnique size="md" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-muted-foreground">إدارة الملفات والمستندات</p>
            </div>
          </div>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'جاري الرفع...' : 'رفع ملفات'}
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.md,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Files List */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                الملفات المرفوعة
                <span className="text-sm text-muted-foreground">
                  ({files.length} ملف)
                </span>
              </h2>
              
              {files.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد ملفات مرفوعة بعد</p>
                  <p className="text-sm">اضغط على "رفع ملفات" لبدء رفع الملفات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file, index) => {
                    const Icon = getFileIcon(file.type);
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-primary/10 rounded">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type || 'غير معروف'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.uploadDate.toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewFile(file)}
                            className="p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* File Preview */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                معاينة الملف
              </h2>
              
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      {(() => {
                        const Icon = getFileIcon(selectedFile.type);
                        return <Icon className="w-6 h-6 text-primary" />;
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    
                    {selectedFile.type.startsWith('image/') ? (
                      <div className="text-center">
                        <img 
                          src={URL.createObjectURL(new Blob([selectedFile]))}
                          alt={selectedFile.name}
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    ) : selectedFile.type.startsWith('text/') ? (
                      <div className="bg-background rounded p-3 max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                          {selectedFile.content || 'محتوى النصي هنا...'}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>معاينة غير متاحة لهذا النوع من الملفات</p>
                        <p className="text-sm">يمكن تحميل الملف لعرضه</p>
                      </div>
                    )}
                  </div>
                  
                  <Button className="w-full flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    تحميل الملف
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>اختر ملفاً للمعاينة</p>
                  <p className="text-sm">اضغط على أيقونة العين في قائمة الملفات</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">إجمالي الملفات</h3>
            <p className="text-2xl font-bold text-primary">{files.length}</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">حجم التخزين</h3>
            <p className="text-2xl font-bold text-primary">
              {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">آخر رفع</h3>
            <p className="text-2xl font-bold text-primary">
              {files.length > 0 ? files[files.length - 1].uploadDate.toLocaleDateString('ar-SA') : 'لا يوجد'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
