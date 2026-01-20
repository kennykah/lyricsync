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

    // Try multiple APIs in order of preference
    const apis = [
      {
        name: 'ytmp3.cc',
        url: 'https://api.ytmp3.cc/v2/download',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { url: youtubeUrl, format: 'mp3' }
      },
      {
        name: 'loader.to',
        url: `https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(youtubeUrl)}`,
        method: 'GET'
      },
      {
        name: 'y2mate',
        url: 'https://api.y2mate.com/v2/analyze',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { url: youtubeUrl }
      }
    ];

    for (const api of apis) {
      try {
        console.log(`Trying ${api.name} API...`);

        const requestOptions: any = {
          method: api.method,
          headers: api.headers || {}
        };

        if (api.body) {
          requestOptions.body = JSON.stringify(api.body);
        }

        const response = await fetch(api.url, requestOptions);

        if (!response.ok) {
          console.log(`${api.name} returned ${response.status}, trying next...`);
          continue;
        }

        const data = await response.json();
        console.log(`${api.name} response:`, data);

        // Parse response based on API
        let result;
        if (api.name === 'ytmp3.cc') {
          if (data.audioUrl) {
            result = {
              id: videoId,
              title: data.title || `YouTube Video ${videoId}`,
              duration: data.duration || 0,
              thumbnail: data.thumbnail || '',
              audioUrl: data.audioUrl
            };
          }
        } else if (api.name === 'loader.to') {
          if (data.success && data.download_url) {
            result = {
              id: videoId,
              title: data.title || `YouTube Video ${videoId}`,
              duration: 0,
              thumbnail: '',
              audioUrl: data.download_url
            };
          }
        } else if (api.name === 'y2mate') {
          if (data.status === 'ok' && data.result) {
            result = {
              id: videoId,
              title: data.result.title || `YouTube Video ${videoId}`,
              duration: data.result.duration || 0,
              thumbnail: data.result.thumbnail || '',
              audioUrl: '' // Would need additional call to get actual download URL
            };
          }
        }

        if (result && result.audioUrl) {
          console.log(`Successfully got download URL from ${api.name}`);
          return result;
        }

      } catch (apiError) {
        console.log(`${api.name} failed:`, apiError);
        continue;
      }
    }

    // If all APIs failed, suggest file upload
    console.log('All YouTube APIs failed. This is normal as these services change frequently.');
    throw new Error('Import YouTube temporairement indisponible. Veuillez utiliser l\'upload de fichier pour le moment. Cette fonctionnalité sera rétablie ultérieurement.');

  } catch (error: any) {
    console.error('YouTube API error:', error);
    throw new Error(`Impossible d'obtenir les informations de téléchargement: ${error.message}`);
  }
}
