import { NextResponse } from 'next/server';
import { getUserSavedSongsServer } from '../saved/route';
import { adminDatabases, DatabaseSong } from '@/lib/appwriteAdmin';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerAccessToken = url.searchParams.get('providerAccessToken');
  if (!providerAccessToken) {
    return NextResponse.json({ error: 'Missing tokens in query parameters' }, { status: 401 });
  }
  const data = await getUserSavedSongsServer(providerAccessToken);
  await adminDatabases.upsertDocuments("db", "songs", data.map((item) => ({
    spotify_id: item.track.id,
    album_name: item.track.album.name,
    artists: item.track.artists.map((artist) => artist.name).join(', '),
    elo: 0, // Default ELO value, can be updated later
    image_url: item.track.album.images[0]?.url || '',
    name: item.track.name,
  } satisfies DatabaseSong)))
  return NextResponse.json({ message: 'Hello from saved songs to db route' }, { status: 200 });
}
