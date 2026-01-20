import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    console.log('Starting YouTube import for:', youtubeUrl);

    const supabase = await createClient();

    // Use ytmp3.cc API to get download link
    console.log('Getting download info from ytmp3.cc...');
    const downloadInfo = await getYtmp3DownloadInfo(youtubeUrl);

    console.log('Download info received:', {
      title: downloadInfo.title,
      duration: downloadInfo.duration,
      hasAudio: !!downloadInfo.audioUrl
    });

    // Download audio from ytmp3.cc
    console.log('Downloading audio from ytmp3.cc...');
    const audioResponse = await fetch(downloadInfo.audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Impossible de télécharger l\'audio depuis ytmp3.cc');
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.log('Audio downloaded, size:', audioBuffer.byteLength, 'bytes');

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const fileName = `youtube_${Date.now()}_${downloadInfo.id}.mp3`;
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
        duration_seconds: downloadInfo.duration || null
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
        title: downloadInfo.title,
        duration: downloadInfo.duration,
        thumbnail: downloadInfo.thumbnail,
        originalTitle: downloadInfo.title
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

async function getYtmp3DownloadInfo(youtubeUrl: string): Promise<{
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  audioUrl: string;
}> {
  try {
    // Extract video ID from YouTube URL
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }
    const videoId = videoIdMatch[1];

    console.log('Extracted video ID:', videoId);

    // Call ytmp3.cc API to get download info
    const response = await fetch('https://api.ytmp3.cc/v2/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: youtubeUrl,
        format: 'mp3'
      })
    });

    if (!response.ok) {
      throw new Error(`ytmp3.cc API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.audioUrl) {
      throw new Error('Failed to get download URL from ytmp3.cc');
    }

    return {
      id: videoId,
      title: data.title || `YouTube Video ${videoId}`,
      duration: data.duration || 0,
      thumbnail: data.thumbnail || '',
      audioUrl: data.audioUrl
    };

  } catch (error: any) {
    console.error('ytmp3.cc API error:', error);
    throw new Error(`Impossible d'obtenir les informations de téléchargement: ${error.message}`);
  }
}
