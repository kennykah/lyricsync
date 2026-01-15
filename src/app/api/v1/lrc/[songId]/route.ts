import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RouteParams {
  params: Promise<{
    songId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { songId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';

  try {
    // Fetch LRC data from Supabase
    const { data: lrcData, error: lrcError } = await supabase
      .from('lrc_files')
      .select(`
        id,
        synced_lyrics,
        lrc_raw,
        ai_confidence_score,
        source,
        version,
        created_at,
        validated_at
      `)
      .eq('song_id', songId)
      .single();

    if (lrcError || !lrcData) {
      return NextResponse.json(
        { error: 'LRC not found for this song' },
        { status: 404 }
      );
    }

    // Fetch song info
    const { data: songData } = await supabase
      .from('songs')
      .select('title, artist_name, album, duration_seconds')
      .eq('id', songId)
      .single();

    const lyrics = lrcData.synced_lyrics as { time: number; text: string }[];

    // Return based on format
    if (format === 'lrc') {
      // Return raw LRC format
      let lrcContent = '';
      
      // Add metadata
      if (songData) {
        lrcContent += `[ti:${songData.title}]\n`;
        lrcContent += `[ar:${songData.artist_name}]\n`;
        if (songData.album) lrcContent += `[al:${songData.album}]\n`;
        if (songData.duration_seconds) {
          const mins = Math.floor(songData.duration_seconds / 60);
          const secs = songData.duration_seconds % 60;
          lrcContent += `[length:${mins}:${secs.toString().padStart(2, '0')}]\n`;
        }
        lrcContent += `[by:LyricSync]\n\n`;
      }
      
      // Add synced lyrics
      lrcContent += lyrics
        .map((line) => {
          const mins = Math.floor(line.time / 60);
          const secs = (line.time % 60).toFixed(2).padStart(5, '0');
          return `[${mins.toString().padStart(2, '0')}:${secs}]${line.text}`;
        })
        .join('\n');

      return new NextResponse(lrcContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${songData?.title || 'lyrics'}.lrc"`,
        },
      });
    }

    if (format === 'srt') {
      // Return SRT format (for video subtitles)
      const srtContent = lyrics
        .map((line, index) => {
          const startTime = formatSrtTime(line.time);
          const endTime = formatSrtTime(
            lyrics[index + 1]?.time || line.time + 3
          );
          return `${index + 1}\n${startTime} --> ${endTime}\n${line.text}\n`;
        })
        .join('\n');

      return new NextResponse(srtContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${songData?.title || 'lyrics'}.srt"`,
        },
      });
    }

    // Default: JSON format
    return NextResponse.json({
      song_id: songId,
      format: 'json',
      song: songData ? {
        title: songData.title,
        artist: songData.artist_name,
        album: songData.album,
        duration: songData.duration_seconds,
      } : null,
      lyrics,
      metadata: {
        source: lrcData.source,
        ai_confidence: lrcData.ai_confidence_score,
        version: lrcData.version,
        created_at: lrcData.created_at,
        validated_at: lrcData.validated_at,
      },
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update LRC for a song
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { songId } = await params;

  try {
    const body = await request.json();
    const { synced_lyrics, source, created_by } = body;

    // Validate required fields
    if (!synced_lyrics || !Array.isArray(synced_lyrics)) {
      return NextResponse.json(
        { error: 'Missing or invalid synced_lyrics array' },
        { status: 400 }
      );
    }

    // Validate synced_lyrics format
    const isValidFormat = synced_lyrics.every(
      (line: { time?: number; text?: string }) =>
        typeof line.time === 'number' && typeof line.text === 'string'
    );

    if (!isValidFormat) {
      return NextResponse.json(
        { error: 'Invalid synced_lyrics format. Each item must have time (number) and text (string)' },
        { status: 400 }
      );
    }

    // Generate LRC raw format
    const lrcRaw = synced_lyrics
      .map((line: { time: number; text: string }) => {
        const mins = Math.floor(line.time / 60);
        const secs = (line.time % 60).toFixed(2).padStart(5, '0');
        return `[${mins.toString().padStart(2, '0')}:${secs}]${line.text}`;
      })
      .join('\n');

    // Check if LRC already exists
    const { data: existingLrc } = await supabase
      .from('lrc_files')
      .select('id, version')
      .eq('song_id', songId)
      .single();

    let result;

    if (existingLrc) {
      // Update existing
      result = await supabase
        .from('lrc_files')
        .update({
          synced_lyrics,
          lrc_raw: lrcRaw,
          source: source || 'manual',
          version: (existingLrc.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('song_id', songId)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('lrc_files')
        .insert([
          {
            song_id: songId,
            synced_lyrics,
            lrc_raw: lrcRaw,
            source: source || 'manual',
            created_by: created_by || null,
            version: 1,
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save LRC data', details: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: existingLrc ? 'LRC updated successfully' : 'LRC created successfully',
      lrc: result.data,
    }, { status: existingLrc ? 200 : 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove LRC for a song
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { songId } = await params;

  try {
    const { error } = await supabase
      .from('lrc_files')
      .delete()
      .eq('song_id', songId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete LRC data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'LRC deleted successfully',
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms
    .toString()
    .padStart(3, '0')}`;
}
