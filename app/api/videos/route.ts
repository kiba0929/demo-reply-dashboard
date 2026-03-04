import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const dir = join(process.cwd(), 'public', 'videos');
  const files = await readdir(dir);
  const videos = files.filter((f) => /\.(mp4|mov)$/i.test(f)).sort();
  return NextResponse.json(videos);
}
