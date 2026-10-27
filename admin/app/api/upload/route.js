import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

function getUploadDir() {
  if (process.env.UPLOADS_DIR) {
    return path.resolve(process.env.UPLOADS_DIR);
  }
  const cleanCwd = process.cwd().replace(/[/\\]+$/, '');
  const adminIndex = cleanCwd.search(/[/\\]admin$/i);
  if (adminIndex !== -1) {
    return path.resolve(cleanCwd.slice(0, adminIndex), 'uploads');
  }
  return path.resolve(cleanCwd, 'uploads');
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Support multiple form field keys: 'files', 'images', 'file', 'image'
    let files = [];
    if (formData.has('files')) {
      files = formData.getAll('files');
    } else if (formData.has('images')) {
      files = formData.getAll('images');
    } else if (formData.has('file')) {
      files = [formData.get('file')];
    } else if (formData.has('image')) {
      files = [formData.get('image')];
    }

    // Filter valid file objects
    files = files.filter(f => f && typeof f === 'object' && f.name && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded. Please attach at least one image.' },
        { status: 400 }
      );
    }

    const uploadDir = getUploadDir();
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const results = [];

    for (const file of files) {
      const originalName = file.name || 'image.jpg';
      const cleanBaseName = path
        .parse(originalName)
        .name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 40) || 'image';

      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const finalFilename = `${cleanBaseName}-${uniqueSuffix}.webp`;
      const targetFilePath = path.join(uploadDir, finalFilename);

      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Convert any incoming image format (JPG, PNG, TIFF, HEIC, WebP, etc.) to optimized WebP
      const processedBuffer = await sharp(inputBuffer)
        .rotate() // auto-orient based on EXIF
        .resize({
          width: 2000,
          height: 2000,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      await fs.promises.writeFile(targetFilePath, processedBuffer);

      // Read image metadata for dimension verification
      const meta = await sharp(processedBuffer).metadata();

      const publicUrl = `/api/uploads/${finalFilename}`;
      results.push({
        url: publicUrl,
        filename: finalFilename,
        originalName,
        size: processedBuffer.length,
        width: meta.width || null,
        height: meta.height || null,
        format: 'webp',
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      files: results,
      urls: results.map((r) => r.url),
    });
  } catch (error) {
    console.error('Upload API processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Image processing and upload failed' },
      { status: 500 }
    );
  }
}
