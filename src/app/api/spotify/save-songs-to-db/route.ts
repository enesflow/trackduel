import { adminDatabases, DatabaseSong } from '@/lib/appwriteAdmin';
import { MISSING_TOKEN, nextError } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { fetchSpotifyAPI } from '@/lib/spotify';
import { SpotifyPlaylistWithMetadata } from '@/types/spotify';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { providerAccessToken, userID } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);
  const data = await fetchSpotifyAPI<SpotifyPlaylistWithMetadata>(
    '/me/tracks?limit=50',
    providerAccessToken
  );
  await adminDatabases.upsertDocuments("db", "songs", data.items.map((item) => ({
    user_id: userID,
    spotify_id: item.track.id,
    album_name: item.track.album.name,
    artists: item.track.artists.map((artist) => artist.name).join(', '),
    elo: 0, // Default ELO value, can be updated later
    image_url: item.track.album.images[0]?.url || '',
    name: item.track.name,
  } satisfies DatabaseSong)));
  return NextResponse.json({ message: `${data.total} songs saved to database successfully` }, { status: 200 });
}
