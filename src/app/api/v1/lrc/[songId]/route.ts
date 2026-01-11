import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';

// Mock data for development
const mockLrcData: Record<string, { time: number; text: string }[]> = {
  '1': [
    { time: 1.2, text: 'Père Dieu de gloire' },
    { time: 5.5, text: 'Ton amour nous inonde' },
    { time: 11.0, text: 'Hosanna, Hosanna' },
    { time: 18.35, text: 'Au plus haut des cieux' },
    { time: 24.0, text: 'Béni soit celui' },
    { time: 29.5, text: 'Qui vient au nom du Seigneur' },
  ],
  '2': [
    { time: 0.0, text: 'Je suis ton ami' },
    { time: 4.2, text: 'Celui qui sera toujours là' },
    { time: 8.8, text: 'Dans les moments difficiles' },
    { time: 13.1, text: 'Je te tiendrai la main' },
  ],
};

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
    // TODO: Replace with actual Supabase query
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .from('lrc_files')
    //   .select('synced_lyrics, lrc_raw, song:songs(title, artist_name)')
    //   .eq('song_id', songId)
    //   .single();

    const lyrics = mockLrcData[songId];

    if (!lyrics) {
      return NextResponse.json(
        { error: 'LRC not found for this song' },
        { status: 404 }
      );
    }

    // Return based on format
    if (format === 'lrc') {
      // Return raw LRC format
      const lrcContent = lyrics
        .map((line) => {
          const mins = Math.floor(line.time / 60);
          const secs = (line.time % 60).toFixed(2).padStart(5, '0');
          return `[${mins.toString().padStart(2, '0')}:${secs}]${line.text}`;
        })
        .join('\n');

      return new NextResponse(lrcContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
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
        },
      });
    }

    // Default: JSON format
    return NextResponse.json({
      song_id: songId,
      format: 'json',
      lyrics,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch LRC data' },
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
