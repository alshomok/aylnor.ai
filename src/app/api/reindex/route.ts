import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Fetch all files from knowledge base
    const { data: files, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch files: ${fetchError.message}`);
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files to index', indexed: 0 });
    }

    // Simulate indexing process
    // In a real implementation, this would:
    // - Rebuild search index
    // - Update full-text search vectors
    // - Clean duplicate entries
    // - Optimize database queries

    let indexedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Validate file URL
        if (file.file_url) {
          // Check if URL is still valid (simulated)
          // In production, you would make a HEAD request to verify
          const urlValid = true; // Simulated validation
          
          if (!urlValid) {
            errors.push(`Invalid URL for file: ${file.filename}`);
            continue;
          }
        }

        // Update indexed_at timestamp
        await supabase
          .from('knowledge_base')
          .update({ indexed_at: new Date().toISOString() })
          .eq('id', file.id);

        indexedCount++;
      } catch (error) {
        errors.push(`Failed to index file ${file.filename}: ${error}`);
      }
    }

    return NextResponse.json({
      message: 'Indexing completed',
      indexed: indexedCount,
      total: files.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Reindex API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
