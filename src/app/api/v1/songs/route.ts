import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || 'published';
  const search = searchParams.get('search') || '';
  const artistId = searchParams.get('artist_id');

  try {
    // Build query
    let query = supabase
      .from('songs')
      .select('id, title, slug, artist_name, album, duration_seconds, status, audio_url, created_at', { count: 'exact' });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by artist if provided
    if (artistId) {
      query = query.eq('artist_id', artistId);
    }

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,artist_name.ilike.%${search}%`);
    }

    // Pagination and ordering
    query = query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch songs', details: error.message },
        { status: 500 }
      );
    }

    // Check if songs have synced lyrics
    const songsWithLrcStatus = await Promise.all(
      (data || []).map(async (song) => {
        const { data: lrcData } = await supabase
          .from('lrc_files')
          .select('id')
          .eq('song_id', song.id)
          .single();

        return {
          ...song,
          has_synced_lyrics: !!lrcData,
        };
      })
    );

    return NextResponse.json({
      songs: songsWithLrcStatus,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artist_name, audio_url, lyrics_text, album, release_year, submitted_by } = body;

    // Validate required fields
    if (!title || !artist_name || !audio_url || !lyrics_text) {
      return NextResponse.json(
        { error: 'Missing required fields: title, artist_name, audio_url, lyrics_text' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data, error } = await supabase
      .from('songs')
      .insert([
        {
          title,
          slug,
          artist_name,
          audio_url,
          lyrics_text,
          album: album || null,
          release_year: release_year || null,
          submitted_by: submitted_by || null,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create song', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Song created successfully',
      song: data,
    }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
