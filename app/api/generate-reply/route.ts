import { NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import {
  generateVideoCaption,
  categorizeActivity,
  generateRepliesForAllRecipients,
} from '@/lib/gemini/gemini-service';

const execFileAsync = promisify(execFile);

async function resizeVideo(inputPath: string): Promise<string> {
  const outputPath = join(tmpdir(), `resized-${Date.now()}.mp4`);

  await execFileAsync('ffmpeg', [
    '-i', inputPath,
    '-t', '5',
    '-vf', 'scale=iw/2:ih/2',
    '-y',
    outputPath,
  ]);

  return outputPath;
}

export async function POST(request: Request) {
  let resizedPath: string | null = null;

  try {
    const { videoFileName } = await request.json();

    if (!videoFileName || typeof videoFileName !== 'string') {
      return NextResponse.json(
        { error: 'videoFileName is required' },
        { status: 400 }
      );
    }

    const videoPath = join(process.cwd(), 'public', 'videos', videoFileName);

    if (!existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }

    // ffmpeg でリサイズ
    resizedPath = await resizeVideo(videoPath);

    // base64 変換
    const videoBuffer = await readFile(resizedPath);
    const videoBase64 = videoBuffer.toString('base64');

    // キャプション生成
    const caption = await generateVideoCaption(videoBase64);
    console.log('Caption:', caption);

    // カテゴリ分類
    const { category, isInCategory } = await categorizeActivity(caption);
    console.log('Category:', category, 'isInCategory:', isInCategory);

    // 3人分の返信生成
    const replies = await generateRepliesForAllRecipients(caption, isInCategory);
    console.log('Replies generated:', replies.length);

    return NextResponse.json({
      caption,
      category,
      isInCategory,
      replies,
    });
  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  } finally {
    // 一時ファイルを削除
    if (resizedPath && existsSync(resizedPath)) {
      await unlink(resizedPath).catch(() => {});
    }
  }
}
