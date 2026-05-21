'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddFilePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Helper function to extract drive_id from Google Drive URL
  const extractDriveId = (url: string): string | null => {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate inputs
    if (!title.trim() || !driveLink.trim()) {
      setError('العنوان ورابط Google Drive مطلوبان');
      return;
    }

    // Extract drive_id from the URL
    const driveId = extractDriveId(driveLink);
    if (!driveId) {
      setError('رابط Google Drive غير صالح. تأكد من استخدام رابط مشاركة صحيح.');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('educational_files')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          drive_id: driveId,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      // Reset form
      setTitle('');
      setDescription('');
      setDriveLink('');
    } catch (err) {
      console.error('Error adding file:', err);
      setError('حدث خطأ أثناء إضافة الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">إضافة ملف تعليمي</h1>

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-center">تم إضافة الملف بنجاح!</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              عنوان الملف
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="مثال: شيت السلامة المهنية - الفصل الثاني"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              الوصف (اختياري)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
              rows={4}
              placeholder="وصف موجز لمحتوى الملف..."
            />
          </div>

          {/* Google Drive Link */}
          <div>
            <label htmlFor="driveLink" className="block text-sm font-medium mb-2">
              رابط Google Drive
            </label>
            <input
              id="driveLink"
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="https://drive.google.com/file/d/..."
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              استخدم رابط المشاركة من Google Drive. سيتم استخراج معرف الملف تلقائياً.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'جارٍ الإضافة...' : 'إضافة الملف'}
          </button>
        </form>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">تعليمات:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>افتح الملف في Google Drive</li>
            <li>انقر على "مشاركة" (Share)</li>
            <li>اضبط الإعدادات على "أي شخص لديه الرابط"</li>
            <li>انسخ الرابط وألصقه هنا</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
