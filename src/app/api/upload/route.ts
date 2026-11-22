import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 1. If Supabase is configured, upload directly to the 'panoramas' storage bucket
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage
        .from('panoramas')
        .upload(cleanFileName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('panoramas')
        .getPublicUrl(cleanFileName);

      return NextResponse.json({
        url: publicUrlData.publicUrl,
        fileName: cleanFileName,
      });
    }

    // 2. Fallback: Save locally in public/uploads if Supabase is not connected yet
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, cleanFileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${cleanFileName}`,
      fileName: cleanFileName,
    });
  } catch (err: any) {
    console.error('Upload handler exception:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
