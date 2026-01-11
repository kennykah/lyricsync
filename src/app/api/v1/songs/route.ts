import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';

// Mock data for development
const mockSongs = [
  {
    id: '1',
    title: 'Hosanna',
    artist_name: 'Ronn The Voice',
    album: 'Adorons',
    duration_seconds: 225,
    status: 'published',
    has_synced_lyrics: true,
  },
  {
    id: '2',
    title: 'Je Suis Ton Ami',
    artist_name: 'Dena Mwana',
    album: 'Souffle',
    duration_seconds: 312,
    status: 'published',
    has_synced_lyrics: true,
  },
  {
    id: '3',
    title: 'Nzambe Monene',
    artist_name: 'Moise Mbiye',
    album: 'Tango Na Yo',
    duration_seconds: 276,
    status: 'published',
    has_synced_lyrics: false,
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || 'published';

  try {
    // TODO: Replace with actual Supabase query
    // const supabase = await createClient();
    // const { data, error, count } = await supabase
    //   .from('songs')
    //   .select('id, title, artist_name, album, duration_seconds, status', { count: 'exact' })
    //   .eq('status', status)
    //   .range((page - 1) * limit, page * limit - 1)
    //   .order('created_at', { ascending: false });

    const filteredSongs = mockSongs.filter(s => s.status === status);
    const paginatedSongs = filteredSongs.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      songs: paginatedSongs,
      pagination: {
        page,
        limit,
        total: filteredSongs.length,
        totalPages: Math.ceil(filteredSongs.length / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}
