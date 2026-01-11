import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    service: 'LyricSync API',
    endpoints: {
      lrc: '/api/v1/lrc/{song_id}',
      search: '/api/v1/lrc/search',
      songs: '/api/v1/songs',
      status: '/api/v1/status',
    },
  });
}
