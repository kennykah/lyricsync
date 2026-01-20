import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const album = formData.get('album') as string;
    const lyrics = formData.get('lyrics') as string;

    // Validation
    if (!youtubeUrl || !title || !artist || !lyrics) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: 'URL YouTube invalide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Extract video info first
    console.log('Extracting YouTube video info...');
    const videoInfo = await getYouTubeVideoInfo(youtubeUrl);

    console.log('Video info:', videoInfo);

    // Download and convert audio
    console.log('Downloading and converting audio...');
    const audioBuffer = await downloadYouTubeAudio(youtubeUrl);

    console.log('Audio downloaded, size:', audioBuffer.length);

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const fileName = `youtube_${Date.now()}_${videoInfo.id}.mp3`;
    const filePath = `audio/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Erreur lors de l\'upload du fichier audio');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);

    console.log('Audio uploaded successfully:', publicUrl);

    // Create song record
    console.log('Creating song record...');
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert({
        title: title,
        artist_name: artist,
        album: album || null,
        audio_url: publicUrl,
        lyrics_text: lyrics,
        status: 'draft',
        submitted_by: null, // Will be set by auth middleware if implemented
        duration_seconds: videoInfo.duration || null
      })
      .select()
      .single();

    if (songError) {
      console.error('Song creation error:', songError);
      throw new Error('Erreur lors de la création de la chanson');
    }

    console.log('Song created successfully:', songData.id);

    return NextResponse.json({
      success: true,
      song: songData,
      videoInfo: {
        title: videoInfo.title,
        duration: videoInfo.duration,
        thumbnail: videoInfo.thumbnail
      }
    });

  } catch (error: any) {
    console.error('YouTube import error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'import YouTube' },
      { status: 500 }
    );
  }
}

async function getYouTubeVideoInfo(url: string): Promise<{
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
}> {
  return new Promise((resolve, reject) => {
    // Use yt-dlp to get video info as JSON
    const ytDlp = spawn('yt-dlp', [
      '--no-download',
      '--print-json',
      '--no-warnings',
      url
    ]);

    let stdout = '';
    let stderr = '';

    ytDlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp info failed: ${stderr}`));
        return;
      }

      try {
        const info = JSON.parse(stdout.trim());
        resolve({
          id: info.id,
          title: info.title,
          duration: Math.floor(info.duration),
          thumbnail: info.thumbnail
        });
      } catch (err) {
        reject(new Error('Failed to parse video info'));
      }
    });

    ytDlp.on('error', (err) => {
      reject(new Error(`yt-dlp not found. Please install yt-dlp: ${err.message}`));
    });
  });
}

async function downloadYouTubeAudio(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempDir = tmpdir();
    const outputPath = join(tempDir, `youtube_audio_${Date.now()}.mp3`);

    // Use yt-dlp to download and convert to MP3
    const ytDlp = spawn('yt-dlp', [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '128K',
      '--output', outputPath,
      '--no-warnings',
      '--quiet',
      url
    ]);

    let stderr = '';

    ytDlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytDlp.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp download failed: ${stderr}`));
        return;
      }

      try {
        // Read the downloaded file
        const fs = await import('fs');
        const buffer = fs.readFileSync(outputPath);

        // Clean up temp file
        await unlink(outputPath);

        resolve(buffer);
      } catch (err) {
        reject(new Error('Failed to read downloaded audio file'));
      }
    });

    ytDlp.on('error', (err) => {
      reject(new Error(`yt-dlp not found. Please install yt-dlp: ${err.message}`));
    });
  });
}
