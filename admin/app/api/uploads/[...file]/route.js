import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const fileSegments = resolvedParams?.file;
    if (!fileSegments || fileSegments.length === 0) {
      return new NextResponse('File not specified', { status: 400 });
    }

    const filename = Array.isArray(fileSegments) ? fileSegments.join('/') : fileSegments;
    const resolvedDir = path.resolve(/*turbopackIgnore: true*/ getUploadDir());
    const resolvedPath = path.resolve(/*turbopackIgnore: true*/ resolvedDir, filename);

    // Prevent directory traversal
    if (!resolvedPath.startsWith(resolvedDir)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(normalizedPath);
    const ext = path.extname(normalizedPath).toLowerCase();

    const mimeTypes = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
